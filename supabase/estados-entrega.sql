-- Kamba Traz · estados da entrega, histórico e código de entrega (só hash, com validade).
-- Cola em Supabase → SQL Editor → Run (depois de delivery.sql, delivery-photos.sql e ratelimit.sql). Pode ser executado de novo.
--
--  acordo (negociacao) → pagamento retido (garantia, equipa) → recolhido (viajante, com fotos)
--  → em viagem (transito, viajante) → entregue (código de quem recebe) → libertado (liberado, equipa)

-- ============ Novo estado «recolhido» ============
alter table public.deals drop constraint if exists deals_status_check;
alter table public.deals add constraint deals_status_check
  check (status in ('negociacao', 'garantia', 'recolhido', 'transito', 'entregue', 'liberado', 'cancelado'));
alter table public.deals add column if not exists traveling_at timestamptz;

-- ============ Só passos permitidos (a mesma regra de src/lib/deal-flow.ts) ============
create or replace function public.deals_transition_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is not distinct from old.status then return new; end if;
  if new.status = 'cancelado' and old.status in ('negociacao', 'garantia', 'recolhido', 'transito') then return new; end if;
  if (old.status, new.status) in (('negociacao', 'garantia'), ('garantia', 'recolhido'), ('recolhido', 'transito'),
                                  ('transito', 'entregue'), ('entregue', 'liberado')) then return new; end if;
  raise exception 'Mudança de estado não permitida (% para %).', old.status, new.status using errcode = 'P0001';
end $$;
revoke execute on function public.deals_transition_guard() from public, anon, authenticated;
drop trigger if exists deals_transition_guard_trg on public.deals;
create trigger deals_transition_guard_trg before update of status on public.deals
  for each row execute function public.deals_transition_guard();

-- ============ Histórico de cada entrega (auditoria) ============
create table if not exists public.deal_history (
  id bigserial primary key,
  deal_id uuid not null references public.deals(id) on delete cascade,
  from_status text,
  to_status text not null,
  actor uuid references public.profiles(id) on delete set null,
  at timestamptz not null default now()
);
create index if not exists deal_history_deal on public.deal_history (deal_id, at);
alter table public.deal_history enable row level security;
revoke all on public.deal_history from anon, authenticated;
grant select on public.deal_history to authenticated;
drop policy if exists deal_history_read on public.deal_history;
create policy deal_history_read on public.deal_history for select to authenticated
  using (public.is_admin() or exists (select 1 from public.deals d where d.id = deal_id and auth.uid() in (d.sender_id, d.traveler_id)));
-- Ninguém escreve à mão: só o gatilho.

create or replace function public.deal_history_log() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.deal_history (deal_id, from_status, to_status, actor) values (new.id, null, new.status, auth.uid());
  elsif new.status is distinct from old.status then
    insert into public.deal_history (deal_id, from_status, to_status, actor) values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end $$;
revoke execute on function public.deal_history_log() from public, anon, authenticated;
drop trigger if exists deals_history_trg on public.deals;
create trigger deals_history_trg after insert or update of status on public.deals
  for each row execute function public.deal_history_log();

-- ============ Movimentos da carteira: o reembolso cobre também «recolhido» ============
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
    elsif new.status = 'cancelado' and old.status in ('garantia', 'recolhido', 'transito', 'entregue') then
      insert into public.wallet_ledger (user_id, deal_id, kind, amount, note)
      values (new.sender_id, new.id, 'reembolso', new.price, 'Entrega cancelada: valor devolvido');
    end if;
    if new.status in ('entregue', 'liberado', 'cancelado') then
      delete from public.delivery_positions where deal_id = new.id;
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.deal_status_effects() from public, anon, authenticated;

-- ============ Código de entrega: só o hash, com validade ============
alter table public.deal_secrets alter column code_enc drop not null;
alter table public.deal_secrets add column if not exists expires_at timestamptz;

