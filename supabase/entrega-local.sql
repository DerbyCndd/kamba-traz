-- Kamba Traz · onde a encomenda muda de mãos: o entregador vai buscar, ou quem envia leva ao entregador.
-- Cola em Supabase → SQL Editor → Run (depois de contactos.sql). Pode ser executado de novo.
--
--  * Quem envia escolhe como prefere: "buscar" (o entregador vem buscar à morada que indica) ou "levar" (leva a encomenda
--    ao entregador, sem precisar de indicar a sua morada).
--  * Quem viaja pode indicar, ao registar a viagem, onde recebe encomendas (morada, notas e mapa). Fica guardado na viagem.
--  * Depois de o pagamento ficar retido (e só até a entrega ser confirmada), quem envia vê onde o entregador recebe, e o entregador
--    vê onde pegar a encomenda. Antes disso ninguém vê a morada da outra parte.
--  * Até correres este ficheiro, a app continua a pedir só o local de recolha (e nada quebra).

alter table public.requests add column if not exists handover text not null default 'buscar' check (handover in ('buscar', 'levar'));

alter table public.trips add column if not exists dropoff_address text check (dropoff_address is null or char_length(dropoff_address) between 8 and 300);
alter table public.trips add column if not exists dropoff_notes text check (dropoff_notes is null or char_length(dropoff_notes) <= 300);
alter table public.trips add column if not exists dropoff_map text check (dropoff_map is null or (char_length(dropoff_map) <= 300 and dropoff_map ~* '^https?://'));

-- O dono da viagem indica onde recebe encomendas (a app chama isto logo a seguir a registar a viagem).
create or replace function public.set_trip_dropoff(p_trip uuid, p_address text, p_notes text, p_map text)
returns void language plpgsql security definer set search_path = public as $$
declare a text := nullif(btrim(coalesce(p_address, '')), ''); n text := nullif(btrim(coalesce(p_notes, '')), ''); m text := nullif(btrim(coalesce(p_map, '')), '');
begin
  if auth.uid() is null then raise exception 'Entra na tua conta.' using errcode = '42501'; end if;
  if not exists (select 1 from public.trips where id = p_trip and user_id = auth.uid()) then
    raise exception 'Só o dono da viagem pode indicar onde recebe encomendas.' using errcode = '42501';
  end if;
  if a is not null and char_length(a) < 8 then raise exception 'Escreve a morada completa.' using errcode = '22023'; end if;
  update public.trips set dropoff_address = a, dropoff_notes = n, dropoff_map = m where id = p_trip;
end $$;
revoke execute on function public.set_trip_dropoff(uuid, text, text, text) from public, anon;
grant  execute on function public.set_trip_dropoff(uuid, text, text, text) to authenticated;

-- Contactos e locais de uma entrega ativa (pagamento retido ou em trânsito). Só as duas partes, uma linha cada.
--  * O entregador recebe o contacto de quem envia, como a encomenda muda de mãos, o local de recolha (se for ele a ir buscar) e quem recebe em Angola.
--  * Quem envia recebe o contacto do entregador e, se ele o indicou, onde recebe encomendas.
drop function if exists public.deal_contacts(uuid);
create function public.deal_contacts(p_deal uuid)
returns table (
  as_role text, other_name text, other_phone text, handover text,
  pickup_address text, pickup_notes text, pickup_map text,
  recipient_name text, recipient_phone text, recipient_address text,
  dropoff_address text, dropoff_notes text, dropoff_map text
)
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); d public.deals%rowtype; r public.requests%rowtype; t public.trips%rowtype;
begin
  if me is null then return; end if;
  select * into d from public.deals where id = p_deal;
  if not found or d.status not in ('garantia', 'transito') then return; end if;
  if d.traveler_id = me then
    select * into r from public.requests where id = d.request_id;
    if not found then return; end if;
    return query select 'traveler'::text, r.name, r.contact, r.handover,
      case when r.handover = 'buscar' then r.pickup_address end, case when r.handover = 'buscar' then r.pickup_notes end, case when r.handover = 'buscar' then r.pickup_map end,
      r.recipient_name, r.recipient_phone, r.recipient_address, null::text, null::text, null::text;
  elsif d.sender_id = me then
    select * into r from public.requests where id = d.request_id;
    select * into t from public.trips where id = d.trip_id;
    if not found then return; end if;
    return query select 'sender'::text, t.name, t.contact, coalesce(r.handover, 'buscar'),
      null::text, null::text, null::text, null::text, null::text, null::text, t.dropoff_address, t.dropoff_notes, t.dropoff_map;
  end if;
end $$;
revoke execute on function public.deal_contacts(uuid) from public, anon;
grant  execute on function public.deal_contacts(uuid) to authenticated;
