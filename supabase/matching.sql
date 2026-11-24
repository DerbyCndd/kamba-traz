-- Kamba Traz · emparelhamento automático (viagens sugeridas e pedidos que cabem na mala).
-- Cola em Supabase → SQL Editor → Run (depois de schema.sql, delivery.sql e ratings.sql). Pode ser executado de novo.
--
--  * A lógica de pontuação está na app (src/lib/matching.ts). Aqui só se dão ao servidor os dados que as vistas públicas
--    não têm, e nunca contactos nem nomes completos:
--    - match_trip_stats: por viagem aberta, quantas entregas o viajante já concluiu e o valor (em euros) que a viagem
--      já leva, para não passar o limite da alfândega.
--    - match_open_requests: os pedidos abertos com o valor do item arredondado a 10 € (para o mesmo limite).
--      Só para quem tem uma viagem sua aberta, ou para a equipa.
--  * Até correres este ficheiro, as sugestões aparecem na mesma, mas sem estes dados (o limite da alfândega volta a ser
--    confirmado pela equipa ao criar a entrega).

create or replace function public.match_trip_stats(p_trips uuid[])
returns table (trip_id uuid, deals_done int, committed_eur numeric)
language sql stable security definer set search_path = public as $$
  select t.id,
         (select count(*)::int from public.deals d where d.traveler_id = t.user_id and d.status in ('entregue', 'liberado')),
         coalesce((select sum(r.item_value) from public.deals d join public.requests r on r.id = d.request_id
                   where d.trip_id = t.id and d.status <> 'cancelado'), 0)
  from public.trips t
  where auth.uid() is not null and t.id = any(p_trips) and t.status in ('aberto', 'cheia');
$$;
revoke execute on function public.match_trip_stats(uuid[]) from public, anon;
grant  execute on function public.match_trip_stats(uuid[]) to authenticated;

create or replace function public.match_open_requests()
returns table (id uuid, origin text, destination text, item text, category text, kg numeric, offer int, deadline date, name text, value_eur numeric)
language sql stable security definer set search_path = public as $$
  select r.id, r.origin, r.destination, r.item, r.category, r.kg, r.offer, r.deadline,
         split_part(r.name, ' ', 1), ceil(r.item_value / 10) * 10
  from public.requests r
  where auth.uid() is not null
    and r.status = 'aberto' and not r.example and r.user_id <> auth.uid()
    and (public.is_admin() or exists (select 1 from public.trips t where t.user_id = auth.uid() and t.status = 'aberto'));
$$;
revoke execute on function public.match_open_requests() from public, anon;
grant  execute on function public.match_open_requests() to authenticated;
