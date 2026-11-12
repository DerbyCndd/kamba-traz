-- Kamba Traz · identificação de quem leva as entregas (viajantes).
-- Cola em Supabase → SQL Editor → Run (depois de schema.sql). Pode ser executado de novo.
--
-- O que guarda, por viagem: nome como no passaporte, número do passaporte, foto do bilhete de avião,
-- data de ida e data de regresso. A equipa confirma tudo antes de a viagem ser publicada.
--
-- Protecção:
--  * A foto do bilhete fica num armazenamento PRIVADO (bucket "tickets"): só o dono e a equipa a vêem.
--  * O número do passaporte é CIFRADO pela app (AES-256-GCM) antes de chegar aqui: esta base só guarda o texto cifrado
--    e os últimos 4 caracteres. A chave (PII_KEY) fica só nas variáveis de ambiente da app.
--  * Só a equipa lê os documentos de todos; cada viajante só vê o estado dos seus.

-- ============ Data de regresso na viagem ============
alter table public.trips add column if not exists return_date date;
do $$ begin 
  if not exists (select 1 from pg_constraint where conname = 'trips_return_chk') then
    alter table public.trips add constraint trips_return_chk check (return_date is null or return_date >= travel_date) not valid;
  end if;
end $$;

-- ============ Documentos do viajante ============
create table if not exists public.traveler_docs (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null unique references public.trips(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 3 and 80),
  passport_enc text not null check (char_length(passport_enc) between 20 and 400),
  passport_last4 text not null check (char_length(passport_last4) = 4),
  ticket_path text not null,
  outbound_date date not null,
  return_date date not null check (return_date >= outbound_date),
  status text not null default 'pendente' check (status in ('pendente', 'confirmado', 'recusado')),
  note text not null default '' check (char_length(note) <= 300),
  created_at timestamptz not null default now(),
  check (ticket_path like user_id::text || '/%')
);
create index if not exists traveler_docs_user_idx on public.traveler_docs (user_id);

alter table public.traveler_docs enable row level security;
revoke all on public.traveler_docs from anon, authenticated;
grant select, insert on public.traveler_docs to authenticated;
grant update on public.traveler_docs to authenticated; -- só a equipa passa nas políticas

-- O viajante cria os seus (sempre "pendente", para uma viagem dele); lê só os seus; a equipa lê e muda tudo.
drop policy if exists docs_owner_insert on public.traveler_docs;
create policy docs_owner_insert on public.traveler_docs for insert to authenticated
  with check (
    user_id = auth.uid() and status = 'pendente'
    and exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())
  );
drop policy if exists docs_owner_read on public.traveler_docs;
create policy docs_owner_read on public.traveler_docs for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists docs_admin_write on public.traveler_docs;
create policy docs_admin_write on public.traveler_docs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ============ Foto do bilhete: armazenamento privado ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tickets', 'tickets', false, 4194304, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Cada pessoa só escreve na sua pasta (o nome do ficheiro começa pelo seu identificador).
drop policy if exists tickets_insert_own on storage.objects;
create policy tickets_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'tickets' and (storage.foldername(name))[1] = auth.uid()::text);
-- Lê o dono e a equipa.
drop policy if exists tickets_read on storage.objects;
create policy tickets_read on storage.objects for select to authenticated
  using (bucket_id = 'tickets' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
-- O dono só apaga um ficheiro que ainda não esteja ligado a nenhuma viagem (limpeza de um envio que falhou).
drop policy if exists tickets_delete_orphan on storage.objects;
create policy tickets_delete_orphan on storage.objects for delete to authenticated
  using (
    bucket_id = 'tickets' and (storage.foldername(name))[1] = auth.uid()::text
    and not exists (select 1 from public.traveler_docs d where d.ticket_path = name)
  );
drop policy if exists tickets_admin_delete on storage.objects;
create policy tickets_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'tickets' and public.is_admin());

-- ============ Criar a viagem e os documentos numa só operação ============
-- "security invoker": corre com os direitos de quem chama, por isso as políticas acima valem.
-- Tudo ou nada: se os documentos falharem, a viagem também não fica.
create or replace function public.submit_trip(
  p_name text, p_contact text, p_origin text, p_destination text,
  p_travel_date date, p_return_date date, p_flight text, p_kg numeric, p_per_kg int,
  p_full_name text, p_passport_enc text, p_passport_last4 text, p_ticket_path text
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare tid uuid;
begin
  if auth.uid() is null then raise exception 'Entra na tua conta.' using errcode = '42501'; end if;
  insert into public.trips (user_id, name, contact, origin, destination, travel_date, return_date, flight, kg, per_kg)
  values (auth.uid(), p_name, p_contact, p_origin, p_destination, p_travel_date, p_return_date, coalesce(p_flight, ''), p_kg, p_per_kg)
  returning id into tid;
  insert into public.traveler_docs (trip_id, user_id, full_name, passport_enc, passport_last4, ticket_path, outbound_date, return_date)
  values (tid, auth.uid(), p_full_name, p_passport_enc, p_passport_last4, p_ticket_path, p_travel_date, p_return_date);
  return tid;
end $$;
revoke execute on function public.submit_trip(text, text, text, text, date, date, text, numeric, int, text, text, text, text) from public, anon;
grant execute on function public.submit_trip(text, text, text, text, date, date, text, numeric, int, text, text, text, text) to authenticated;
