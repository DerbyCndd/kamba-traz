-- Kamba Traz · pré-visualização pública para a página inicial (visitantes sem conta).
-- Cola em Supabase → SQL Editor → Run. Pode ser executado de novo.
-- Mostra só o essencial de entradas já aprovadas: rota, peso, data e valor. Nunca nome, contacto nem descrição do item.
create or replace view public.trips_preview with (security_barrier = true) as
  select origin, destination, travel_date, kg, per_kg, status, example
  from public.trips
  where status in ('aberto','cheia') and travel_date >= current_date;

create or replace view public.requests_preview with (security_barrier = true) as
  select origin, destination, category, kg, offer, deadline, status, example
  from public.requests
  where status = 'aberto';

revoke all on public.trips_preview, public.requests_preview from public;
grant select on public.trips_preview, public.requests_preview to anon, authenticated;
