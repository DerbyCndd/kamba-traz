-- Kamba Traz · reforço de segurança da base de dados.
-- Cola em Supabase → SQL Editor → Run (depois de schema.sql). Pode ser executado de novo.
-- Porquê: a chave pública do Supabase vai no browser, por isso qualquer pessoa pode falar
-- directamente com a API da base de dados sem passar pela app. Estas regras valem em ambos os casos.

-- 1) Anónimos não têm acesso nenhum às tabelas; autenticados não podem esvaziar nem alterar a estrutura.
revoke all on public.profiles, public.config, public.trips, public.requests, public.deals from anon;
revoke truncate, references, trigger on public.profiles, public.config, public.trips, public.requests, public.deals from authenticated;

-- 2) Funções internas: só quem precisa pode executá-las.
revoke execute on function public.is_admin() from public, anon;
grant  execute on function public.is_admin() to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 3) Ninguém sobe a administrador sozinho (nem por uma política mal escrita no futuro).
--    Só a equipa, ou o SQL Editor (onde não há sessão de utilizador), pode mudar o papel.
create or replace function public.protect_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'Sem permissão para alterar o papel.' using errcode = '42501';
  end if;
  if new.id is distinct from old.id then
    raise exception 'O identificador não pode mudar.' using errcode = '42501';
  end if;
  return new;
end $$;
revoke execute on function public.protect_role() from public, anon, authenticated;
drop trigger if exists protect_role_trg on public.profiles;
create trigger protect_role_trg before update on public.profiles
  for each row execute function public.protect_role();

-- 4) Limites ao nível da base de dados (a app já os aplica, mas a API directa contornava-os).
create or replace function public.limit_submissions()
returns trigger language plpgsql security definer set search_path = public as $$
declare pend int; recent int;
begin
  if auth.uid() is null or public.is_admin() then return new; end if;
  select (select count(*) from public.trips    where user_id = new.user_id and status = 'pendente')
       + (select count(*) from public.requests where user_id = new.user_id and status = 'pendente') into pend;
  select (select count(*) from public.trips    where user_id = new.user_id and created_at > now() - interval '1 day')
       + (select count(*) from public.requests where user_id = new.user_id and created_at > now() - interval '1 day') into recent;
  if pend >= 10 or recent >= 20 then
    raise exception 'Limite de entradas atingido. Tenta mais tarde.' using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke execute on function public.limit_submissions() from public, anon, authenticated;
drop trigger if exists limit_trips_trg on public.trips;
create trigger limit_trips_trg before insert on public.trips for each row execute function public.limit_submissions();
drop trigger if exists limit_requests_trg on public.requests;
create trigger limit_requests_trg before insert on public.requests for each row execute function public.limit_submissions();

-- 5) Valores válidos garantidos pela própria base de dados.
do $$
declare c record;
begin
  for c in select * from (values
    ('trips',    'trips_origin_chk',   $c$origin in ('LIS','OPO','FAO','GRU','DXB','JNB','CDG','LHR','OTH')$c$),
    ('trips',    'trips_dest_chk',     $c$destination in ('LAD','BUG','SDD','NOV','CAB','OTH')$c$),
    ('trips',    'trips_contact_chk',  $c$contact ~ '^[0-9+() .-]{9,30}$' or example$c$),
    ('requests', 'req_origin_chk',     $c$origin in ('LIS','OPO','FAO','GRU','DXB','JNB','CDG','LHR','OTH')$c$),
    ('requests', 'req_dest_chk',       $c$destination in ('LAD','BUG','SDD','NOV','CAB','OTH')$c$),
    ('requests', 'req_category_chk',   $c$char_length(category) <= 60$c$),
    ('requests', 'req_contact_chk',    $c$contact ~ '^[0-9+() .-]{9,30}$' or example$c$),
    ('requests', 'req_value_chk',      $c$item_value <= 1000000$c$),
    ('requests', 'req_offer_chk',      $c$offer <= 100000000$c$),
    ('trips',    'trips_perkg_chk',    $c$per_kg <= 10000000$c$),
    ('deals',    'deals_price_chk',    $c$price <= 1000000000 and commission_pct between 0 and 50 and commission >= 0$c$),
    ('config',   'config_wa_chk',      $c$char_length(whatsapp) <= 30$c$)
  ) as t(tbl, nm, expr)
  loop
    if not exists (select 1 from pg_constraint where conname = c.nm) then
      execute format('alter table public.%I add constraint %I check (%s) not valid', c.tbl, c.nm, c.expr);
    end if;
  end loop;
end $$;
-- "not valid" protege tudo o que entrar a partir de agora sem falhar por dados antigos.

-- 6) Vistas públicas: impede fugas de colunas privadas através de funções maliciosas em filtros.
alter view public.trips_public    set (security_barrier = true);
alter view public.requests_public set (security_barrier = true);