-- A equipa confirma o pagamento. O código já não é guardado cifrado: quem envia gera-o na app e vê-o uma vez.
create or replace function public.fund_deal(p_deal uuid, p_method text, p_reference text, p_code text, p_code_enc text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare d public.deals%rowtype; salt text := encode(extensions.gen_random_bytes(16), 'hex');
begin
  if not public.is_admin() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  select * into d from public.deals where id = p_deal for update;
  if not found or d.status <> 'negociacao' then raise exception 'Esta entrega não está à espera de pagamento.' using errcode = 'P0001'; end if;
  if d.sender_id is null or d.traveler_id is null then raise exception 'Faltam as partes desta entrega.' using errcode = 'P0001'; end if;
  if p_code !~ '^[0-9]{6}$' then raise exception 'Código inválido.' using errcode = '22023'; end if;
  -- p_code é um valor aleatório que ninguém conhece: a entrega só fecha depois de quem envia gerar o seu código.
  insert into public.deal_secrets (deal_id, code_salt, code_hash, code_enc, pay_method, pay_ref, expires_at)
  values (p_deal, salt, encode(extensions.digest(salt || p_code, 'sha256'), 'hex'), null, left(coalesce(p_method, ''), 40), left(coalesce(p_reference, ''), 120), now())
  on conflict (deal_id) do update set code_salt = excluded.code_salt, code_hash = excluded.code_hash, code_enc = null,
    attempts = 0, pay_method = excluded.pay_method, pay_ref = excluded.pay_ref, expires_at = excluded.expires_at;
  update public.deals set status = 'garantia', funded_at = now() where id = p_deal;
end $$;

-- Quem envia gera (ou volta a gerar) o código. O anterior deixa de valer. O código vem do servidor da app; aqui só fica o hash.
create or replace function public.set_delivery_code(p_deal uuid, p_code text)
returns timestamptz language plpgsql security definer set search_path = public, extensions as $$
declare d public.deals%rowtype; salt text := encode(extensions.gen_random_bytes(16), 'hex'); exp timestamptz := now() + interval '30 days';
begin
  select * into d from public.deals where id = p_deal for update;
  if not found or d.sender_id is distinct from auth.uid() then raise exception 'Só quem envia pode gerar o código.' using errcode = '42501'; end if;
  if d.status not in ('garantia', 'recolhido', 'transito') then raise exception 'O código só se gera com o pagamento retido e antes da entrega.' using errcode = 'P0001'; end if;
  if p_code !~ '^[0-9]{6}$' then raise exception 'Código inválido.' using errcode = '22023'; end if;
  update public.deal_secrets set code_salt = salt, code_hash = encode(extensions.digest(salt || p_code, 'sha256'), 'hex'),
    code_enc = null, attempts = 0, expires_at = exp where deal_id = p_deal;
  if not found then raise exception 'Esta entrega ainda não tem o pagamento registado.' using errcode = 'P0001'; end if;
  return exp;
end $$;

-- Se já existe um código válido (sem o mostrar): quando expira.
create or replace function public.delivery_code_status(p_deal uuid)
returns table (has_code boolean, expires_at timestamptz, attempts int) language sql stable security definer set search_path = public as $$
  select s.expires_at is null or s.expires_at > now(), s.expires_at, s.attempts
  from public.deal_secrets s join public.deals d on d.id = s.deal_id
  where s.deal_id = p_deal and (d.sender_id = auth.uid() or public.is_admin());
$$;

-- O viajante recolhe a encomenda (com pelo menos 2 fotos): pagamento retido → recolhido.
create or replace function public.pickup_deal(p_deal uuid)
returns void language plpgsql security definer set search_path = public as $$
declare d public.deals%rowtype;
begin
  select * into d from public.deals where id = p_deal for update;
  if not found or d.traveler_id is distinct from auth.uid() then raise exception 'Só o entregador desta entrega pode fazer isto.' using errcode = '42501'; end if;
  if d.status <> 'garantia' then raise exception 'O pagamento ainda não foi confirmado e retido pela equipa.' using errcode = 'P0001'; end if;
  if (select count(*) from public.deal_photos where deal_id = p_deal and kind = 'recolha') < 2 then
    raise exception 'Envia pelo menos 2 fotos do estado do volume antes de pegar a encomenda.' using errcode = 'P0001';
  end if;
  update public.deals set status = 'recolhido', picked_up_at = now() where id = p_deal;
end $$;

-- O viajante parte: recolhido → em viagem. Começa a partilha de localização (com o consentimento dele).
create or replace function public.start_trip_deal(p_deal uuid)
returns void language plpgsql security definer set search_path = public as $$
declare d public.deals%rowtype;
begin
  select * into d from public.deals where id = p_deal for update;
  if not found or d.traveler_id is distinct from auth.uid() then raise exception 'Só o entregador desta entrega pode fazer isto.' using errcode = '42501'; end if;
  if d.status <> 'recolhido' then raise exception 'Primeiro recolhe a encomenda.' using errcode = 'P0001'; end if;
  update public.deals set status = 'transito', traveling_at = now(), tracking_consent_at = now() where id = p_deal;
end $$;

-- Quem recebe dá o código ao entregador. Devolve 'ok', 'errado:N', 'bloqueado' ou 'expirado'.
create or replace function public.confirm_delivery(p_deal uuid, p_code text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare d public.deals%rowtype; s public.deal_secrets%rowtype;
begin
  select * into d from public.deals where id = p_deal for update;
  if not found or d.traveler_id is distinct from auth.uid() then raise exception 'Só o entregador desta entrega pode fazer isto.' using errcode = '42501'; end if;
  if d.status <> 'transito' then raise exception 'Esta entrega não está em viagem.' using errcode = 'P0001'; end if;
  select * into s from public.deal_secrets where deal_id = p_deal for update;
  if not found then raise exception 'Esta entrega não tem código.' using errcode = 'P0001'; end if;
  if s.attempts >= 5 then return 'bloqueado'; end if;
  if s.expires_at is not null and s.expires_at <= now() then return 'expirado'; end if;
  if encode(extensions.digest(s.code_salt || coalesce(p_code, ''), 'sha256'), 'hex') <> s.code_hash then
    update public.deal_secrets set attempts = attempts + 1 where deal_id = p_deal;
    if s.attempts + 1 >= 5 then return 'bloqueado'; end if;
    return 'errado:' || (5 - (s.attempts + 1))::text;
  end if;
  update public.deals set status = 'entregue', delivered_at = now() where id = p_deal;
  return 'ok';
end $$;

-- Para os emails de cada mudança: só o servidor da app (com o segredo) lê os emails das duas partes.
create or replace function public.deal_notify_info(p_secret text, p_deal uuid)
returns table (label text, status text, sender_email text, traveler_email text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.rl_ok(p_secret) then raise exception 'não autorizado' using errcode = '42501'; end if;
  return query
    select d.label, d.status,
      (select u.email::text from auth.users u where u.id = d.sender_id),
      (select u.email::text from auth.users u where u.id = d.traveler_id)
    from public.deals d where d.id = p_deal;
end $$;

revoke execute on function public.fund_deal(uuid, text, text, text, text), public.set_delivery_code(uuid, text),
  public.delivery_code_status(uuid), public.pickup_deal(uuid), public.start_trip_deal(uuid),
  public.confirm_delivery(uuid, text), public.deal_notify_info(text, uuid) from public, anon;
grant execute on function public.fund_deal(uuid, text, text, text, text), public.set_delivery_code(uuid, text),
  public.delivery_code_status(uuid), public.pickup_deal(uuid), public.start_trip_deal(uuid),
  public.confirm_delivery(uuid, text), public.deal_notify_info(text, uuid) to authenticated;

-- Códigos antigos guardados cifrados: deixam de ser legíveis (quem envia gera um novo na app).
-- Corre esta linha só quando quiseres apagá-los: update public.deal_secrets set code_enc = null;
