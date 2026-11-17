-- Kamba Traz · morada e familiares (segurança), recolha e destinatário, e contactos entre as partes de uma entrega.
-- Cola em Supabase → SQL Editor → Run (depois de identity.sql, identity-sides.sql e delivery.sql). Pode ser executado de novo.
--
--  * Cada pessoa indica a morada, o estado civil e contactos de familiares (mãe, pai e, se não for solteira, o cônjuge).
--    Servem à equipa em caso de emergência ou de suspeita de fraude. Ficam CIFRADOS (como o BI) e só a equipa os abre.
--  * Cada pedido de envio indica onde pegar a encomenda (morada, notas, ligação do mapa) e quem a recebe em Angola
--    (nome, telefone e morada). Só a outra parte da entrega os vê, e só enquanto a entrega está ativa.
--  * Depois de o pagamento ficar retido (estado "garantia") e até a entrega ser confirmada, as duas partes veem o contacto uma da outra.
--    Antes disso não: assim o pagamento passa sempre pela app. Depois da entrega os contactos deixam de aparecer.
--  * Até correres este ficheiro, a app não pede nem mostra nada disto (e nada quebra).

-- ============ Segurança da pessoa (cifrada pela app, chave PII_KEY) ============
alter table public.identities add column if not exists civil_status text check (civil_status is null or civil_status in ('solteiro', 'casado', 'outro'));
alter table public.identities add column if not exists address_enc text check (address_enc is null or char_length(address_enc) between 20 and 1500);
alter table public.identities add column if not exists family_enc text check (family_enc is null or char_length(family_enc) between 20 and 3000);
grant insert (civil_status, address_enc, family_enc) on public.identities to authenticated;
grant update (civil_status, address_enc, family_enc) on public.identities to authenticated;

-- ============ Recolha e destinatário no pedido ============
alter table public.requests add column if not exists pickup_address text check (pickup_address is null or char_length(pickup_address) between 8 and 300);
alter table public.requests add column if not exists pickup_notes text check (pickup_notes is null or char_length(pickup_notes) <= 300);
alter table public.requests add column if not exists pickup_map text check (pickup_map is null or (char_length(pickup_map) <= 300 and pickup_map ~* '^https?://'));
alter table public.requests add column if not exists recipient_name text check (recipient_name is null or char_length(recipient_name) between 2 and 80);
alter table public.requests add column if not exists recipient_phone text check (recipient_phone is null or recipient_phone ~ '^[0-9+() .-]{9,30}$');
alter table public.requests add column if not exists recipient_address text check (recipient_address is null or char_length(recipient_address) between 8 and 300);

-- ============ Contactos e recolha de uma entrega ativa ============
-- Devolve uma linha só a quem participa na entrega (entregador ou remetente), e só com o pagamento retido ou a encomenda a caminho.
--  * O entregador recebe o contacto do remetente, o local de recolha e quem recebe em Angola.
--  * O remetente recebe o contacto do entregador.
create or replace function public.deal_contacts(p_deal uuid)
returns table (
  as_role text, other_name text, other_phone text,
  pickup_address text, pickup_notes text, pickup_map text,
  recipient_name text, recipient_phone text, recipient_address text
)
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); d public.deals%rowtype; r public.requests%rowtype; t public.trips%rowtype;
begin
  if me is null then return; end if;
  select * into d from public.deals where id = p_deal;
  if not found or d.status not in ('garantia', 'transito') then return; end if;
  if d.traveler_id = me then
    select * into r from public.requests where id = d.request_id;
    if not found then return; end if;
    return query select 'traveler'::text, r.name, r.contact, r.pickup_address, r.pickup_notes, r.pickup_map, r.recipient_name, r.recipient_phone, r.recipient_address;
  elsif d.sender_id = me then
    select * into t from public.trips where id = d.trip_id;
    if not found then return; end if;
    return query select 'sender'::text, t.name, t.contact, null::text, null::text, null::text, null::text, null::text, null::text;
  end if;
end $$;
revoke execute on function public.deal_contacts(uuid) from public, anon;
grant  execute on function public.deal_contacts(uuid) to authenticated;

-- ============ A identificação confirmada não volta a "por confirmar" por se juntar a morada e os familiares ============
-- Antes, qualquer alteração feita pelo dono repunha o estado em "pendente". Agora só os dados de identificação (nome, telefone, BI,
-- passaporte, validades e fotos) o repõem; a morada, o estado civil, os familiares e as impressões de documento não.
-- O dono continua sem poder mudar o estado: fora destes casos fica o que estava.
create or replace function public.ident_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if not public.is_admin() then
    if tg_op = 'INSERT' then
      new.status := 'pendente';
    elsif (to_jsonb(new) - 'status' - 'updated_at' - 'civil_status' - 'address_enc' - 'family_enc' - 'bi_hash' - 'passport_hash')
          is distinct from (to_jsonb(old) - 'status' - 'updated_at' - 'civil_status' - 'address_enc' - 'family_enc' - 'bi_hash' - 'passport_hash') then
      new.status := 'pendente';
    else
      new.status := old.status;
    end if;
  end if;
  return new;
end $$;
