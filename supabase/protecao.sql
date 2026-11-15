-- Kamba Traz · proteção: denúncias numa entrega e reputação da outra parte.
-- Cola em Supabase → SQL Editor → Run (depois de schema.sql, delivery.sql, offers.sql, ratings.sql e identity.sql). Pode ser executado de novo.
--
--  * Quem participa numa entrega pode denunciar um problema (encomenda não chegou, volume diferente, item proibido, conduta).
--    A denúncia vai para a equipa; a outra parte NÃO a vê. Escreve-se só pela função report_deal, que valida tudo.
--  * Antes de aceitar uma proposta, cada parte vê a reputação da outra: média e número de avaliações, entregas concluídas
--    e se a identificação foi confirmada pela equipa. Só se pode ver quem tem uma proposta ou entrega consigo (a equipa vê todos).

-- ============ Denúncias ============
create table if not exists public.deal_reports (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('nao_recebida', 'volume_diferente', 'item_proibido', 'conduta', 'outro')),
  message text not null check (char_length(message) between 10 and 600),
  status text not null default 'aberta' check (status in ('aberta', 'em_analise', 'resolvida')),
  created_at timestamptz not null default now()
);
create index if not exists deal_reports_status_idx on public.deal_reports (status, created_at desc);
create index if not exists deal_reports_deal_idx on public.deal_reports (deal_id);

alter table public.deal_reports enable row level security;
revoke all on public.deal_reports from anon, authenticated;
grant select on public.deal_reports to authenticated;
grant update (status) on public.deal_reports to authenticated; -- só passa nas políticas da equipa

-- Lê quem denunciou (só as suas) e a equipa. Escrever só pela função.
drop policy if exists deal_reports_read on public.deal_reports;
create policy deal_reports_read on public.deal_reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());
drop policy if exists deal_reports_admin_update on public.deal_reports;
create policy deal_reports_admin_update on public.deal_reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create or replace function public.report_deal(p_deal uuid, p_kind text, p_message text)
returns void language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  d public.deals%rowtype;
  msg text := btrim(coalesce(p_message, ''));
begin
  if me is null then raise exception 'Entra na tua conta para denunciar.' using errcode = '42501'; end if;
  if p_kind is null or p_kind not in ('nao_recebida', 'volume_diferente', 'item_proibido', 'conduta', 'outro') then
    raise exception 'Escolhe o tipo de problema.' using errcode = '22023';
  end if;
  if char_length(msg) < 10 or char_length(msg) > 600 then
    raise exception 'Descreve o problema em 10 a 600 caracteres.' using errcode = '22023';
  end if;

  select * into d from public.deals where id = p_deal;
  if not found or (d.sender_id is distinct from me and d.traveler_id is distinct from me) then
    raise exception 'Só quem participa nesta entrega a pode denunciar.' using errcode = '42501';
  end if;
  if (select count(*) from public.deal_reports where reporter_id = me and created_at > now() - interval '1 day') >= 5 then
    raise exception 'Já enviaste várias denúncias hoje. A equipa vai analisá-las.' using errcode = 'P0001';
  end if;

  insert into public.deal_reports (deal_id, reporter_id, kind, message) values (p_deal, me, p_kind, msg);
end $$;
revoke execute on function public.report_deal(uuid, text, text) from public, anon;
grant  execute on function public.report_deal(uuid, text, text) to authenticated;

-- ============ Reputação da outra parte ============
create or replace function public.party_reputation(p_users uuid[])
returns table (user_id uuid, avg_stars numeric, total int, deals_done int, id_confirmed boolean)
language sql stable security definer set search_path = public as $$
  select u.id,
         (select round(avg(r.stars)::numeric, 2) from public.ratings r where r.ratee_id = u.id),
         (select count(*)::int from public.ratings r where r.ratee_id = u.id),
         (select count(*)::int from public.deals d where d.status in ('entregue', 'liberado') and (d.sender_id = u.id or d.traveler_id = u.id)),
         exists (select 1 from public.identities i where i.user_id = u.id and i.status = 'confirmado')
  from unnest(p_users) as u(id)
  where auth.uid() is not null
    and (
      public.is_admin()
      or exists (select 1 from public.offers o where (o.from_user = auth.uid() and o.to_user = u.id) or (o.to_user = auth.uid() and o.from_user = u.id))
      or exists (select 1 from public.deals d where (d.sender_id = auth.uid() and d.traveler_id = u.id) or (d.traveler_id = auth.uid() and d.sender_id = u.id))
    );
$$;
revoke execute on function public.party_reputation(uuid[]) from public, anon;
grant  execute on function public.party_reputation(uuid[]) to authenticated;
