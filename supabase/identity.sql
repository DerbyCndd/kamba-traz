-- Kamba Traz · identificação feita uma só vez, no cadastro (BI + telefone; passaporte opcional).
-- Corre no SQL Editor do Supabase (depois de verification.sql). Pode ser executado de novo.
--
--  * Cada pessoa tem UMA identificação, que serve para pedir envios e para viajar: não se pede de novo.
--  * Os números do BI e do passaporte são CIFRADOS pela app (AES-256-GCM, chave PII_KEY) antes de chegarem aqui.
--  * As fotos ficam num armazenamento PRIVADO (bucket "ids"): só o dono e a equipa.
--  * O estado (pendente/confirmado/recusado) só a equipa o muda; qualquer alteração do dono volta a "pendente".

create table if not exists public.identities (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 3 and 80),
  phone text not null check (char_length(phone) between 9 and 30),
  bi_enc text not null check (char_length(bi_enc) between 20 and 400),
  bi_last4 text not null check (char_length(bi_last4) = 4),
  bi_photo_path text not null,
  passport_enc text check (passport_enc is null or char_length(passport_enc) between 20 and 400),
  passport_last4 text check (passport_last4 is null or char_length(passport_last4) = 4),
  passport_photo_path text,
  status text not null default 'pendente' check (status in ('pendente', 'confirmado', 'recusado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (bi_photo_path like user_id::text || '/%'),
  check (passport_photo_path is null or passport_photo_path like user_id::text || '/%'),
  check ((passport_enc is null) = (passport_photo_path is null))
);

alter table public.identities enable row level security;
revoke all on public.identities from anon, authenticated;
grant select on public.identities to authenticated;
-- O dono escreve só os dados; o estado fica de fora (só a equipa o muda, por baixo).
grant insert (user_id, full_name, phone, bi_enc, bi_last4, bi_photo_path, passport_enc, passport_last4, passport_photo_path) on public.identities to authenticated;
grant update (user_id, full_name, phone, bi_enc, bi_last4, bi_photo_path, passport_enc, passport_last4, passport_photo_path) on public.identities to authenticated;
grant update (status) on public.identities to authenticated; -- só passa nas políticas da equipa

drop policy if exists ident_read on public.identities;
create policy ident_read on public.identities for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists ident_insert_own on public.identities;
create policy ident_insert_own on public.identities for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists ident_update_own on public.identities;
create policy ident_update_own on public.identities for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists ident_admin on public.identities;
create policy ident_admin on public.identities for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Quem não é da equipa não consegue mudar o estado: volta sempre a "pendente" quando edita.
create or replace function public.ident_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if not public.is_admin() then new.status := 'pendente'; end if;
  return new;
end $$;
drop trigger if exists ident_guard_trg on public.identities;
create trigger ident_guard_trg before insert or update on public.identities
  for each row execute function public.ident_guard();

-- ============ Fotos do BI e do passaporte: armazenamento privado ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ids', 'ids', false, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 3145728, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists ids_insert_own on storage.objects;
create policy ids_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'ids' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists ids_read on storage.objects;
create policy ids_read on storage.objects for select to authenticated
  using (bucket_id = 'ids' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
drop policy if exists ids_delete_own on storage.objects;
create policy ids_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'ids' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============ Viagem: já não pede o passaporte (a identificação é a do cadastro) ============
alter table public.traveler_docs alter column passport_enc drop not null;
alter table public.traveler_docs alter column passport_last4 drop not null;

drop function if exists public.submit_trip(text, text, text, text, date, date, text, numeric, int, text, text, text, text);
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
  insert into public.trips (user_id, name, contact, origin, destination, travel_date, return_date, flight, kg, per_kg)
  values (auth.uid(), p_name, p_contact, p_origin, p_destination, p_travel_date, p_return_date, coalesce(p_flight, ''), p_kg, p_per_kg)
  returning id into tid;
  insert into public.traveler_docs (trip_id, user_id, full_name, ticket_path, outbound_date, return_date)
  values (tid, auth.uid(), fname, p_ticket_path, p_travel_date, p_return_date);
  return tid;
end $$;
revoke execute on function public.submit_trip(text, text, text, text, date, date, text, numeric, int, text) from public, anon;
grant execute on function public.submit_trip(text, text, text, text, date, date, text, numeric, int, text) to authenticated;
