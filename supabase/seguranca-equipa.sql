-- Kamba Traz · segurança da equipa: registo permanente de acessos a documentos e autenticação em dois passos (2FA).
-- Cola em Supabase → SQL Editor → Run (depois de equipa.sql). Pode ser executado de novo.
--
--  1) REGISTO DE ACESSOS. Cada vez que alguém da equipa abre um BI, um passaporte, uma selfie, uma morada ou os familiares,
--     um bilhete ou uma fatura, fica guardado: quem, o quê, sobre quem e quando. Só o dono vê este registo, e ninguém o apaga
--     ou altera pela app. Antes, isto só ficava nos registos da Vercel, que guardam 30 minutos.
--  2) 2FA DA EQUIPA. O dono pode exigir um código da aplicação de autenticação (TOTP) a quem entra no painel. Com o interruptor
--     ligado, a base de dados deixa de considerar administrador quem não confirmou o código nesta sessão, mesmo falando
--     diretamente com a API. Vem DESLIGADO. O dono liga-o no painel (separador «Equipa») depois de ele próprio confirmar o 2FA.
--  Se alguma vez ficar trancado fora: no SQL Editor, "update public.config set staff_2fa = false where id = 1;".

-- ============ 1) Registo de acessos ============
create table if not exists public.access_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  staff_id uuid references public.profiles(id) on delete set null,
  action text not null check (char_length(action) <= 60),
  subject_id uuid,
  detail text check (detail is null or char_length(detail) <= 120)
);
create index if not exists access_log_at_idx on public.access_log (at desc);

alter table public.access_log enable row level security;
revoke all on public.access_log from anon, authenticated;
grant select on public.access_log to authenticated; -- só passa na política do dono; sem insert, update nem delete pela app

drop policy if exists access_log_owner_read on public.access_log;
create policy access_log_owner_read on public.access_log for select to authenticated using (public.is_owner());

-- A única forma de escrever no registo: só a equipa, sempre em nome próprio.
create or replace function public.log_access(p_action text, p_subject uuid, p_detail text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  insert into public.access_log (staff_id, action, subject_id, detail)
  values (auth.uid(), left(coalesce(p_action, ''), 60), p_subject, left(p_detail, 120));
end $$;
revoke execute on function public.log_access(text, uuid, text) from public, anon;
grant  execute on function public.log_access(text, uuid, text) to authenticated;

-- ============ 2) 2FA da equipa ============
alter table public.config add column if not exists staff_2fa boolean not null default false;

-- Só o dono liga ou desliga o interruptor (pela função abaixo). A equipa continua a poder mudar as definições do negócio,
-- mas não o interruptor, nem apagar ou criar a linha das definições.
revoke insert, delete on public.config from authenticated;
revoke update on public.config from authenticated;
grant update (commission, per_kg, whatsapp) on public.config to authenticated;
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'config' and column_name = 'new_account_limit_eur') then
    execute 'grant update (new_account_limit_eur) on public.config to authenticated';
  end if;
end $$;

-- A sessão passou o 2FA? (se o interruptor estiver desligado, sim)
create or replace function public._staff_aal_ok()
returns boolean language sql stable security definer set search_path = public as $$
  select not coalesce((select staff_2fa from public.config where id = 1), false) or coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;
revoke execute on function public._staff_aal_ok() from public, anon;
grant  execute on function public._staff_aal_ok() to authenticated;

-- Administrador = papel de administrador E (2FA desligado OU sessão com 2FA confirmado).
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') and public._staff_aal_ok();
$$;
create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_owner and role = 'admin' from public.profiles where id = auth.uid()), false) and public._staff_aal_ok();
$$;

-- Liga ou desliga a exigência de 2FA. Só o dono, e só com o 2FA dele já confirmado nesta sessão (prova de que funciona).
create or replace function public.set_staff_2fa(p_on boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'Só o dono da equipa pode fazer isto.' using errcode = '42501'; end if;
  if p_on and coalesce(auth.jwt() ->> 'aal', '') <> 'aal2' then
    raise exception 'Primeiro ativa e confirma o teu próprio 2FA, e volta a entrar com o código.' using errcode = 'P0001';
  end if;
  update public.config set staff_2fa = coalesce(p_on, false) where id = 1;
end $$;
revoke execute on function public.set_staff_2fa(boolean) from public, anon;
grant  execute on function public.set_staff_2fa(boolean) to authenticated;
