-- Kamba Traz · avaliações e classificação (entregador e remetente).
-- Cola em Supabase → SQL Editor → Run (depois de schema.sql). Pode ser executado de novo.
--
-- Como funciona:
--  * Quando a equipa marca uma entrega como "entregue", as duas partes podem avaliar-se (1 a 5 estrelas).
--  * Cada pessoa tem duas classificações: como ENTREGADOR (quem leva) e como REMETENTE (quem pede o envio).
--  * Só quem participou na entrega pode avaliar, uma vez por entrega, e nunca a si próprio.
--  * Entradas de exemplo não geram avaliações.
--  * Ninguém grava avaliações directamente na tabela: tudo passa pela função rate_deal, que valida tudo.
--  * O ranking público mostra só o primeiro nome, a média e o número de avaliações.

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  rater_id uuid not null references public.profiles(id) on delete cascade,
  ratee_id uuid not null references public.profiles(id) on delete cascade,
  ratee_role text not null check (ratee_role in ('traveler','requester')),
  stars smallint not null check (stars between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 280),
  created_at timestamptz not null default now(),
  unique (deal_id, rater_id),
  check (rater_id <> ratee_id)
);
create index if not exists ratings_ratee_idx on public.ratings (ratee_id, ratee_role);

alter table public.ratings enable row level security;
revoke all on public.ratings from anon, authenticated;
grant select on public.ratings to authenticated;

-- Lê quem avaliou, quem foi avaliado e a equipa (para moderar). Escrever só pela função.
drop policy if exists ratings_read on public.ratings;
create policy ratings_read on public.ratings for select to authenticated
  using (rater_id = auth.uid() or ratee_id = auth.uid() or public.is_admin());

-- ============ Avaliar uma entrega ============
create or replace function public.rate_deal(p_deal uuid, p_stars int, p_comment text default '')
returns void language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  d public.deals%rowtype;
  t_user uuid; r_user uuid; t_ex boolean; r_ex boolean;
  ratee uuid; role text;
begin
  if me is null then raise exception 'Entra na tua conta para avaliar.' using errcode = '42501'; end if;
  if p_stars is null or p_stars < 1 or p_stars > 5 then raise exception 'Escolhe de 1 a 5 estrelas.' using errcode = '22023'; end if;
  if char_length(coalesce(p_comment, '')) > 280 then raise exception 'O comentário pode ter até 280 caracteres.' using errcode = '22023'; end if;

  select * into d from public.deals where id = p_deal;
  if not found or d.status not in ('entregue', 'liberado') then
    raise exception 'Esta entrega ainda não pode ser avaliada.' using errcode = 'P0001';
  end if;

  select user_id, example into t_user, t_ex from public.trips    where id = d.trip_id;
  select user_id, example into r_user, r_ex from public.requests where id = d.request_id;
  if t_user is null or r_user is null or t_ex or r_ex or t_user = r_user then
    raise exception 'Esta entrega não pode ser avaliada.' using errcode = 'P0001';
  end if;

  if me = t_user then ratee := r_user; role := 'requester';
  elsif me = r_user then ratee := t_user; role := 'traveler';
  else raise exception 'Só quem participou na entrega a pode avaliar.' using errcode = '42501';
  end if;

  if exists (select 1 from public.ratings where deal_id = p_deal and rater_id = me) then
    raise exception 'Já avaliaste esta entrega.' using errcode = '23505';
  end if;

  insert into public.ratings (deal_id, rater_id, ratee_id, ratee_role, stars, comment)
  values (p_deal, me, ratee, role, p_stars, btrim(coalesce(p_comment, '')));
end $$;

-- ============ O que falta avaliar (para quem tem sessão) ============
create or replace function public.my_pending_ratings()
returns table (deal_id uuid, label text, counterpart text, ratee_role text)
language sql stable security definer set search_path = public as $$
  select d.id, d.label,
         split_part(coalesce(nullif(cp.full_name, ''), 'Utilizador'), ' ', 1),
         case when t.user_id = auth.uid() then 'requester' else 'traveler' end
  from public.deals d
  join public.trips t    on t.id = d.trip_id    and not t.example
  join public.requests r on r.id = d.request_id and not r.example
  join public.profiles cp on cp.id = case when t.user_id = auth.uid() then r.user_id else t.user_id end
  where d.status in ('entregue', 'liberado')
    and t.user_id <> r.user_id
    and (t.user_id = auth.uid() or r.user_id = auth.uid())
    and not exists (select 1 from public.ratings x where x.deal_id = d.id and x.rater_id = auth.uid())
  order by d.created_at desc;
$$;

