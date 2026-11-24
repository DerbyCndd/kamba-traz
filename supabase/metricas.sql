-- Kamba Traz · métricas do piloto (eventos sem dados pessoais).
-- Cola em Supabase → SQL Editor → Run (depois de offers.sql, ratings.sql e estados-entrega.sql). Pode ser executado de novo.
--
-- Cada evento guarda só: o tipo, o pedido (ou a entrega, em entrega_concluida), a viagem quando há par, e a hora.
-- Nada de nomes, contactos, moradas ou valores. Só a equipa lê.

create table if not exists public.pilot_events (
  id bigserial primary key,
  kind text not null check (kind in ('pedido_publicado', 'viagem_publicada', 'sugestao_mostrada', 'proposta_feita', 'acordo', 'entrega_concluida')),
  subject_id uuid not null,
  ref_id uuid,
  at timestamptz not null default now(),
  constraint pilot_events_once unique nulls not distinct (kind, subject_id, ref_id)
);
create index if not exists pilot_events_kind_at on public.pilot_events (kind, at);
alter table public.pilot_events enable row level security;
revoke all on public.pilot_events from anon, authenticated;
grant select on public.pilot_events to authenticated;
drop policy if exists pilot_events_admin_read on public.pilot_events;
create policy pilot_events_admin_read on public.pilot_events for select to authenticated using (public.is_admin());
-- Ninguém escreve à mão: só os gatilhos abaixo e log_suggestions.

create or replace function public.pilot_log(p_kind text, p_subject uuid, p_ref uuid, p_at timestamptz default now())
returns void language sql security definer set search_path = public as $$
  insert into public.pilot_events (kind, subject_id, ref_id, at) values (p_kind, p_subject, p_ref, coalesce(p_at, now()))
  on conflict on constraint pilot_events_once do nothing;
$$;
revoke execute on function public.pilot_log(text, uuid, uuid, timestamptz) from public, anon, authenticated; -- interna

-- Pedido e viagem publicados = aprovados pela equipa (passam a «aberto»). Os exemplos não contam.
create or replace function public.pilot_on_publish() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'aberto' and not coalesce(new.example, false) and (tg_op = 'INSERT' or old.status is distinct from 'aberto') then
    perform public.pilot_log(case when tg_table_name = 'requests' then 'pedido_publicado' else 'viagem_publicada' end, new.id, null);
  end if;
  return new;
end $$;
revoke execute on function public.pilot_on_publish() from public, anon, authenticated;
drop trigger if exists pilot_requests_trg on public.requests;
create trigger pilot_requests_trg after insert or update of status on public.requests for each row execute function public.pilot_on_publish();
drop trigger if exists pilot_trips_trg on public.trips;
create trigger pilot_trips_trg after insert or update of status on public.trips for each row execute function public.pilot_on_publish();

create or replace function public.pilot_on_offer() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.pilot_log('proposta_feita', new.request_id, new.trip_id);
  return new;
end $$;
revoke execute on function public.pilot_on_offer() from public, anon, authenticated;
drop trigger if exists pilot_offers_trg on public.offers;
create trigger pilot_offers_trg after insert on public.offers for each row execute function public.pilot_on_offer();

create or replace function public.pilot_on_deal() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and new.request_id is not null then
    perform public.pilot_log('acordo', new.request_id, new.trip_id);
  elsif tg_op = 'UPDATE' and new.status = 'entregue' and old.status is distinct from 'entregue' then
    perform public.pilot_log('entrega_concluida', new.id, null);
  end if;
  return new;
end $$;
revoke execute on function public.pilot_on_deal() from public, anon, authenticated;
drop trigger if exists pilot_deals_trg on public.deals;
create trigger pilot_deals_trg after insert or update of status on public.deals for each row execute function public.pilot_on_deal();

-- A app regista as sugestões que mostrou. Só conta pares em que quem pede é dono do pedido ou da viagem; no máximo 30 de cada vez.
create or replace function public.log_suggestions(p_requests uuid[], p_trips uuid[])
returns void language plpgsql security definer set search_path = public as $$
declare i int;
begin
  if auth.uid() is null or p_requests is null or p_trips is null then return; end if;
  for i in 1 .. least(coalesce(array_length(p_requests, 1), 0), coalesce(array_length(p_trips, 1), 0), 30) loop
    if exists (select 1 from public.requests r join public.trips t on t.id = p_trips[i]
               where r.id = p_requests[i] and auth.uid() in (r.user_id, t.user_id)) then
      perform public.pilot_log('sugestao_mostrada', p_requests[i], p_trips[i]);
    end if;
  end loop;
end $$;
revoke execute on function public.log_suggestions(uuid[], uuid[]) from public, anon;
grant  execute on function public.log_suggestions(uuid[], uuid[]) to authenticated;

-- Avaliação média (sem saber de quem): só para a equipa.
create or replace function public.pilot_rating_avg() returns numeric
language sql stable security definer set search_path = public as $$
  select case when public.is_admin() then (select round(avg(stars)::numeric, 1) from public.ratings) end;
$$;
revoke execute on function public.pilot_rating_avg() from public, anon;
grant  execute on function public.pilot_rating_avg() to authenticated;

-- Preenche com o que já aconteceu antes deste ficheiro (não repete o que já existe).
select public.pilot_log('pedido_publicado', id, null, created_at) from public.requests where status <> 'pendente' and status <> 'recusado' and not example;
select public.pilot_log('viagem_publicada', id, null, created_at) from public.trips where status <> 'pendente' and status <> 'recusado' and not example;
select public.pilot_log('proposta_feita', request_id, trip_id, created_at) from public.offers;
select public.pilot_log('acordo', request_id, trip_id, created_at) from public.deals where request_id is not null;
select public.pilot_log('entrega_concluida', id, null, coalesce(delivered_at, created_at)) from public.deals where status in ('entregue', 'liberado');
