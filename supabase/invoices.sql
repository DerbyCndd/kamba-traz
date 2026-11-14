-- Kamba Traz · fatura da compra nos bens de risco. Corre no SQL Editor do Supabase (uma vez). Pode ser executado de novo.
--  * A fatura (foto ou PDF) fica num armazenamento PRIVADO (bucket "invoices"): só o dono e a equipa a vêem.
--  * Até correres este ficheiro, a app não pede a fatura (e nada quebra).

alter table public.requests add column if not exists invoice_path text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'requests_invoice_chk') then
    alter table public.requests add constraint requests_invoice_chk check (invoice_path is null or invoice_path like user_id::text || '/%') not valid;
  end if;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('invoices', 'invoices', false, 3145728, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 3145728, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists invoices_insert_own on storage.objects;
create policy invoices_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'invoices' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists invoices_read on storage.objects;
create policy invoices_read on storage.objects for select to authenticated
  using (bucket_id = 'invoices' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
drop policy if exists invoices_delete_own on storage.objects;
create policy invoices_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'invoices' and (storage.foldername(name))[1] = auth.uid()::text);
