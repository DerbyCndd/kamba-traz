-- Kamba Traz · limite de tentativas (login, registo, recuperação) por IP e por email.
-- Cola em Supabase → SQL Editor → Run. Pode ser executado de novo.
-- Depois corre também supabase/secret.local.sql (ficheiro só teu, não vai para o git).
-- Só a app, que conhece o segredo, consegue gravar e ler tentativas. Quem usar a API directamente não consegue
-- gastar o limite de outras pessoas.

create table if not exists public.rate_limits (
  key text not null,
  at timestamptz not null default now()
);
create index if not exists rate_limits_key_idx on public.rate_limits (key, at desc);
create table if not exists public.rate_limit_secret (id int primary key default 1 check (id = 1), secret text not null);

alter table public.rate_limits enable row level security;
alter table public.rate_limit_secret enable row level security;
revoke all on public.rate_limits, public.rate_limit_secret from anon, authenticated;

create or replace function public.rl_ok(p_secret text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.rate_limit_secret where secret = p_secret and char_length(p_secret) >= 24);
$$;

-- Quantas tentativas houve com esta chave na janela (segundos).
create or replace function public.rl_count(p_secret text, p_key text, p_window int) returns int
language plpgsql security definer set search_path = public as $$
begin
  if not public.rl_ok(p_secret) then raise exception 'não autorizado' using errcode = '42501'; end if;
  return (select count(*)::int from public.rate_limits where key = p_key and at > now() - make_interval(secs => least(p_window, 86400)));
end $$;

-- Regista uma tentativa. Limpa as antigas de vez em quando.
create or replace function public.rl_hit(p_secret text, p_key text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.rl_ok(p_secret) then raise exception 'não autorizado' using errcode = '42501'; end if;
  insert into public.rate_limits (key) values (left(p_key, 100));
  if random() < 0.02 then delete from public.rate_limits where at < now() - interval '1 day'; end if;
end $$;

revoke execute on function public.rl_ok(text), public.rl_count(text, text, int), public.rl_hit(text, text) from public;
grant execute on function public.rl_count(text, text, int), public.rl_hit(text, text) to anon, authenticated;
