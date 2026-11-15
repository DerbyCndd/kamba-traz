-- Kamba Traz · correções da auditoria de segurança. Corre no SQL Editor do Supabase (uma vez). Pode ser executado de novo.
--
-- Porquê: no Supabase, «revoke ... from public» NÃO tira a permissão que o papel anónimo (anon) recebe por defeito em cada
-- função. Por isso algumas funções internas respondiam a quem não tinha sessão.

-- 1. Funções internas: ninguém as chama de fora (só outras funções da própria base).
revoke execute on function
  public.ranked_ratings(text, timestamptz, timestamptz),
  public.monthly_winner(text, date),
  public.prev_month_start(date),
  public.rl_ok(text)
from public, anon, authenticated;

-- 2. Funções que só quem tem sessão usa: o anónimo deixa de poder chamá-las.
revoke execute on function
  public.rate_deal(uuid, int, text),
  public.my_pending_ratings(),
  public.my_rating_summary(),
  public.my_fee_waivers(),
  public.fee_waiver_holders(),
  public.deal_fee_waived(uuid, uuid, date)
from public, anon;
grant execute on function
  public.rate_deal(uuid, int, text),
  public.my_pending_ratings(),
  public.my_rating_summary(),
  public.my_fee_waivers(),
  public.fee_waiver_holders(),
  public.deal_fee_waived(uuid, uuid, date)
to authenticated;

revoke execute on function public.ident_guard() from public, anon, authenticated;

-- A versão antiga de top_rated (2 parâmetros) ficou ao lado da nova e torna a chamada ambígua.
drop function if exists public.top_rated(text, int);

-- 3. Feedback: já não se insere diretamente pela API pública (isso contornava o limite por IP e o campo-armadilha).
-- A app passa a gravar por esta função, que exige o segredo que só o servidor conhece.
create or replace function public.submit_feedback(
  p_secret text, p_user uuid, p_kind text, p_rating int, p_message text, p_email text, p_page text
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.rl_ok(p_secret) then raise exception 'não autorizado' using errcode = '42501'; end if;
  insert into public.feedback (user_id, kind, rating, message, email, page)
  values (p_user, p_kind, p_rating, p_message, nullif(p_email, ''), coalesce(p_page, ''));
end $$;
revoke execute on function public.submit_feedback(text, uuid, text, int, text, text, text) from public;
grant execute on function public.submit_feedback(text, uuid, text, int, text, text, text) to anon, authenticated;

revoke insert on public.feedback from anon, authenticated;
drop policy if exists feedback_insert on public.feedback;

-- 4. (corre antes storage-fix.sql, que cria public.storage_count)
-- Ficheiros: cada pessoa só pode ter um número limitado de ficheiros em cada espaço (evita encher o armazenamento).
do $$
declare b record;
begin
  for b in select * from (values ('tickets', 20), ('ids', 12), ('avatars', 6), ('invoices', 60)) as t(bucket, maxfiles)
  loop
    execute format('drop policy if exists %I on storage.objects', b.bucket || '_insert_own');
    execute format($p$create policy %I on storage.objects for insert to authenticated with check (
      bucket_id = %L and (storage.foldername(name))[1] = auth.uid()::text
      and public.storage_count(%L, auth.uid()) < %s -- função: ler storage.objects aqui dentro dava recursão infinita (ver storage-fix.sql)
    )$p$, b.bucket || '_insert_own', b.bucket, b.bucket, b.maxfiles);
  end loop;
end $$;

-- 5. Uma entrega liga duas pessoas diferentes: ninguém é remetente e viajante da mesma entrega.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'deals_parties_chk') then
    alter table public.deals add constraint deals_parties_chk
      check (sender_id is null or traveler_id is null or sender_id <> traveler_id) not valid;
  end if;
end $$;
