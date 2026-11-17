-- Kamba Traz · só o DONO escolhe quem é da equipa, pela app.
-- Cola em Supabase → SQL Editor → Run (depois de schema.sql e hardening.sql). Pode ser executado de novo.
--
--  * Há um DONO da equipa (profiles.is_owner). Só o dono acrescenta ou retira pessoas da equipa.
--  * O dono define-se uma só vez, no SQL Editor (ver o fim deste ficheiro). Nunca se muda pela app.
--  * Os outros administradores já não conseguem mudar papéis de ninguém, nem o seu.
--  * O dono nunca pode perder o acesso, nem por engano.
--  * Quem entra na equipa tem de se registar primeiro, com o email confirmado.
--  * Até correres este ficheiro, o separador «Equipa» não aparece (e nada quebra).

alter table public.profiles add column if not exists is_owner boolean not null default false;

-- É o dono? (administrador marcado como dono)
create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_owner and role = 'admin' from public.profiles where id = auth.uid()), false);
$$;
revoke execute on function public.is_owner() from public, anon;
grant  execute on function public.is_owner() to authenticated;

-- Só o dono muda papéis; ninguém muda quem é o dono pela app; o dono não perde o acesso.
-- O SQL Editor (onde não há sessão de utilizador) continua a poder tudo.
create or replace function public.protect_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.id is distinct from old.id then
    raise exception 'O identificador não pode mudar.' using errcode = '42501';
  end if;
  if auth.uid() is not null then
    if new.is_owner is distinct from old.is_owner then
      raise exception 'Sem permissão para alterar o dono.' using errcode = '42501';
    end if;
    if new.role is distinct from old.role then
      if not public.is_owner() then
        raise exception 'Só o dono da equipa pode alterar papéis.' using errcode = '42501';
      end if;
      if old.is_owner then
        raise exception 'O dono não pode perder o acesso.' using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.protect_role() from public, anon, authenticated;
drop trigger if exists protect_role_trg on public.profiles;
create trigger protect_role_trg before update on public.profiles
  for each row execute function public.protect_role();

-- A equipa atual, com o email (só o dono a vê).
create or replace function public.team_list()
returns table (id uuid, email text, full_name text, role text, is_owner boolean)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_owner() then raise exception 'Só o dono da equipa vê isto.' using errcode = '42501'; end if;
  return query
    select p.id, u.email::text, p.full_name, p.role, p.is_owner
    from public.profiles p join auth.users u on u.id = p.id
    where p.role = 'admin'
    order by p.is_owner desc, u.email;
end $$;
revoke execute on function public.team_list() from public, anon;
grant  execute on function public.team_list() to authenticated;

-- Acrescenta (true) ou retira (false) uma pessoa da equipa, pelo email. Só o dono.
create or replace function public.team_set_role(p_email text, p_admin boolean)
returns void language plpgsql security definer set search_path = public, auth as $$
declare uid uuid; confirmed timestamptz; owner_row boolean;
begin
  if not public.is_owner() then raise exception 'Só o dono da equipa pode fazer isto.' using errcode = '42501'; end if;
  select u.id, u.email_confirmed_at into uid, confirmed from auth.users u where lower(u.email) = lower(btrim(coalesce(p_email, '')));
  if uid is null then raise exception 'Não há nenhuma conta com este email. A pessoa tem de se registar primeiro.' using errcode = 'P0001'; end if;
  if p_admin and confirmed is null then raise exception 'Esta conta ainda não confirmou o email.' using errcode = 'P0001'; end if;
  select is_owner into owner_row from public.profiles where id = uid;
  if coalesce(owner_row, false) then raise exception 'Não podes alterar o dono da equipa.' using errcode = 'P0001'; end if;
  update public.profiles set role = case when p_admin then 'admin' else 'user' end where id = uid;
  if not found then raise exception 'Esta conta ainda não tem perfil.' using errcode = 'P0001'; end if;
end $$;
revoke execute on function public.team_set_role(text, boolean) from public, anon;
grant  execute on function public.team_set_role(text, boolean) to authenticated;

-- ============ DEFINIR O DONO (corre uma só vez, com o email do dono; não vai para o código) ============
-- update public.profiles set role = 'admin', is_owner = true
--   where id = (select id from auth.users where email = 'EMAIL_DO_DONO');
