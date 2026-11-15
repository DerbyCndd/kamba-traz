-- Kamba Traz · teste da verificação do mesmo número de documento (identity-duplicates.sql).
-- Corre no SQL Editor do Supabase DEPOIS de identity-duplicates.sql. NÃO deixa nada guardado: no fim o bloco falha de
-- propósito para desfazer tudo. O que importa é a mensagem final:
--   «TESTE CONCLUÍDO ...»  -> tudo passou;
--   «FALHOU ...»            -> diz em que passo e porquê.

create or replace function pg_temp.as_user(u uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;

do $$
declare
  a uuid := gen_random_uuid();  -- pessoa A
  b uuid := gen_random_uuid();  -- pessoa B (mesmo BI que A)
  c uuid := gen_random_uuid();  -- pessoa C (BI diferente, sem impressão)
  d uuid := gen_random_uuid();  -- equipa
  sec text; n int; res text := '';
  h1 text := repeat('a', 64); h2 text := repeat('b', 64);
begin
  select secret into sec from public.rate_limit_secret where id = 1;
  if sec is null then raise exception 'FALHOU no arranque: falta o segredo (corre supabase/secret.local.sql)'; end if;

  insert into auth.users (id, aud, role, email, raw_user_meta_data) values
    (a, 'authenticated', 'authenticated', 'dup-a-' || a || '@example.com', '{"full_name":"Ana Teste"}'),
    (b, 'authenticated', 'authenticated', 'dup-b-' || b || '@example.com', '{"full_name":"Bruno Teste"}'),
    (c, 'authenticated', 'authenticated', 'dup-c-' || c || '@example.com', '{"full_name":"Carla Teste"}'),
    (d, 'authenticated', 'authenticated', 'dup-d-' || d || '@example.com', '{"full_name":"Equipa Teste"}');
  update public.profiles set role = 'admin' where id = d;
  insert into public.identities (user_id, full_name, phone, bi_enc, bi_last4, bi_photo_path)
  select u, nm, '912345678', 'v1:' || repeat('x', 40), '1234', u::text || '/bi.jpg'
    from (values (a, 'Ana Teste'), (b, 'Bruno Teste'), (c, 'Carla Teste')) v(u, nm);

  -- 1. a função com o segredo certo grava; com o errado, não
  perform public.set_identity_hashes(sec, a, h1, '');
  perform public.set_identity_hashes(sec, b, h1, '');
  begin
    perform public.set_identity_hashes('segredo-errado-segredo-errado', c, h2, '');
    raise exception 'FALHOU no passo 1: aceitou um segredo errado';
  exception when others then if sqlerrm like 'FALHOU%' then raise; end if; end;
  select count(*) into n from public.identities where bi_hash = h1;
  if n <> 2 then raise exception 'FALHOU no passo 1: esperava 2 impressões iguais, há %', n; end if;
  res := res || '1 gravar com segredo: ok; ';

  -- 2. a equipa vê que A e B partilham o BI; C não aparece
  perform pg_temp.as_user(d);
  select count(*) into n from public.identity_duplicates() where kind = 'bi' and ((user_id = a and other_user = b) or (user_id = b and other_user = a));
  if n <> 2 then raise exception 'FALHOU no passo 2: a equipa devia ver o par A/B nos dois sentidos, vê %', n; end if;
  select count(*) into n from public.identity_duplicates() where user_id = c or other_user = c;
  if n <> 0 then raise exception 'FALHOU no passo 2: C aparece como repetido sem o ser'; end if;
  select count(*) into n from public.identity_duplicates() where other_name not in ('Ana', 'Bruno');
  if n <> 0 then raise exception 'FALHOU no passo 2: a equipa recebeu mais do que o primeiro nome'; end if;
  reset role;
  res := res || '2 equipa vê o par repetido: ok; ';

  -- 3. quem não é da equipa não vê nada nem chama a função
  begin
    perform pg_temp.as_user(a);
    perform * from public.identity_duplicates();
    raise exception 'FALHOU no passo 3: uma pessoa comum chamou identity_duplicates';
  exception when others then reset role; if sqlerrm like 'FALHOU%' then raise; end if; end;
  begin
    perform pg_temp.as_user(a);
    perform public.identity_unchecked();
    raise exception 'FALHOU no passo 3: uma pessoa comum chamou identity_unchecked';
  exception when others then reset role; if sqlerrm like 'FALHOU%' then raise; end if; end;
  res := res || '3 pessoa comum bloqueada: ok; ';

  -- 4. contagem para o resumo diário: só com o segredo
  if public.duplicate_count(sec) <> 1 then raise exception 'FALHOU no passo 4: esperava 1 documento repetido'; end if;
  begin
    perform public.duplicate_count('segredo-errado-segredo-errado');
    raise exception 'FALHOU no passo 4: aceitou um segredo errado';
  exception when others then if sqlerrm like 'FALHOU%' then raise; end if; end;
  res := res || '4 contagem do resumo: ok; ';

  -- 5. por verificar: C ainda não tem impressão
  perform pg_temp.as_user(d);
  select public.identity_unchecked() into n;
  reset role;
  if n <> 1 then raise exception 'FALHOU no passo 5: esperava 1 por verificar, há %', n; end if;
  res := res || '5 por verificar: ok; ';

  -- 6. ninguém consegue escrever a impressão diretamente (para escapar à verificação) nem ver a dos outros
  begin
    perform pg_temp.as_user(a);
    update public.identities set bi_hash = h2 where user_id = a;
    raise exception 'FALHOU no passo 6: a pessoa conseguiu alterar a própria impressão';
  exception when others then reset role; if sqlerrm like 'FALHOU%' then raise; end if; end;
  perform pg_temp.as_user(a);
  select count(*) into n from public.identities where user_id = b;
  reset role;
  if n <> 0 then raise exception 'FALHOU no passo 6: A vê a identificação de B'; end if;
  res := res || '6 sem escrita direta nem espreitar: ok; ';

  -- 7. o anónimo não chama nada disto
  begin
    execute 'set local role anon';
    perform public.identity_duplicates();
    raise exception 'FALHOU no passo 7: o anónimo chamou identity_duplicates';
  exception when others then reset role; if sqlerrm like 'FALHOU%' then raise; end if; end;
  res := res || '7 anónimo bloqueado: ok';

  raise exception 'TESTE CONCLUÍDO (nada foi guardado): %', res;
end $$;