-- ============ A minha classificação ============
create or replace function public.my_rating_summary()
returns table (ratee_role text, avg_stars numeric, total int)
language sql stable security definer set search_path = public as $$
  select ratee_role, round(avg(stars)::numeric, 2), count(*)::int
  from public.ratings where ratee_id = auth.uid() group by ratee_role;
$$;

-- ============ Classificação por período (interna) ============
-- Regras do ranking e do prémio do mês (um mês sem taxas para o 1.º de cada função):
--  * Só contam as avaliações recebidas no período (a app usa o mês, hora de Luanda).
--  * Quem tem 3 ou mais avaliações no período fica à frente e é quem pode ganhar.
--  * Entre esses: maior média primeiro. DESEMPATE: em média igual, ganha quem tem MENOS entregas avaliadas
--    (igualar a média com menos entregas vale mais). Se ainda empatarem, decide o identificador (sempre igual).
--  * Quem tem menos de 3 avaliações vem depois, por média ponderada (3 avaliações "neutras" puxam para a média geral).
create or replace function public.ranked_ratings(p_role text, p_from timestamptz, p_to timestamptz)
returns table (ratee_id uuid, avg_stars numeric, total int, eligible boolean, pos bigint)
language sql stable security definer set search_path = public as $$
  with g as (
    select coalesce(avg(stars), 4)::numeric as c from public.ratings
    where ratee_role = p_role and created_at >= p_from and created_at < p_to
  ),
  agg as (
    select r.ratee_id as uid, avg(r.stars)::numeric as a, count(*)::int as n
    from public.ratings r
    where r.ratee_role = p_role and r.created_at >= p_from and r.created_at < p_to
    group by r.ratee_id
  )
  select agg.uid, round(agg.a, 2), agg.n, agg.n >= 3,
         row_number() over (
           order by (agg.n >= 3) desc,
                    case when agg.n >= 3 then agg.a end desc nulls last,
                    case when agg.n >= 3 then agg.n end asc nulls last,
                    (agg.n * agg.a + 3 * g.c) / (agg.n + 3) desc,
                    agg.n desc,
                    agg.uid
         )
  from agg cross join g
  where p_role in ('traveler', 'requester');
$$;

-- ============ Os melhores de cada função (público) ============
-- p_since: início do período (a app passa o início do mês em Luanda); sem p_since conta tudo.
drop function if exists public.top_rated(text, int);
create or replace function public.top_rated(p_role text, p_limit int default 3, p_since timestamptz default null)
returns table (first_name text, avg_stars numeric, total int)
language sql stable security definer set search_path = public as $$
  select split_part(coalesce(nullif(p.full_name, ''), 'Utilizador'), ' ', 1), k.avg_stars, k.total
  from public.ranked_ratings(p_role, coalesce(p_since, '-infinity'::timestamptz), 'infinity'::timestamptz) k
  join public.profiles p on p.id = k.ratee_id
  order by k.pos
  limit least(greatest(coalesce(p_limit, 3), 1), 10);
$$;

-- ============ Prémio do mês: um mês sem taxas ============
-- Ganhador de um mês (p_month = primeiro dia desse mês): o 1.º elegível de cada função. Sem ninguém elegível, ninguém ganha.
create or replace function public.monthly_winner(p_role text, p_month date)
returns uuid language sql stable security definer set search_path = public as $$
  select k.ratee_id
  from public.ranked_ratings(
         p_role,
         p_month::timestamp at time zone 'Africa/Luanda',
         (p_month + interval '1 month')::timestamp at time zone 'Africa/Luanda') k
  where k.eligible and k.pos = 1;
$$;

-- Mês anterior ao dia indicado (primeiro dia).
create or replace function public.prev_month_start(p_on date default current_date)
returns date language sql immutable as $$
  select (date_trunc('month', p_on::timestamp) - interval '1 month')::date;
$$;

