-- Kamba Traz · teste das propostas (make_offer / respond_offer) com 3 pessoas de teste.
-- Corre no SQL Editor do Supabase, DEPOIS de offers.sql. NÃO deixa nada guardado: no fim o bloco falha de propósito
-- para desfazer tudo (pessoas, pedido, viagem e propostas de teste). O que importa é a mensagem final:
--   «TESTE CONCLUÍDO ...»  -> tudo passou (a mensagem lista os passos);
--   «FALHOU ...»            -> diz em que passo e porquê.
-- Cada pessoa é simulada com o seu próprio auth.uid(), com o papel «authenticated» (as mesmas regras de segurança da app).

create or replace function pg_temp.as_user(u uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;

do $$
declare
  a uuid := gen_random_uuid();  -- quem envia (dono do pedido)
  b uuid := gen_random_uuid();  -- quem viaja (dono da viagem)
  c uuid := gen_random_uuid();  -- uma terceira pessoa, sem nada a ver
  rq uuid; tr uuid; o1 uuid; o2 uuid; r text; n int; res text := '';
begin
  -- pessoas, um pedido e uma viagem na mesma rota, ambos abertos (como se a equipa já tivesse aprovado)
  insert into auth.users (id, aud, role, email, raw_user_meta_data) values
    (a, 'authenticated', 'authenticated', 'teste-a-' || a || '@example.com', '{"full_name":"Ana Teste"}'),
    (b, 'authenticated', 'authenticated', 'teste-b-' || b || '@example.com', '{"full_name":"Bruno Teste"}'),
    (c, 'authenticated', 'authenticated', 'teste-c-' || c || '@example.com', '{"full_name":"Carla Teste"}');
  insert into public.requests (user_id, name, contact, origin, destination, item, category, kg, offer, status)
    values (a, 'Ana Teste', '912345678', 'LIS', 'LAD', 'Roupa de teste', 'Roupa', 5, 40000, 'aberto') returning id into rq;
  insert into public.trips (user_id, name, contact, origin, destination, travel_date, kg, per_kg, status)
    values (b, 'Bruno Teste', '923456789', 'LIS', 'LAD', current_date + 30, 20, 8000, 'aberto') returning id into tr;

  -- 1. quem viaja propõe
  perform pg_temp.as_user(b);
  o1 := public.make_offer(rq, tr, 50000);
  reset role;
  select count(*) into n from public.offers where id = o1 and status = 'aberta' and from_role = 'traveler' and from_user = b and to_user = a and price = 50000;
  if n <> 1 then raise exception 'FALHOU no passo 1: a proposta de quem viaja não ficou como esperado'; end if;
  res := res || '1 quem viaja propõe: ok; ';

  -- 2. não pode haver duas propostas abertas entre o mesmo pedido e a mesma viagem
  begin
    perform pg_temp.as_user(b);
    perform public.make_offer(rq, tr, 51000);
    raise exception 'FALHOU no passo 2: aceitou uma segunda proposta aberta';
  exception when others then
    reset role;
    if sqlerrm like 'FALHOU%' then raise; end if;
  end;
  res := res || '2 segunda proposta aberta recusada: ok; ';

  -- 3. uma terceira pessoa não pode propor
  begin
    perform pg_temp.as_user(c);
    perform public.make_offer(rq, tr, 45000);
    raise exception 'FALHOU no passo 3: uma terceira pessoa conseguiu propor';
  exception when others then
    reset role;
    if sqlerrm like 'FALHOU%' then raise; end if;
  end;
  res := res || '3 terceira pessoa recusada: ok; ';

  -- 4. valores inválidos são recusados
  begin
    perform pg_temp.as_user(a);
    perform public.make_offer(rq, tr, 0);
    raise exception 'FALHOU no passo 4: aceitou o valor 0';
  exception when others then
    reset role;
    if sqlerrm like 'FALHOU%' then raise; end if;
  end;
  res := res || '4 valor inválido recusado: ok; ';

  -- 5. quem fez a proposta não a pode aceitar a si próprio; uma terceira pessoa também não
  begin
    perform pg_temp.as_user(b);
    perform public.respond_offer(o1, 'aceitar');
    raise exception 'FALHOU no passo 5: quem propôs conseguiu aceitar a própria proposta';
  exception when others then
    reset role;
    if sqlerrm like 'FALHOU%' then raise; end if;
  end;
  begin
    perform pg_temp.as_user(c);
    perform public.respond_offer(o1, 'recusar');
    raise exception 'FALHOU no passo 5: uma terceira pessoa conseguiu responder';
  exception when others then
    reset role;
    if sqlerrm like 'FALHOU%' then raise; end if;
  end;
  res := res || '5 só o destinatário responde: ok; ';

  -- 6. privacidade: cada um vê as suas propostas, a terceira pessoa não vê nenhuma
  perform pg_temp.as_user(c);
  select count(*) into n from public.offers;
  reset role;
  if n <> 0 then raise exception 'FALHOU no passo 6: uma terceira pessoa vê % proposta(s)', n; end if;
  perform pg_temp.as_user(a);
  select count(*) into n from public.offers;
  reset role;
  if n <> 1 then raise exception 'FALHOU no passo 6: quem recebeu vê % proposta(s) em vez de 1', n; end if;
  res := res || '6 privacidade (RLS): ok; ';

  -- 7. quem recebeu propõe outro valor
  perform pg_temp.as_user(a);
  r := public.respond_offer(o1, 'contrapor', 44000);
  reset role;
  if r <> 'contraproposta' then raise exception 'FALHOU no passo 7: resposta «%» em vez de «contraproposta»', r; end if;
  select id into o2 from public.offers where parent_id = o1 and status = 'aberta' and from_user = a and to_user = b and price = 44000 and from_role = 'requester';
  if o2 is null then raise exception 'FALHOU no passo 7: a contraproposta não foi criada'; end if;
  select count(*) into n from public.offers where id = o1 and status = 'substituida';
  if n <> 1 then raise exception 'FALHOU no passo 7: a proposta original não ficou «substituida»'; end if;
  res := res || '7 contraproposta: ok; ';

  -- 8. quem viaja aceita
  perform pg_temp.as_user(b);
  r := public.respond_offer(o2, 'aceitar');
  reset role;
  if r <> 'aceite' then raise exception 'FALHOU no passo 8: resposta «%» em vez de «aceite»', r; end if;
  select count(*) into n from public.offers where id = o2 and status = 'aceite';
  if n <> 1 then raise exception 'FALHOU no passo 8: o acordo não ficou «aceite»'; end if;
  res := res || '8 aceitar: ok; ';

  -- 9. depois do acordo não se propõe mais, e a mesma proposta não se responde duas vezes
  begin
    perform pg_temp.as_user(b);
    perform public.make_offer(rq, tr, 40000);
    raise exception 'FALHOU no passo 9: aceitou nova proposta depois do acordo';
  exception when others then
    reset role;
    if sqlerrm like 'FALHOU%' then raise; end if;
  end;
  begin
    perform pg_temp.as_user(b);
    perform public.respond_offer(o2, 'recusar');
    raise exception 'FALHOU no passo 9: respondeu duas vezes à mesma proposta';
  exception when others then
    reset role;
    if sqlerrm like 'FALHOU%' then raise; end if;
  end;
  res := res || '9 depois do acordo: ok; ';

  -- 10. ninguém escreve diretamente na tabela
  begin
    perform pg_temp.as_user(a);
    insert into public.offers (request_id, trip_id, from_user, to_user, from_role, price) values (rq, tr, a, b, 'requester', 1);
    raise exception 'FALHOU no passo 10: inserção direta permitida';
  exception when others then
    reset role;
    if sqlerrm like 'FALHOU%' then raise; end if;
  end;
  begin
    perform pg_temp.as_user(a);
    update public.offers set status = 'aceite', price = 1 where id = o2;
    get diagnostics n = row_count;
    if n > 0 then raise exception 'FALHOU no passo 10: alteração direta permitida'; end if;
  exception when others then
    reset role;
    if sqlerrm like 'FALHOU%' then raise; end if;
  end;
  reset role;
  res := res || '10 escrita direta bloqueada: ok; ';

  -- 11. quem não tem sessão (anónimo) não chama as funções
  begin
    execute 'set local role anon';
    perform public.make_offer(rq, tr, 1000);
    raise exception 'FALHOU no passo 11: o anónimo conseguiu propor';
  exception when others then
    reset role;
    if sqlerrm like 'FALHOU%' then raise; end if;
  end;
  res := res || '11 anónimo bloqueado: ok';

  -- falha de propósito para desfazer tudo o que este teste criou
  raise exception 'TESTE CONCLUÍDO (nada foi guardado): %', res;
end $$;
