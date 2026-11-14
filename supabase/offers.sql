-- Kamba Traz · propostas de valor entre quem envia e quem viaja (sem chat: o valor, e só o valor, negoceia-se na app).
-- Corre no SQL Editor do Supabase (depois de schema.sql e hardening.sql). Pode ser executado de novo.
--
--  * Quem viaja propõe um valor a um pedido (ou quem envia propõe a uma viagem). A outra parte aceita, recusa ou propõe outro valor.
--  * Ninguém escreve diretamente nesta tabela: tudo passa por duas funções que verificam quem é quem e em que estado está cada coisa.
--  * Quando uma proposta é aceite, fica «aceite» e a equipa cria a entrega com esse valor (verificações de alfândega, identificação
--    e prémio do mês continuam no painel da equipa). Até correres este ficheiro a app não mostra propostas e nada quebra.

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  from_user uuid not null references public.profiles(id) on delete cascade,
  to_user uuid not null references public.profiles(id) on delete cascade,
  from_role text not null check (from_role in ('traveler', 'requester')),
  from_name text not null default '' check (char_length(from_name) <= 60),
  to_name text not null default '' check (char_length(to_name) <= 60),
  price integer not null check (price between 1 and 100000000),
  status text not null default 'aberta' check (status in ('aberta', 'aceite', 'recusada', 'substituida', 'fechada', 'convertida')),
  parent_id uuid references public.offers(id) on delete set null,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (from_user <> to_user)
);
create index if not exists offers_pair_idx on public.offers (request_id, trip_id, created_at);
create index if not exists offers_to_idx on public.offers (to_user, status);
create index if not exists offers_from_idx on public.offers (from_user, created_at desc);

alter table public.offers enable row level security;
revoke all on public.offers from anon, authenticated;
grant select on public.offers to authenticated;
grant update (status, responded_at) on public.offers to authenticated; -- só passa nas políticas da equipa

drop policy if exists offers_read on public.offers;
create policy offers_read on public.offers for select to authenticated
  using (from_user = auth.uid() or to_user = auth.uid() or public.is_admin());
drop policy if exists offers_admin_update on public.offers;
create policy offers_admin_update on public.offers for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ============ Fazer uma proposta ============
create or replace function public.make_offer(p_request uuid, p_trip uuid, p_price int)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  r public.requests%rowtype; t public.trips%rowtype;
  who text; other uuid; myname text; othername text; oid uuid;
begin
  if me is null then raise exception 'Entra na tua conta.' using errcode = '42501'; end if;
  if p_price is null or p_price < 1 or p_price > 100000000 then raise exception 'Indica um valor válido em Kz.' using errcode = '22023'; end if;

  select * into r from public.requests where id = p_request;
  select * into t from public.trips where id = p_trip;
  if r.id is null or t.id is null then raise exception 'Pedido ou viagem não encontrados.' using errcode = 'P0001'; end if;
  if r.status <> 'aberto' then raise exception 'Este pedido já não está aberto.' using errcode = 'P0001'; end if;
  if t.status <> 'aberto' then raise exception 'Esta viagem já não está aberta.' using errcode = 'P0001'; end if;
  if t.travel_date < current_date then raise exception 'Esta viagem já passou.' using errcode = 'P0001'; end if;
  if r.example or t.example then raise exception 'Isto é um exemplo de demonstração.' using errcode = 'P0001'; end if;
  if r.user_id = t.user_id then raise exception 'O pedido e a viagem são da mesma pessoa.' using errcode = 'P0001'; end if;
  if not (r.origin = t.origin or r.origin = 'OTH' or t.origin = 'OTH')
     or not (r.destination = t.destination or r.destination = 'OTH' or t.destination = 'OTH') then
    raise exception 'A rota do pedido e a da viagem não coincidem.' using errcode = 'P0001';
  end if;

  if me = t.user_id then who := 'traveler'; other := r.user_id;
  elsif me = r.user_id then who := 'requester'; other := t.user_id;
  else raise exception 'Só quem tem este pedido ou esta viagem pode propor um valor.' using errcode = '42501';
  end if;

  if exists (select 1 from public.offers where request_id = p_request and trip_id = p_trip and status = 'aberta') then
    raise exception 'Já há uma proposta aberta entre vocês. Responde-lhe na página Propostas.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.offers where request_id = p_request and trip_id = p_trip and status in ('aceite', 'convertida')) then
    raise exception 'Já há um acordo entre vocês.' using errcode = 'P0001';
  end if;
  if (select count(*) from public.offers where from_user = me and created_at > now() - interval '1 day') >= 30 then
    raise exception 'Fizeste muitas propostas hoje. Tenta amanhã.' using errcode = 'P0001';
  end if;
  if (select count(*) from public.offers where request_id = p_request and status = 'aberta') >= 10 then
    raise exception 'Este pedido já tem muitas propostas em aberto.' using errcode = 'P0001';
  end if;

  select split_part(coalesce(nullif(full_name, ''), 'Utilizador'), ' ', 1) into myname from public.profiles where id = me;
  select split_part(coalesce(nullif(full_name, ''), 'Utilizador'), ' ', 1) into othername from public.profiles where id = other;

  insert into public.offers (request_id, trip_id, from_user, to_user, from_role, from_name, to_name, price)
  values (p_request, p_trip, me, other, who, coalesce(myname, ''), coalesce(othername, ''), p_price)
  returning id into oid;
  return oid;
