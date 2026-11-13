-- Kamba Traz · preço de referência visível a todos (para a calculadora da página inicial).
-- Cola em Supabase → SQL Editor → Run. Pode ser executado de novo.
-- Mostra só o preço de referência por kg e a taxa da Kamba (o que já se mostra na calculadora a quem tem conta).
create or replace function public.public_pricing()
returns table (per_kg int, commission numeric)
language sql stable security definer set search_path = public as $$
  select c.per_kg, c.commission from public.config c where c.id = 1;
$$;
revoke execute on function public.public_pricing() from public;
grant execute on function public.public_pricing() to anon, authenticated;
