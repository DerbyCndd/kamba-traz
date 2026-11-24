-- Kamba Traz · teste das regras de acesso dos níveis, das entregas e das métricas
-- (niveis.sql, estados-entrega.sql, metricas.sql e matching.sql).
-- Corre no SQL Editor do Supabase DEPOIS desses ficheiros. NÃO deixa nada guardado: no fim o bloco falha de
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
  s uuid := gen_random_uuid();  -- quem envia (nível 1)
  v uuid := gen_random_uuid();  -- quem viaja (nível 2)
  o uuid := gen_random_uuid();  -- outra pessoa (nível 0)
  eq uuid := gen_random_uuid(); -- equipa
  req uuid; trip uuid; deal uuid;
  n int; t text; res text := '';
  enc text := 'v1:' || repeat('x', 40);
begin
  insert into auth.users (id, aud, role, email, raw_user_meta_data) values
    (s, 'authenticated', 'authenticated', 'niv-s-' || s || '@example.com', '{"full_name":"Sara Teste"}'),
    (v, 'authenticated', 'authenticated', 'niv-v-' || v || '@example.com', '{"full_name":"Vasco Teste"}'),
    (o, 'authenticated', 'authenticated', 'niv-o-' || o || '@example.com', '{"full_name":"Olga Teste"}'),
    (eq, 'authenticated', 'authenticated', 'niv-e-' || eq || '@example.com', '{"full_name":"Equipa Teste"}');
  update public.profiles set role = 'admin' where id = eq;
  -- s: BI, selfie, morada e familiares (nível 1). v: tudo, mais passaporte e foto (nível 2). o: só o BI (nível 0).
  insert into public.identities (user_id, full_name, phone, bi_enc, bi_last4, bi_photo_path, selfie_path, address_enc, family_enc)
  values (s, 'Sara Teste', '912345678', enc, '1111', s::text || '/bi.jpg', s::text || '/selfie.jpg', enc, enc),
         (o, 'Olga Teste', '912345679', enc, '3333', o::text || '/bi.jpg', null, null, null);
  insert into public.identities (user_id, full_name, phone, bi_enc, bi_last4, bi_photo_path, selfie_path, address_enc, family_enc, passport_enc, passport_last4, passport_photo_path)
  values (v, 'Vasco Teste', '912345670', enc, '2222', v::text || '/bi.jpg', v::text || '/selfie.jpg', enc, enc, enc, '9999', v::text || '/pp.jpg');
  update public.profiles set photo_path = v::text || '/foto.jpg' where id = v;

  -- 1. cada pessoa só vê o seu nível; de outra pessoa a resposta é nula
  perform pg_temp.as_user(s);
  if public.my_verification_level() <> 1 then raise exception 'FALHOU no passo 1: quem envia devia ter o nível 1'; end if;
  if public.verification_level(v) is not null then raise exception 'FALHOU no passo 1: quem envia viu o nível de outra pessoa'; end if;
  reset role;
  perform pg_temp.as_user(v);
  if public.my_verification_level() <> 2 then raise exception 'FALHOU no passo 1: quem viaja devia ter o nível 2'; end if;
  reset role;
  res := res || '1 níveis: ok; ';

  -- 2. nível 0 não publica um pedido; nível 1 publica
  begin
    perform pg_temp.as_user(o);
    insert into public.requests (user_id, name, contact, origin, destination, item, category, kg, item_value, offer)
    values (o, 'Olga', '912345679', 'LIS', 'LAD', 'Livros', 'Outro item legal', 2, 50, 10000);
    raise exception 'FALHOU no passo 2: o nível 0 publicou um pedido';
  exception when others then reset role; if sqlerrm like 'FALHOU%' then raise; end if; end;
  perform pg_temp.as_user(s);
  insert into public.requests (user_id, name, contact, origin, destination, item, category, kg, item_value, offer)
  values (s, 'Sara', '912345678', 'LIS', 'LAD', 'Livros', 'Outro item legal', 2, 50, 10000) returning id into req;
  reset role;
  res := res || '2 pedido com nível 1: ok; ';

  -- 3. o nível 1 não publica uma viagem (submit_trip pede o nível 2)
  begin
    perform pg_temp.as_user(s);
    perform public.submit_trip('Sara', '912345678', 'LIS', 'LAD', current_date + 10, current_date + 20, '', 10, 8000, s::text || '/bilhete.jpg');
    raise exception 'FALHOU no passo 3: o nível 1 publicou uma viagem';
  exception when others then reset role; if sqlerrm like 'FALHOU%' then raise; end if; end;
  res := res || '3 viagem sem nível 2 recusada: ok; ';

  -- 4. propostas: quem propõe levar precisa do nível 2 (o gatilho vale mesmo fora das funções)
  update public.requests set status = 'aberto' where id = req;
  insert into public.trips (user_id, name, contact, origin, destination, travel_date, kg, per_kg, status)
  values (v, 'Vasco', '912345670', 'LIS', 'LAD', current_date + 10, 10, 8000, 'aberto') returning id into trip;
  begin
    insert into public.offers (request_id, trip_id, from_user, to_user, from_role, price) values (req, trip, s, s, 'traveler', 10000);
    raise exception 'FALHOU no passo 4: o nível 1 propôs levar uma encomenda';
  exception when others then if sqlerrm like 'FALHOU%' then raise; end if; end;
  insert into public.offers (request_id, trip_id, from_user, to_user, from_role, price) values (req, trip, v, s, 'traveler', 10000);
  res := res || '4 propostas por nível: ok; ';

  -- 5. entrega: só passos permitidos
  insert into public.deals (request_id, trip_id, label, traveler, requester, price, commission_pct, commission, sender_id, traveler_id)
  values (req, trip, 'Livros', 'Vasco', 'Sara', 10000, 10, 1000, s, v) returning id into deal;
  begin
    update public.deals set status = 'transito' where id = deal;
    raise exception 'FALHOU no passo 5: saltou de acordo para em viagem';
  exception when others then if sqlerrm like 'FALHOU%' then raise; end if; end;
  perform pg_temp.as_user(eq);
  perform public.fund_deal(deal, 'transferencia', 'ref-teste', '123456', '');
  reset role;
  select count(*) into n from public.deal_secrets where deal_id = deal and code_enc is null;
  if n <> 1 then raise exception 'FALHOU no passo 5: o código ficou guardado em claro ou cifrado'; end if;
  res := res || '5 passos e pagamento: ok; ';

  -- 6. código: só quem envia gera; o viajante não
  begin
    perform pg_temp.as_user(v);
    perform public.set_delivery_code(deal, '654321');
    raise exception 'FALHOU no passo 6: o viajante gerou o código';
  exception when others then reset role; if sqlerrm like 'FALHOU%' then raise; end if; end;
  perform pg_temp.as_user(s);
  perform public.set_delivery_code(deal, '654321');
  reset role;
  update public.deals set status = 'recolhido' where id = deal;
  update public.deals set status = 'transito' where id = deal;
  res := res || '6 código só de quem envia: ok; ';

  -- 7. código errado conta tentativas; expirado é recusado; certo entrega
  perform pg_temp.as_user(v);
  t := public.confirm_delivery(deal, '000000');
  reset role;
  if t <> 'errado:4' then raise exception 'FALHOU no passo 7: esperava errado:4, veio %', t; end if;
  update public.deal_secrets set expires_at = now() - interval '1 minute' where deal_id = deal;
  perform pg_temp.as_user(v);
  t := public.confirm_delivery(deal, '654321');
  reset role;
  if t <> 'expirado' then raise exception 'FALHOU no passo 7: esperava expirado, veio %', t; end if;
  update public.deal_secrets set expires_at = now() + interval '1 day' where deal_id = deal;
  perform pg_temp.as_user(v);
  t := public.confirm_delivery(deal, '654321');
  reset role;
  if t <> 'ok' then raise exception 'FALHOU no passo 7: o código certo não entregou (%)', t; end if;
  res := res || '7 código: ok; ';

  -- 8. histórico: as partes veem-no, outra pessoa não; ninguém o escreve à mão
  perform pg_temp.as_user(s);
  select count(*) into n from public.deal_history where deal_id = deal;
  reset role;
  if n < 5 then raise exception 'FALHOU no passo 8: o histórico tem só % passos', n; end if;
  perform pg_temp.as_user(o);
  select count(*) into n from public.deal_history where deal_id = deal;
  reset role;
  if n <> 0 then raise exception 'FALHOU no passo 8: outra pessoa viu o histórico'; end if;
  begin
    perform pg_temp.as_user(s);
    insert into public.deal_history (deal_id, to_status) values (deal, 'liberado');
    raise exception 'FALHOU no passo 8: escreveu no histórico à mão';
  exception when others then reset role; if sqlerrm like 'FALHOU%' then raise; end if; end;
  res := res || '8 histórico: ok; ';

  -- 9. métricas: os gatilhos registaram; só a equipa lê
  select count(*) into n from public.pilot_events where subject_id in (req, trip, deal);
  if n < 4 then raise exception 'FALHOU no passo 9: esperava pelo menos 4 eventos, há %', n; end if;
  perform pg_temp.as_user(s);
  select count(*) into n from public.pilot_events;
  reset role;
  if n <> 0 then raise exception 'FALHOU no passo 9: quem envia leu as métricas'; end if;
  res := res || '9 métricas: ok; ';

  -- 10. o anónimo não chama nada disto
  begin
    execute 'set local role anon';
    perform public.set_delivery_code(deal, '111111');
    raise exception 'FALHOU no passo 10: o anónimo chamou set_delivery_code';
  exception when others then reset role; if sqlerrm like 'FALHOU%' then raise; end if; end;
  begin
    execute 'set local role anon';
    perform public.match_open_requests();
    raise exception 'FALHOU no passo 10: o anónimo chamou match_open_requests';
  exception when others then reset role; if sqlerrm like 'FALHOU%' then raise; end if; end;
  res := res || '10 anónimo bloqueado: ok';

  raise exception 'TESTE CONCLUÍDO (nada foi guardado): %', res;
end $$;
