-- Corrige "42501: permission denied for table identities" ao guardar a identificação.
-- A app guarda com "inserir ou atualizar" (upsert). Nesse comando a base de dados exige também o direito
-- de ATUALIZAR a coluna user_id, que faltava. Não é um risco: a regra ident_update_own só deixa
-- alterar linhas da própria pessoa e exige que user_id continue a ser o dela. Pode correr-se mais do que uma vez.
grant update (user_id) on public.identities to authenticated;

-- Confirmação: todas as colunas que a app escreve devem aparecer com ins = true e upd = true
-- (bi_hash, passport_hash e status ficam de fora de propósito: só a equipa ou as funções internas os mudam).
select column_name,
       has_column_privilege('authenticated', 'public.identities', column_name, 'INSERT') as ins,
       has_column_privilege('authenticated', 'public.identities', column_name, 'UPDATE') as upd
from information_schema.columns
where table_schema = 'public' and table_name = 'identities'
order by ordinal_position;
