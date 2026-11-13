-- Kamba Traz · "Deixe o seu feedback".
-- Cola em Supabase → SQL Editor → Run. Pode ser executado de novo.
-- Qualquer pessoa (com ou sem conta) pode enviar feedback; só a equipa o lê e gere.
-- A app limita os envios por IP e esconde um campo-armadilha para robôs.

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  kind text not null default 'ideia' check (kind in ('elogio', 'ideia', 'problema', 'outro')),
  rating smallint check (rating between 1 and 5),
  message text not null check (char_length(message) between 5 and 1000),
  email text check (email is null or char_length(email) <= 120),
  page text not null default '' check (char_length(page) <= 100),
  status text not null default 'novo' check (status in ('novo', 'lido', 'resolvido')),
  created_at timestamptz not null default now()
);
create index if not exists feedback_status_idx on public.feedback (status, created_at desc);

alter table public.feedback enable row level security;
revoke all on public.feedback from anon, authenticated;
grant insert on public.feedback to anon, authenticated;
grant select, update, delete on public.feedback to authenticated; -- só a equipa passa nas políticas

-- Envia quem quiser, mas sempre como "novo" e, se tiver conta, só em nome próprio.
drop policy if exists feedback_insert on public.feedback;
create policy feedback_insert on public.feedback for insert to anon, authenticated
  with check (status = 'novo' and (user_id is null or user_id = auth.uid()));

-- Lê e gere a equipa.
drop policy if exists feedback_admin_all on public.feedback;
create policy feedback_admin_all on public.feedback for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
