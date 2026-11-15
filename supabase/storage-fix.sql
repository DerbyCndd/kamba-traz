-- Corrige o envio de ficheiros (BI, fotos da entrega, faturas, bilhetes, avatares).
-- Erro anterior: 42P17 "infinite recursion detected in policy for relation objects".
-- Causa: as regras de inserção contavam os ficheiros da pessoa lendo storage.objects dentro da própria regra de storage.objects.
-- Solução: a contagem passa para uma função interna (security definer), que lê fora das regras de acesso. Pode correr-se mais do que uma vez.

create or replace function public.storage_count(p_bucket text, p_owner uuid)
returns int language sql stable security definer set search_path = public, storage as $$
  select count(*)::int from storage.objects o
  where o.bucket_id = p_bucket and (o.owner_id = p_owner::text or (storage.foldername(o.name))[1] = p_owner::text);
$$;
revoke execute on function public.storage_count(text, uuid) from public, anon;
grant  execute on function public.storage_count(text, uuid) to authenticated;

do $$
declare b record;
begin
  for b in select * from (values ('tickets', 20), ('ids', 12), ('avatars', 6), ('invoices', 60)) as t(bucket, maxfiles)
  loop
    execute format('drop policy if exists %I on storage.objects', b.bucket || '_insert_own');
    execute format($p$create policy %I on storage.objects for insert to authenticated with check (
      bucket_id = %L and (storage.foldername(name))[1] = auth.uid()::text
      and public.storage_count(%L, auth.uid()) < %s
    )$p$, b.bucket || '_insert_own', b.bucket, b.bucket, b.maxfiles);
  end loop;
end $$;

drop policy if exists deal_photos_storage_insert on storage.objects;
create policy deal_photos_storage_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'deal-photos'
    and exists (
      select 1 from public.deals d
      where d.id::text = (storage.foldername(name))[1] and d.traveler_id = auth.uid() and d.status = 'garantia'
    )
    and public.storage_count('deal-photos', auth.uid()) < 400
  );
