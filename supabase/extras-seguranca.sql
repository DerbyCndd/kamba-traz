-- Kamba Traz · termos aceites (prova) e foto de perfil obrigatória para viajar.
-- Cola em Supabase → SQL Editor → Run (depois de identity.sql, viajar-passaporte.sql e photos.sql). Pode ser executado de novo.
--
--  1) TERMOS ACEITES. Quando alguém cria conta, fica guardado qual a versão dos termos e da privacidade que aceitou, e quando.
--     É a prova, num litígio, de que aceitou (e o quê). Quem já tinha conta antes disto não tem registo.
--     Se o registo falhar por qualquer razão, a criação da conta NÃO é bloqueada.
--  2) FOTO PARA VIAJAR. Quem viaja tem de ter foto de perfil. A função que regista a viagem passa a recusar quem não a tem,
--     mesmo que alguém fale com a base de dados diretamente. Mantém também a exigência do passaporte.
--  Até correres este ficheiro, a app avisa na mesma, mas a regra vale só na app.

-- ============ 1) Termos aceites ============
create table if not exists public.terms_acceptance (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  terms_version text not null check (char_length(terms_version) <= 40),
  privacy_version text not null check (char_length(privacy_version) <= 40),
  accepted_at timestamptz not null default now()
);
create index if not exists terms_acceptance_user_idx on public.terms_acceptance (user_id, accepted_at desc);

alter table public.terms_acceptance enable row level security;
revoke all on public.terms_acceptance from anon, authenticated;
grant select on public.terms_acceptance to authenticated; -- sem insert, update nem delete pela app
drop policy if exists terms_acceptance_read on public.terms_acceptance;
create policy terms_acceptance_read on public.terms_acceptance for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Ao criar a conta, a app envia as versões aceites junto dos dados do registo; este gatilho guarda-as.
create or replace function public.record_terms_acceptance()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.raw_user_meta_data ? 'terms_version' then
    insert into public.terms_acceptance (user_id, terms_version, privacy_version)
    values (new.id, left(new.raw_user_meta_data ->> 'terms_version', 40),
            left(coalesce(new.raw_user_meta_data ->> 'privacy_version', new.raw_user_meta_data ->> 'terms_version'), 40));
  end if;
  return new;
exception when others then
  return new; -- nunca bloqueia a criação da conta
end $$;
revoke execute on function public.record_terms_acceptance() from public, anon, authenticated;
drop trigger if exists on_auth_user_terms on auth.users;
create trigger on_auth_user_terms after insert on auth.users
  for each row execute function public.record_terms_acceptance();

-- ============ 2) Foto de perfil para viajar (e passaporte, como antes) ============
create or replace function public.submit_trip(
  p_name text, p_contact text, p_origin text, p_destination text,
  p_travel_date date, p_return_date date, p_flight text, p_kg numeric, p_per_kg int,
  p_ticket_path text
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare tid uuid; fname text; has_pp boolean; has_photo boolean;
begin
  if auth.uid() is null then raise exception 'Entra na tua conta.' using errcode = '42501'; end if;
  select full_name, (passport_enc is not null and passport_photo_path is not null) into fname, has_pp
  from public.identities where user_id = auth.uid();
  if fname is null then raise exception 'Completa primeiro a tua identificação.' using errcode = 'P0001'; end if;
  if not coalesce(has_pp, false) then
    raise exception 'Para viajar, regista primeiro o teu passaporte (número e fotos) na identificação.' using errcode = 'P0001';
  end if;
  select (photo_path is not null) into has_photo from public.profiles where id = auth.uid();
  if not coalesce(has_photo, false) then
    raise exception 'Para viajar, adiciona primeiro a tua foto de perfil em Meu perfil.' using errcode = 'P0001';
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
