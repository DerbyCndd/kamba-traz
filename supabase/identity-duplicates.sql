-- Kamba Traz · deteta o mesmo número de BI ou de passaporte em contas diferentes.
-- Corre no SQL Editor do Supabase (depois de identity.sql, rate-limit.sql e hardening.sql). Pode ser executado de novo.
--
--  * A app guarda, ao lado do número cifrado, uma «impressão» dele (HMAC-SHA256 com a chave PII_KEY, calculada só no servidor).
--    Dois documentos com o mesmo número dão a mesma impressão, mas a impressão não deixa recuperar o número sem a chave.
--  * Quem escreve a impressão é uma função protegida pelo segredo da app (RATE_LIMIT_SECRET): ninguém a pode inventar nem
--    apagar pela API para escapar à verificação.
--  * Só a equipa vê quem partilha número. Quem faz a identificação não é avisado e não pode saber se o número já existe.
--  * Não bloqueia ninguém sozinha: pode ser engano ao escrever, ou alguém a usar o documento de outra pessoa. Quem decide é a equipa.

alter table public.identities add column if not exists bi_hash text check (bi_hash is null or char_length(bi_hash) = 64);
alter table public.identities add column if not exists passport_hash text check (passport_hash is null or char_length(passport_hash) = 64);
create index if not exists identities_bi_hash_idx on public.identities (bi_hash) where bi_hash is not null;
create index if not exists identities_passport_hash_idx on public.identities (passport_hash) where passport_hash is not null;

-- As colunas novas não estão nas permissões de escrita do dono (ver identity.sql): só esta função as escreve.
create or replace function public.set_identity_hashes(p_secret text, p_user uuid, p_bi text, p_passport text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.rl_ok(p_secret) then raise exception 'não autorizado' using errcode = '42501'; end if;
  update public.identities
     set bi_hash = nullif(p_bi, ''), passport_hash = nullif(p_passport, '')
   where user_id = p_user;
end $$;

-- Para a equipa: quem partilha o número do BI ou do passaporte com outra conta.
create or replace function public.identity_duplicates()
returns table (user_id uuid, kind text, other_user uuid, other_name text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'só a equipa' using errcode = '42501'; end if;
  return query
    select a.user_id, 'bi'::text, b.user_id, split_part(b.full_name, ' ', 1)
      from public.identities a join public.identities b on a.bi_hash = b.bi_hash and a.user_id <> b.user_id
     where a.bi_hash is not null
    union all
    select a.user_id, 'passport'::text, b.user_id, split_part(b.full_name, ' ', 1)
      from public.identities a join public.identities b on a.passport_hash = b.passport_hash and a.user_id <> b.user_id
     where a.passport_hash is not null;
end $$;

-- Quantas identificações ainda não têm impressão (contas anteriores a esta verificação).
create or replace function public.identity_unchecked()
returns integer language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'só a equipa' using errcode = '42501'; end if;
  return (select count(*)::int from public.identities where bi_hash is null or (passport_enc is not null and passport_hash is null));
end $$;

-- Para o resumo diário: quantos documentos estão repetidos (só o número, nunca quem). Protegida pelo segredo da app.
create or replace function public.duplicate_count(p_secret text)
returns integer language plpgsql stable security definer set search_path = public as $$
begin
  if not public.rl_ok(p_secret) then raise exception 'não autorizado' using errcode = '42501'; end if;
  return (select count(*)::int from (
    select bi_hash from public.identities where bi_hash is not null group by bi_hash having count(*) > 1
    union all
    select passport_hash from public.identities where passport_hash is not null group by passport_hash having count(*) > 1
  ) d);
end $$;

revoke execute on function public.set_identity_hashes(text, uuid, text, text), public.identity_duplicates(), public.identity_unchecked() from public, anon;
revoke execute on function public.duplicate_count(text) from public, anon, authenticated;
grant execute on function public.set_identity_hashes(text, uuid, text, text) to anon, authenticated; -- fechada pelo segredo
grant execute on function public.duplicate_count(text) to anon, authenticated; -- fechada pelo segredo
grant execute on function public.identity_duplicates(), public.identity_unchecked() to authenticated; -- fechadas a quem não é da equipa