end $$;

-- ============ Responder: aceitar, recusar ou propor outro valor ============
create or replace function public.respond_offer(p_offer uuid, p_action text, p_price int default null)
returns text language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  o public.offers%rowtype; r public.requests%rowtype; t public.trips%rowtype;
begin
  if me is null then raise exception 'Entra na tua conta.' using errcode = '42501'; end if;
  select * into o from public.offers where id = p_offer for update;
  if not found or o.to_user <> me then raise exception 'Só quem recebeu a proposta lhe pode responder.' using errcode = '42501'; end if;
  if o.status <> 'aberta' then raise exception 'Esta proposta já foi respondida.' using errcode = 'P0001'; end if;

  select * into r from public.requests where id = o.request_id;
  select * into t from public.trips where id = o.trip_id;
  if r.status <> 'aberto' or t.status <> 'aberto' then
    update public.offers set status = 'fechada', responded_at = now() where id = o.id;
    return 'indisponivel';
  end if;

  if p_action = 'recusar' then
    update public.offers set status = 'recusada', responded_at = now() where id = o.id;
    return 'recusada';
  elsif p_action = 'aceitar' then
    update public.offers set status = 'aceite', responded_at = now() where id = o.id;
    -- Quando há acordo, as outras propostas abertas para o mesmo pedido já não fazem sentido.
    update public.offers set status = 'fechada', responded_at = now() where request_id = o.request_id and status = 'aberta' and id <> o.id;
    return 'aceite';
  elsif p_action = 'contrapor' then
    if p_price is null or p_price < 1 or p_price > 100000000 then raise exception 'Indica um valor válido em Kz.' using errcode = '22023'; end if;
    if (select count(*) from public.offers where request_id = o.request_id and trip_id = o.trip_id) >= 8 then
      raise exception 'Já houve muitas propostas entre vocês. Falem com a equipa.' using errcode = 'P0001';
    end if;
    update public.offers set status = 'substituida', responded_at = now() where id = o.id;
    insert into public.offers (request_id, trip_id, from_user, to_user, from_role, from_name, to_name, price, parent_id)
    values (o.request_id, o.trip_id, me, o.from_user,
            case when o.from_role = 'traveler' then 'requester' else 'traveler' end,
            o.to_name, o.from_name, p_price, o.id);
    return 'contraproposta';
  else
    raise exception 'Ação inválida.' using errcode = '22023';
  end if;
end $$;

revoke execute on function public.make_offer(uuid, uuid, int), public.respond_offer(uuid, text, int) from public, anon;
grant execute on function public.make_offer(uuid, uuid, int), public.respond_offer(uuid, text, int) to authenticated;
