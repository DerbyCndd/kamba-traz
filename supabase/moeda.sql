-- Kamba Traz · valor do item na moeda do país de origem.
-- Cola em Supabase → SQL Editor → Run. Pode ser executado de novo.
--
--  * O valor do item (item_value) continua guardado em EUROS: é a base da fatura, do teto por viagem, da estimativa da
--    alfândega e do limite das contas novas.
--  * Estas duas colunas guardam o que a pessoa escreveu e em que moeda, para a equipa ver o valor original.
--  * Até correres este ficheiro, a app converte para euros na mesma, mas não guarda o valor original (e nada quebra).

alter table public.requests add column if not exists item_currency text check (item_currency is null or item_currency in ('EUR', 'GBP', 'BRL', 'AED', 'ZAR'));
alter table public.requests add column if not exists item_amount numeric check (item_amount is null or (item_amount >= 0 and item_amount <= 100000000));
