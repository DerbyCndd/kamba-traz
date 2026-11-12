-- Kamba Traz · esquema da base de dados (Supabase / Postgres)
-- Cola este ficheiro inteiro em Supabase → SQL Editor → Run. Pode ser executado de novo sem estragar dados.

-- ============ Perfis ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);

-- Cria o perfil automaticamente quando alguém se regista.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Verdadeiro se quem faz o pedido é da equipa.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ============ Definições do negócio (uma só linha) ============
create table if not exists public.config (
  id int primary key default 1 check (id = 1),
  commission numeric not null default 12 check (commission between 0 and 50),
  per_kg integer not null default 8000 check (per_kg >= 0),
  whatsapp text not null default ''
);
insert into public.config (id) values (1) on conflict do nothing;

-- ============ Viagens ============
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  contact text not null check (char_length(contact) between 9 and 30),
  origin text not null,
  destination text not null,
  travel_date date not null,
  flight text not null default '' check (char_length(flight) <= 30),
  kg numeric not null check (kg > 0 and kg <= 100),
  per_kg integer not null check (per_kg >= 0),
  status text not null default 'pendente' check (status in ('pendente','aberto','cheia','concluida','recusado')),
  example boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists trips_board_idx on public.trips (status, origin, destination, travel_date);
create index if not exists trips_user_idx on public.trips (user_id);

-- ============ Pedidos de envio ============
create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  contact text not null check (char_length(contact) between 9 and 30),
  origin text not null,
  destination text not null,
  item text not null check (char_length(item) between 3 and 90),
  category text not null,
  kg numeric not null check (kg > 0 and kg <= 100),
  item_value numeric not null default 0 check (item_value >= 0),
  offer integer not null check (offer > 0),
  deadline date,
  status text not null default 'pendente' check (status in ('pendente','aberto','ligado','entregue','recusado')),
  example boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists requests_board_idx on public.requests (status, origin, destination);
create index if not exists requests_user_idx on public.requests (user_id);

-- ============ Entregas (só a equipa) ============
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.requests(id) on delete set null,
  trip_id uuid references public.trips(id) on delete set null,
  label text not null,
  traveler text not null,
  requester text not null,
  price integer not null check (price > 0),
  commission_pct numeric not null,
  commission integer not null,
  status text not null default 'negociacao' check (status in ('negociacao','garantia','transito','entregue','liberado','cancelado')),
  created_at timestamptz not null default now()
);

-- ============ Segurança ao nível da linha (RLS) ============
alter table public.profiles enable row level security;
alter table public.config   enable row level security;
alter table public.trips    enable row level security;
alter table public.requests enable row level security;
alter table public.deals    enable row level security;

drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists config_read on public.config;
create policy config_read on public.config for select to authenticated using (true);
drop policy if exists config_admin_write on public.config;
create policy config_admin_write on public.config for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Viagens: cada pessoa vê e cria as suas (sempre como "pendente"); a equipa vê e muda tudo.
drop policy if exists trips_owner_read on public.trips;
create policy trips_owner_read on public.trips for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists trips_owner_insert on public.trips;
create policy trips_owner_insert on public.trips for insert to authenticated
  with check (user_id = auth.uid() and status = 'pendente' and example = false);
drop policy if exists trips_admin_write on public.trips;
create policy trips_admin_write on public.trips for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists requests_owner_read on public.requests;
create policy requests_owner_read on public.requests for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists requests_owner_insert on public.requests;
create policy requests_owner_insert on public.requests for insert to authenticated
  with check (user_id = auth.uid() and status = 'pendente' and example = false);
drop policy if exists requests_admin_write on public.requests;
create policy requests_admin_write on public.requests for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists deals_admin_all on public.deals;
create policy deals_admin_all on public.deals for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ============ Vistas públicas (quadro) ============
-- Mostram só viagens/pedidos aprovados, apenas o primeiro nome e nunca o contacto.
-- Correm com os direitos do dono da vista de propósito: é assim que escondem as colunas privadas.
create or replace view public.trips_public as
  select id, origin, destination, travel_date, kg, per_kg,
         split_part(name, ' ', 1) as name, status, example, created_at
  from public.trips
  where status in ('aberto','cheia','concluida');

create or replace view public.requests_public as
  select id, origin, destination, item, category, kg, offer, deadline,
         split_part(name, ' ', 1) as name, status, example, created_at
  from public.requests
  where status in ('aberto','ligado','entregue');

revoke all on public.trips_public, public.requests_public from anon;
grant select on public.trips_public, public.requests_public to authenticated;

-- ============ Tornar alguém administrador ============
-- Depois de te registares e confirmares o email, corre (troca pelo teu email):
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'o-teu-email@exemplo.com');
