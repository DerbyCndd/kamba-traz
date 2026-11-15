-- Kamba Traz · fotos do estado do volume, enviadas pelo entregador ao pegar a encomenda.
-- Corre no SQL Editor do Supabase (depois de delivery.sql). Pode ser executado de novo.
--  * As fotos ficam num armazenamento PRIVADO (bucket "deal-photos"): só quem participa na entrega e a equipa as vêem.
--  * Só o entregador da entrega as envia, e só enquanto o pagamento está retido (antes de pegar a encomenda).
--  * Pegar a encomenda passa a exigir pelo menos 2 fotos. Até correres este ficheiro, a app não pede fotos (e nada quebra).

create table if not exists public.deal_photos (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'recolha' check (kind in ('recolha', 'entrega')),
  path text not null,
  created_at timestamptz not null default now(),
  check (path like deal_id::text || '/%')
);
create index if not exists deal_photos_deal_idx on public.deal_photos (deal_id, created_at);

alter table public.deal_photos enable row level security;
revoke all on public.deal_photos from anon, authenticated;
grant select, insert on public.deal_photos to authenticated;

drop policy if exists deal_photos_read on public.deal_photos;
create policy deal_photos_read on public.deal_photos for select to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.deals d where d.id = deal_id and (d.sender_id = auth.uid() or d.traveler_id = auth.uid()))
  );

-- Só o entregador, e só antes de pegar a encomenda; no máximo 10 fotos por entrega.
drop policy if exists deal_photos_insert on public.deal_photos;
create policy deal_photos_insert on public.deal_photos for insert to authenticated
  with check (
    user_id = auth.uid() and kind = 'recolha'
    and exists (select 1 from public.deals d where d.id = deal_id and d.traveler_id = auth.uid() and d.status = 'garantia')
    and (select count(*) from public.deal_photos x where x.deal_id = deal_photos.deal_id) < 10
  );

-- ============ Armazenamento privado ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('deal-photos', 'deal-photos', false, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 3145728, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists deal_photos_storage_insert on storage.objects;
create policy deal_photos_storage_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'deal-photos'
    and exists (
      select 1 from public.deals d
      where d.id::text = (storage.foldername(name))[1] and d.traveler_id = auth.uid() and d.status = 'garantia'
    )
    -- Limite de ficheiros por pessoa (o limite por entrega está na tabela deal_photos: 10 fotos).
    and public.storage_count('deal-photos', auth.uid()) < 400 -- função: ler storage.objects aqui dentro dava recursão infinita (ver storage-fix.sql)
  );

drop policy if exists deal_photos_storage_read on storage.objects;
create policy deal_photos_storage_read on storage.objects for select to authenticated
  using (
    bucket_id = 'deal-photos'
    and (
      public.is_admin()
      or exists (
        select 1 from public.deals d
        where d.id::text = (storage.foldername(name))[1] and (d.sender_id = auth.uid() or d.traveler_id = auth.uid())
      )
    )
  );

-- O entregador pode apagar uma foto que ainda não esteja ligada a nenhuma linha (limpeza de um envio que falhou).
drop policy if exists deal_photos_storage_delete on storage.objects;
create policy deal_photos_storage_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'deal-photos'
    and exists (select 1 from public.deals d where d.id::text = (storage.foldername(name))[1] and d.traveler_id = auth.uid() and d.status = 'garantia')
    and not exists (select 1 from public.deal_photos p where p.path = name)
  );

-- ============ Pegar a encomenda exige fotos ============
create or replace function public.pickup_deal(p_deal uuid)
returns void language plpgsql security definer set search_path = public as $$
declare d public.deals%rowtype;
begin
  select * into d from public.deals where id = p_deal for update;
  if not found or d.traveler_id is distinct from auth.uid() then raise exception 'Só o entregador desta entrega pode fazer isto.' using errcode = '42501'; end if;
  if d.status <> 'garantia' then raise exception 'O pagamento ainda não foi confirmado e retido pela equipa.' using errcode = 'P0001'; end if;
  if (select count(*) from public.deal_photos where deal_id = p_deal and kind = 'recolha') < 2 then
    raise exception 'Envia pelo menos 2 fotos do estado do volume antes de pegar a encomenda.' using errcode = 'P0001';
  end if;
  update public.deals set status = 'transito', picked_up_at = now(), tracking_consent_at = now() where id = p_deal;
end $$;

revoke execute on function public.pickup_deal(uuid) from public, anon;
grant execute on function public.pickup_deal(uuid) to authenticated;