-- Quem tem a isenção agora (ganhou o mês passado). Só a equipa vê a lista completa.
create or replace function public.fee_waiver_holders()
returns table (user_id uuid, role text, first_name text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  return query
    select w.uid, w.r, split_part(coalesce(nullif(p.full_name, ''), 'Utilizador'), ' ', 1)
    from (
      select public.monthly_winner('traveler',  public.prev_month_start()) as uid, 'traveler'::text  as r
      union all
      select public.monthly_winner('requester', public.prev_month_start()), 'requester'
    ) w
    join public.profiles p on p.id = w.uid
    where w.uid is not null;
end $$;

-- Os prémios de quem está com sessão (para o perfil).
create or replace function public.my_fee_waivers()
returns table (role text)
language sql stable security definer set search_path = public as $$
  select 'traveler'::text  where public.monthly_winner('traveler',  public.prev_month_start()) = auth.uid()
  union all
  select 'requester'::text where public.monthly_winner('requester', public.prev_month_start()) = auth.uid();
$$;

-- Ganhadores do mês passado, para mostrar no site (só o primeiro nome).
create or replace function public.last_month_winners()
returns table (role text, first_name text)
language sql stable security definer set search_path = public as $$
  select w.r, split_part(coalesce(nullif(p.full_name, ''), 'Utilizador'), ' ', 1)
  from (
    select public.monthly_winner('traveler',  public.prev_month_start()) as uid, 'traveler'::text as r
    union all
    select public.monthly_winner('requester', public.prev_month_start()), 'requester'
  ) w
  join public.profiles p on p.id = w.uid
  where w.uid is not null;
$$;

-- A entrega isenta de comissão? Sim se o entregador ganhou como entregador, ou o remetente ganhou como remetente.
-- Só a equipa chama isto (ao criar a entrega).
create or replace function public.deal_fee_waived(p_request uuid, p_trip uuid, p_on date default current_date)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare t_user uuid; r_user uuid; prev date := public.prev_month_start(p_on);
begin
  if not public.is_admin() then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  select user_id into t_user from public.trips    where id = p_trip    and not example;
  select user_id into r_user from public.requests where id = p_request and not example;
  return (t_user is not null and public.monthly_winner('traveler',  prev) = t_user)
      or (r_user is not null and public.monthly_winner('requester', prev) = r_user);
end $$;

-- A entrega guarda se foi isenta (para a equipa ver o motivo).
alter table public.deals add column if not exists fee_waived boolean not null default false;

revoke execute on function public.rate_deal(uuid, int, text), public.my_pending_ratings(), public.my_rating_summary(),
                           public.top_rated(text, int, timestamptz), public.ranked_ratings(text, timestamptz, timestamptz),
                           public.monthly_winner(text, date), public.prev_month_start(date), public.fee_waiver_holders(),
                           public.my_fee_waivers(), public.last_month_winners(), public.deal_fee_waived(uuid, uuid, date) from public;
grant execute on function public.rate_deal(uuid, int, text), public.my_pending_ratings(), public.my_rating_summary(),
                          public.my_fee_waivers(), public.fee_waiver_holders(), public.deal_fee_waived(uuid, uuid, date) to authenticated;
grant execute on function public.top_rated(text, int, timestamptz), public.last_month_winners() to anon, authenticated;

-- ============ Classificação do autor nos cartões do quadro ============
-- Colunas novas no fim das vistas (as antigas mantêm a ordem).
create or replace view public.trips_public with (security_barrier = true) as
  select id, origin, destination, travel_date, kg, per_kg,
         split_part(name, ' ', 1) as name, status, example, created_at,
         (select round(avg(x.stars)::numeric, 2) from public.ratings x where x.ratee_id = trips.user_id and x.ratee_role = 'traveler') as rating,
         (select count(*)::int from public.ratings x where x.ratee_id = trips.user_id and x.ratee_role = 'traveler') as rating_count
  from public.trips
  where status in ('aberto','cheia','concluida');

create or replace view public.requests_public with (security_barrier = true) as
  select id, origin, destination, item, category, kg, offer, deadline,
         split_part(name, ' ', 1) as name, status, example, created_at,
         (select round(avg(x.stars)::numeric, 2) from public.ratings x where x.ratee_id = requests.user_id and x.ratee_role = 'requester') as rating,
         (select count(*)::int from public.ratings x where x.ratee_id = requests.user_id and x.ratee_role = 'requester') as rating_count
  from public.requests
  where status in ('aberto','ligado','entregue');

-- Pré-visualização pública (página inicial para visitantes), se já existir.
do $$ begin
  if to_regclass('public.trips_preview') is not null then
    execute $v$
      create or replace view public.trips_preview with (security_barrier = true) as
        select origin, destination, travel_date, kg, per_kg, status, example,
               (select round(avg(x.stars)::numeric, 2) from public.ratings x where x.ratee_id = trips.user_id and x.ratee_role = 'traveler') as rating,
               (select count(*)::int from public.ratings x where x.ratee_id = trips.user_id and x.ratee_role = 'traveler') as rating_count
        from public.trips where status in ('aberto','cheia') and travel_date >= current_date
    $v$;
    execute $v$
      create or replace view public.requests_preview with (security_barrier = true) as
        select origin, destination, category, kg, offer, deadline, status, example,
               (select round(avg(x.stars)::numeric, 2) from public.ratings x where x.ratee_id = requests.user_id and x.ratee_role = 'requester') as rating,
               (select count(*)::int from public.ratings x where x.ratee_id = requests.user_id and x.ratee_role = 'requester') as rating_count
        from public.requests where status = 'aberto'
    $v$;
  end if;
end $$;
