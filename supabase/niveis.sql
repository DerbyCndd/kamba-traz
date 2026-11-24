-- Kamba Traz · verificação por níveis.
-- Cola em Supabase → SQL Editor → Run (depois de identity.sql, contactos.sql, selfie.sql, photos.sql e offers.sql). Pode ser executado de novo.
--
--  Nível 1 (publicar um pedido): identificação (BI e telefone), selfie a segurar o BI, morada e familiares.
--  Nível 2 (publicar uma viagem, ou aceitar levar um pedido): o nível 1, mais passaporte e foto de perfil.
--  A app mostra o que falta; aqui a base de dados garante a regra mesmo para quem fale com a API diretamente.

create or replace function public.verification_level(p_user uuid) returns int
language sql stable security definer set search_path = public as $$
  select case
    when i.user_id is null or i.bi_enc is null or i.selfie_path is null or i.address_enc is null or i.family_enc is null then 0
    when i.passport_enc is not null and i.passport_photo_path is not null and p.photo_path is not null then 2
    else 1
  end
  from (select p_user as uid) u
  left join public.identities i on i.user_id = u.uid
  left join public.profiles p on p.id = u.uid
  where p_user = auth.uid() or public.is_admin(); -- só responde sobre a própria pessoa (ou à equipa); de outra pessoa devolve nulo
$$;
-- As regras de acesso chamam-na com os privilégios de quem faz o pedido, por isso tem de estar disponível a authenticated.
revoke execute on function public.verification_level(uuid) from public, anon;
grant  execute on function public.verification_level(uuid) to authenticated;

-- A própria pessoa pergunta o seu nível.
create or replace function public.my_verification_level() returns int
language sql stable security definer set search_path = public as $$
  select case when auth.uid() is null then 0 else public.verification_level(auth.uid()) end;
$$;
revoke execute on function public.my_verification_level() from public, anon;
grant  execute on function public.my_verification_level() to authenticated;

-- Publicar um pedido: nível 1.
drop policy if exists requests_owner_insert on public.requests;
create policy requests_owner_insert on public.requests for insert to authenticated
  with check (user_id = auth.uid() and status = 'pendente' and example = false and coalesce(public.verification_level(auth.uid()), 0) >= 1);

-- Publicar uma viagem: nível 2 (a função já pedia passaporte e foto; agora pede o nível completo).
create or replace function public.submit_trip(
  p_name text, p_contact text, p_origin text, p_destination text,
  p_travel_date date, p_return_date date, p_flight text, p_kg numeric, p_per_kg int,
  p_ticket_path text
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare tid uuid; fname text;
begin
  if auth.uid() is null then raise exception 'Entra na tua conta.' using errcode = '42501'; end if;
  select full_name into fname from public.identities where user_id = auth.uid();
  if fname is null then raise exception 'Completa primeiro a tua identificação.' using errcode = 'P0001'; end if;
  if coalesce(public.verification_level(auth.uid()), 0) < 2 then
    raise exception 'Para viajar precisas do nível 2 de verificação: identificação, selfie com o BI, morada e familiares, passaporte e foto de perfil.' using errcode = 'P0001';
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

-- Propostas: quem viaja (propor a um pedido, ou aceitar a proposta de quem envia) precisa do nível 2; quem envia, do nível 1.
-- Um gatilho guarda a regra sem mexer nas funções make_offer e respond_offer.
create or replace function public.offers_level_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.from_role = 'traveler' and coalesce(public.verification_level(new.from_user), 0) < 2 then
      raise exception 'Para propor levar uma encomenda precisas do nível 2 de verificação (passaporte e foto de perfil incluídos). Vê o que falta em Meu perfil.' using errcode = 'P0001';
    elsif new.from_role = 'requester' and coalesce(public.verification_level(new.from_user), 0) < 1 then
      raise exception 'Para propor precisas do nível 1 de verificação. Vê o que falta em Meu perfil.' using errcode = 'P0001';
    end if;
  elsif new.status = 'aceite' and old.status is distinct from 'aceite' then
    if new.from_role = 'requester' and coalesce(public.verification_level(new.to_user), 0) < 2 then
      raise exception 'Para aceitar levar esta encomenda precisas do nível 2 de verificação. Vê o que falta em Meu perfil.' using errcode = 'P0001';
    elsif new.from_role = 'traveler' and coalesce(public.verification_level(new.to_user), 0) < 1 then
      raise exception 'Para aceitar precisas do nível 1 de verificação. Vê o que falta em Meu perfil.' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.offers_level_guard() from public, anon, authenticated;
drop trigger if exists offers_level_guard_trg on public.offers;
create trigger offers_level_guard_trg before insert or update on public.offers
  for each row execute function public.offers_level_guard();
