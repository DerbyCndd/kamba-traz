-- Kamba Traz · selfie a segurar o BI (a equipa compara o rosto com o documento).
-- Cola em Supabase → SQL Editor → Run (depois de identity.sql e contactos.sql). Pode ser executado de novo.
--
--  * Cada pessoa envia uma selfie a segurar o BI aberto ao lado do rosto. Fica no espaço PRIVADO "ids" (só o dono e a equipa).
--  * A comparação é feita pela equipa, à vista: reduz documentos emprestados ou roubados. Não é reconhecimento facial automático.
--  * Até correres este ficheiro, a app não pede a selfie (e nada quebra).

alter table public.identities add column if not exists selfie_path text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'identities_selfie_chk') then
    alter table public.identities add constraint identities_selfie_chk check (selfie_path is null or selfie_path like user_id::text || '/%') not valid;
  end if;
end $$;
grant insert (selfie_path) on public.identities to authenticated;
grant update (selfie_path) on public.identities to authenticated;

-- Juntar a selfie, a morada ou os familiares não faz voltar a identificação confirmada a "por confirmar"
-- (só os dados de identificação o fazem). O dono continua sem poder mudar o estado.
create or replace function public.ident_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if not public.is_admin() then
    if tg_op = 'INSERT' then
      new.status := 'pendente';
    elsif (to_jsonb(new) - 'status' - 'updated_at' - 'civil_status' - 'address_enc' - 'family_enc' - 'selfie_path' - 'bi_hash' - 'passport_hash')
          is distinct from (to_jsonb(old) - 'status' - 'updated_at' - 'civil_status' - 'address_enc' - 'family_enc' - 'selfie_path' - 'bi_hash' - 'passport_hash') then
      new.status := 'pendente';
    else
      new.status := old.status;
    end if;
  end if;
  return new;
end $$;
