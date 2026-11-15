-- Kamba Traz · números para o resumo diário da equipa (só contagens, nunca dados pessoais).
-- Corre no SQL Editor do Supabase (depois de rate-limit.sql e offers.sql). Pode ser executado de novo.
-- Só a app, que conhece o segredo (RATE_LIMIT_SECRET), consegue ler estes números.

create or replace function public.team_digest(p_secret text) returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.rl_ok(p_secret) then raise exception 'não autorizado' using errcode = '42501'; end if;
  return json_build_object(
    'trips_pending',      (select count(*) from public.trips where status = 'pendente' and not example),
    'requests_pending',   (select count(*) from public.requests where status = 'pendente' and not example),
    'old_pending',        (select (select count(*) from public.trips where status = 'pendente' and not example and created_at < now() - interval '24 hours')
                                + (select count(*) from public.requests where status = 'pendente' and not example and created_at < now() - interval '24 hours')),
    'identities_pending', (select count(*) from public.identities where status = 'pendente'),
    'agreements_waiting', (select count(*) from public.offers where status = 'aceite'),
    'offers_open',        (select count(*) from public.offers where status = 'aberta'),
    'deals_unpaid',       (select count(*) from public.deals where status = 'negociacao'),
    'deals_in_transit',   (select count(*) from public.deals where status = 'transito'),
    'new_accounts_24h',   (select count(*) from public.profiles where created_at > now() - interval '24 hours'),
    'login_attempts_24h', (select count(*) from public.rate_limits where key like 'login-%' and at > now() - interval '24 hours'),
    'signup_attempts_24h',(select count(*) from public.rate_limits where key like 'signup-%' and at > now() - interval '24 hours')
  );
end $$;

revoke execute on function public.team_digest(text) from public, anon, authenticated;
grant execute on function public.team_digest(text) to anon, authenticated;
