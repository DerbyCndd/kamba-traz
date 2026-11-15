-- Kamba Traz · só se regista uma viagem com o passaporte já registado.
-- Cola em Supabase → SQL Editor → Run (depois de identity.sql). Pode ser executado de novo.
--
--  * Na identificação, o passaporte é opcional (quem só quer enviar não precisa dele).
--  * Mas quem viaja tem de ter o passaporte registado (número e fotos), para a equipa o conferir com o bilhete.
--  * Esta função passa a recusar a viagem de quem não tem passaporte, mesmo que alguém fale com a base diretamente.
--  * O passaporte registado tem sempre foto: a tabela identities exige que passport_enc e passport_photo_path andem juntos.

create or replace function public.submit_trip(
  p_name text, p_contact text, p_origin text, p_destination text,
  p_travel_date date, p_return_date date, p_flight text, p_kg numeric, p_per_kg int,
  p_ticket_path text
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare tid uuid; fname text; has_pp boolean;
begin
  if auth.uid() is null then raise exception 'Entra na tua conta.' using errcode = '42501'; end if;
  select full_name, (passport_enc is not null and passport_photo_path is not null) into fname, has_pp
  from public.identities where user_id = auth.uid();
  if fname is null then raise exception 'Completa primeiro a tua identificação.' using errcode = 'P0001'; end if;
  if not coalesce(has_pp, false) then
    raise exception 'Para viajar, regista primeiro o teu passaporte (número e fotos) na identificação.' using errcode = 'P0001';
  end if;
  insert into public.trips (user_id, name, contact, origin, destination, travel_date, return_date, flight, kg, per_kg)
  values (auth.uid(), p_name, p_contact, p_origin, p_destination, p_travel_date, p_return_date, coalesce(p_flight, ''), p_kg, p_per_kg)
  returning id into tid;
  insert into public.traveler_docs (trip_id, user_id, full_name, ticket_path, outbound_date, return_date)
  values (tid, auth.uid(), fname, p_ticket_path, p_travel_date, p_return_date);
  return tid;
end $$;
revoke execute on function public.submit_trip(text, text, text, text, date, date, text, numeric, int, text) from public, anon;
grant  execute on function public.submit_trip(text, text, text, text, date, date, text, numeric, int, text) to authenticated;
