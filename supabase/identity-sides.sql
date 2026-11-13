-- Kamba Traz · segundo lado dos documentos: BI (frente e verso) e passaporte (2.ª página e última). Corre no SQL Editor do Supabase
-- (depois de identity.sql). Pode ser executado de novo. Contas já criadas não têm estas fotos (ficam vazias).
alter table public.identities add column if not exists bi_back_path text;
alter table public.identities add column if not exists passport_last_path text;

grant insert (bi_back_path, passport_last_path) on public.identities to authenticated;
grant update (bi_back_path, passport_last_path) on public.identities to authenticated;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'identities_sides_chk') then
    alter table public.identities add constraint identities_sides_chk check (
      (bi_back_path is null or bi_back_path like user_id::text || '/%')
      and (passport_last_path is null or passport_last_path like user_id::text || '/%')
      and (passport_last_path is null or passport_photo_path is not null)
    ) not valid;
  end if;
end $$;
