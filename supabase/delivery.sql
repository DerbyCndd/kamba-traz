-- Kamba Traz · entregas: localização do entregador e carteira (valores retidos até à entrega).
-- Cola em Supabase → SQL Editor → Run (depois de schema.sql e ratings.sql). Pode ser executado de novo.
--
-- Como funciona:
--  1. A equipa liga um pedido a um viajante (entrega "em negociação").
--  2. Quando recebe o pagamento (transferência, Multicaixa...), a equipa confirma. O valor fica RETIDO na carteira e
--     nasce um código de entrega de 6 dígitos, que só quem enviou vê.
--  3. O entregador toca em "Peguei a encomenda" (e aceita partilhar a localização): a entrega passa a "em trânsito" e
--     a posição dele aparece em directo a quem enviou e à equipa.
--  4. Quem recebe dá o código ao entregador, que o introduz: a entrega fica "entregue", a localização apaga-se.
--  5. A equipa paga ao viajante por fora e marca "pago": o valor sai da retenção.
-- IMPORTANTE: esta carteira é o REGISTO dos valores. O dinheiro entra e sai por fora, confirmado pela equipa.

create extension if not exists pgcrypto with schema extensions;

-- ============ Partes e marcos de cada entrega ============
alter table public.deals add column if not exists sender_id uuid references public.profiles(id) on delete set null;
alter table public.deals add column if not exists traveler_id uuid references public.profiles(id) on delete set null;
alter table public.deals add column if not exists funded_at timestamptz;
alter table public.deals add column if not exists picked_up_at timestamptz;
alter table public.deals add column if not exists delivered_at timestamptz;
alter table public.deals add column if not exists tracking_consent_at timestamptz;

update public.deals d set sender_id = r.user_id from public.requests r where d.request_id = r.id and d.sender_id is null;
update public.deals d set traveler_id = t.user_id from public.trips t where d.trip_id = t.id and d.traveler_id is null;
create index if not exists deals_sender_idx on public.deals (sender_id);
create index if not exists deals_traveler_idx on public.deals (traveler_id);

-- Cada parte vê as suas entregas (a equipa já via todas).
drop policy if exists deals_party_read on public.deals;
create policy deals_party_read on public.deals for select to authenticated
  using (sender_id = auth.uid() or traveler_id = auth.uid());

-- ============ Segredos: código de entrega e referência do pagamento ============
-- O código verifica-se pelo hash (o entregador nunca o pode ler). Quem enviou vê o código cifrado pela app.
create table if not exists public.deal_secrets (
  deal_id uuid primary key references public.deals(id) on delete cascade,
  code_salt text not null,
  code_hash text not null,
  code_enc text not null,
  attempts int not null default 0,
  pay_method text not null default '' check (char_length(pay_method) <= 40),
  pay_ref text not null default '' check (char_length(pay_ref) <= 120)
);
alter table public.deal_secrets enable row level security;
revoke all on public.deal_secrets from anon, authenticated;
grant select on public.deal_secrets to authenticated;
drop policy if exists secrets_admin_read on public.deal_secrets;
create policy secrets_admin_read on public.deal_secrets for select to authenticated using (public.is_admin());
drop policy if exists secrets_sender_read on public.deal_secrets;
create policy secrets_sender_read on public.deal_secrets for select to authenticated
  using (exists (select 1 from public.deals d where d.id = deal_id and d.sender_id = auth.uid()));

-- ============ Localização do entregador ============
create table if not exists public.delivery_positions (
  id bigserial primary key,
  deal_id uuid not null references public.deals(id) on delete cascade,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  accuracy real,
  at timestamptz not null default now()
);
create index if not exists delivery_positions_deal_idx on public.delivery_positions (deal_id, id desc);
alter table public.delivery_positions enable row level security;
revoke all on public.delivery_positions from anon, authenticated;
grant select on public.delivery_positions to authenticated;
drop policy if exists positions_read on public.delivery_positions;
create policy positions_read on public.delivery_positions for select to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.deals d where d.id = deal_id and (d.sender_id = auth.uid() or d.traveler_id = auth.uid()))
  );
-- Só se escreve pela função push_location (que confirma que és o entregador e que a entrega está em trânsito).

