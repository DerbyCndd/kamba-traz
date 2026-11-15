-- Kamba Traz · limite de valor para contas novas.
-- Cola em Supabase → SQL Editor → Run. Pode ser executado de novo.
--
--  * Uma conta é "nova" enquanto não tem nenhuma entrega concluída (entregue ou liberada), como remetente ou como viajante.
--  * Uma conta nova não pode pedir o envio de um item acima do limite (config.new_account_limit_eur, em euros; 0 = sem limite).
--  * Para pedir mais, marca o pedido como URGENTE e justifica (pelo menos 20 caracteres). O pedido fica como qualquer outro
--    por verificar, mas a equipa vê o aviso e a justificação, e decide se aprova ou recusa.
--  * A regra vive na base de dados (gatilho), por isso não se contorna falando com a base diretamente.
--  * A equipa (administradores) e as entradas de exemplo não são afetadas.
--  * Até correres este ficheiro, a app não mostra nada disto (e nada quebra).

alter table public.config add column if not exists new_account_limit_eur integer not null default 150 check (new_account_limit_eur >= 0);
alter table public.requests add column if not exists urgent boolean not null default false;
alter table public.requests add column if not exists urgent_reason text check (urgent_reason is null or char_length(urgent_reason) <= 400);

-- Função interna: a conta ainda não tem nenhuma entrega concluída?
create or replace function public._is_new_account(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (
    select 1 from public.deals d
    where d.status in ('entregue', 'liberado') and (d.sender_id = p_user or d.traveler_id = p_user)
  );
$$;
revoke execute on function public._is_new_account(uuid) from public, anon, authenticated;

-- Para a app saber se a minha conta é nova (só responde sobre quem a pergunta faz).
create or replace function public.am_i_new_account()
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and public._is_new_account(auth.uid());
$$;
revoke execute on function public.am_i_new_account() from public, anon;
grant  execute on function public.am_i_new_account() to authenticated;

-- Gatilho: um pedido de conta nova acima do limite exige "urgente" e justificação.
create or replace function public.enforce_new_account_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare lim integer;
begin
  if new.example or public.is_admin() then return new; end if;
  select new_account_limit_eur into lim from public.config where id = 1;
  new.urgent_reason := nullif(btrim(coalesce(new.urgent_reason, '')), '');
  if coalesce(lim, 0) > 0 and new.item_value > lim and public._is_new_account(new.user_id) then
    if not new.urgent or char_length(coalesce(new.urgent_reason, '')) < 20 then
      raise exception 'Conta nova: o valor do item passa o limite de % €. Marca o pedido como urgente e explica porquê (pelo menos 20 caracteres), para a equipa analisar.', lim
        using errcode = 'P0001';
    end if;
  end if;
  if not new.urgent then new.urgent_reason := null; end if;
  return new;
end $$;
drop trigger if exists requests_new_account_limit_trg on public.requests;
create trigger requests_new_account_limit_trg before insert on public.requests
  for each row execute function public.enforce_new_account_limit();
