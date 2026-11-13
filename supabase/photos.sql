-- Foto de perfil. Corre este ficheiro no SQL Editor do Supabase (uma vez).
--  * A foto fica num armazenamento PRIVADO (bucket "avatars"): só o dono e a equipa a vêem.
--  * O quadro público continua a mostrar só iniciais.
--  * O caminho da foto só se altera pela função set_my_photo (valida que a foto é do próprio).

alter table public.profiles add column if not exists photo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 2097152, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_read on storage.objects;
create policy avatars_read on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.set_my_photo(p_path text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sem sessão.' using errcode = '42501'; end if;
  if p_path is null or p_path not like auth.uid()::text || '/%' then
    raise exception 'Foto inválida.' using errcode = 'P0001';
  end if;
  update public.profiles set photo_path = p_path where id = auth.uid();
end $$;

revoke all on function public.set_my_photo(text) from public, anon;
grant execute on function public.set_my_photo(text) to authenticated;