do $$ begin
  alter publication supabase_realtime add table public.delivery_positions;
exception when duplicate_object then null;
end $$;

-- ============ Carteira: registo de movimentos ============
create table if not exists public.wallet_ledger (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  kind text not null check (kind in ('retido', 'a_receber', 'libertado', 'recebido', 'reembolso', 'comissao')),
  amount integer not null,
  note text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists wallet_ledger_user_idx on public.wallet_ledger (user_id, created_at desc);
alter table public.wallet_ledger enable row level security;
revoke all on public.wallet_ledger from anon, authenticated;
grant select on public.wallet_ledger to authenticated;
drop policy if exists ledger_read on public.wallet_ledger;
create policy ledger_read on public.wallet_ledger for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Os movimentos nascem sozinhos das mudanças de estado da entrega. Ninguém os escreve à mão.
create or replace function public.deal_status_effects()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'garantia' then
      insert into public.wallet_ledger (user_id, deal_id, kind, amount, note) values
        (new.sender_id, new.id, 'retido', new.price, 'Pagamento confirmado e retido até à entrega'),
        (new.traveler_id, new.id, 'a_receber', new.price - new.commission, 'A receber quando a entrega for confirmada');
    elsif new.status = 'liberado' then
      insert into public.wallet_ledger (user_id, deal_id, kind, amount, note) values
        (new.sender_id, new.id, 'libertado', new.price, 'Entrega concluída: valor libertado ao viajante'),
        (new.traveler_id, new.id, 'recebido', new.price - new.commission, 'Pago ao viajante'),
        (null, new.id, 'comissao', new.commission, 'Comissão da Kamba');
    elsif new.status = 'cancelado' and old.status in ('garantia', 'transito', 'entregue') then
      insert into public.wallet_ledger (user_id, deal_id, kind, amount, note)
      values (new.sender_id, new.id, 'reembolso', new.price, 'Entrega cancelada: valor devolvido');
    end if;
    -- A localização só existe enquanto a entrega está a caminho: apaga-se ao terminar.
    if new.status in ('entregue', 'liberado', 'cancelado') then
      delete from public.delivery_positions where deal_id = new.id;
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.deal_status_effects() from public, anon, authenticated;
drop trigger if exists deals_status_effects on public.deals;
create trigger deals_status_effects after update of status on public.deals
  for each row execute function public.deal_status_effects();

-- ============ Operações ============
-- 1) A equipa confirma o pagamento: o valor fica retido e nasce o código de entrega.
create or replace function public.fund_deal(p_deal uuid, p_method text, p_reference text, p_code text, p_code_enc text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare d public.deals%rowtype; salt text := encode(extensions.gen_random_bytes(8), 'hex');
begin
  if not public.is_admin() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  select * into d from public.deals where id = p_deal for update;
  if not found or d.status <> 'negociacao' then raise exception 'Esta entrega não está à espera de pagamento.' using errcode = 'P0001'; end if;
  if d.sender_id is null or d.traveler_id is null then raise exception 'Faltam as partes desta entrega.' using errcode = 'P0001'; end if;
  if p_code !~ '^[0-9]{6}$' then raise exception 'Código inválido.' using errcode = '22023'; end if;
  insert into public.deal_secrets (deal_id, code_salt, code_hash, code_enc, pay_method, pay_ref)
  values (p_deal, salt, encode(extensions.digest(salt || p_code, 'sha256'), 'hex'), p_code_enc, left(coalesce(p_method, ''), 40), left(coalesce(p_reference, ''), 120))
  on conflict (deal_id) do update set code_salt = excluded.code_salt, code_hash = excluded.code_hash, code_enc = excluded.code_enc,
    attempts = 0, pay_method = excluded.pay_method, pay_ref = excluded.pay_ref;
  update public.deals set status = 'garantia', funded_at = now() where id = p_deal;
end $$;

-- 2) O entregador pega a encomenda: começa a partilha de localização (com o consentimento dele).
create or replace function public.pickup_deal(p_deal uuid)
returns void language plpgsql security definer set search_path = public as $$
declare d public.deals%rowtype;
begin
  select * into d from public.deals where id = p_deal for update;
  if not found or d.traveler_id is distinct from auth.uid() then raise exception 'Só o entregador desta entrega pode fazer isto.' using errcode = '42501'; end if;
  if d.status <> 'garantia' then raise exception 'O pagamento ainda não foi confirmado e retido pela equipa.' using errcode = 'P0001'; end if;
  update public.deals set status = 'transito', picked_up_at = now(), tracking_consent_at = now() where id = p_deal;
end $$;

-- 3) A posição do entregador. Só vale se és tu e a entrega está em trânsito; no máximo um ponto a cada 4 segundos.
create or replace function public.push_location(p_deal uuid, p_lat double precision, p_lng double precision, p_acc real default null)
returns void language plpgsql security definer set search_path = public as $$
declare d public.deals%rowtype; cutoff bigint;
begin
  select * into d from public.deals where id = p_deal;
  if not found or d.traveler_id is distinct from auth.uid() or d.status <> 'transito' then return; end if;
  if p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180 then return; end if;
  if exists (select 1 from public.delivery_positions where deal_id = p_deal and at > now() - interval '4 seconds') then return; end if;
  insert into public.delivery_positions (deal_id, lat, lng, accuracy) values (p_deal, p_lat, p_lng, p_acc);
  select id into cutoff from public.delivery_positions where deal_id = p_deal order by id desc offset 300 limit 1;
  if cutoff is not null then delete from public.delivery_positions where deal_id = p_deal and id <= cutoff; end if;
end $$;

-- 4) Quem recebe dá o código ao entregador, que o introduz. Devolve 'ok', 'errado:N' (N tentativas que restam) ou 'bloqueado'.
-- Devolve texto em vez de levantar erro, para a contagem de tentativas não ser desfeita.
create or replace function public.confirm_delivery(p_deal uuid, p_code text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare d public.deals%rowtype; s public.deal_secrets%rowtype;
begin
  select * into d from public.deals where id = p_deal for update;
  if not found or d.traveler_id is distinct from auth.uid() then raise exception 'Só o entregador desta entrega pode fazer isto.' using errcode = '42501'; end if;
  if d.status <> 'transito' then raise exception 'Esta entrega não está a caminho.' using errcode = 'P0001'; end if;
  select * into s from public.deal_secrets where deal_id = p_deal for update;
  if not found then raise exception 'Esta entrega não tem código.' using errcode = 'P0001'; end if;
  if s.attempts >= 5 then return 'bloqueado'; end if;
  if encode(extensions.digest(s.code_salt || coalesce(p_code, ''), 'sha256'), 'hex') <> s.code_hash then
    update public.deal_secrets set attempts = attempts + 1 where deal_id = p_deal;
    if s.attempts + 1 >= 5 then return 'bloqueado'; end if;
    return 'errado:' || (5 - (s.attempts + 1))::text;
  end if;
  update public.deals set status = 'entregue', delivered_at = now() where id = p_deal;
  return 'ok';
end $$;

-- 5) O saldo de cada pessoa, calculado a partir do estado das entregas.
create or replace function public.my_wallet()
returns table (held bigint, to_receive bigint, received bigint, refunded bigint, paid bigint)
language sql stable set search_path = public as $$
  select
    coalesce(sum(price) filter (where sender_id = auth.uid() and status in ('garantia', 'transito', 'entregue')), 0)::bigint,
    coalesce(sum(price - commission) filter (where traveler_id = auth.uid() and status in ('garantia', 'transito', 'entregue')), 0)::bigint,
    coalesce(sum(price - commission) filter (where traveler_id = auth.uid() and status = 'liberado'), 0)::bigint,
    coalesce(sum(price) filter (where sender_id = auth.uid() and status = 'cancelado' and funded_at is not null), 0)::bigint,
    coalesce(sum(price) filter (where sender_id = auth.uid() and status = 'liberado'), 0)::bigint
  from public.deals;
$$;

revoke execute on function public.fund_deal(uuid, text, text, text, text), public.pickup_deal(uuid),
  public.push_location(uuid, double precision, double precision, real), public.confirm_delivery(uuid, text),
  public.my_wallet() from public, anon;
grant execute on function public.fund_deal(uuid, text, text, text, text), public.pickup_deal(uuid),
  public.push_location(uuid, double precision, double precision, real), public.confirm_delivery(uuid, text),
  public.my_wallet() to authenticated;
