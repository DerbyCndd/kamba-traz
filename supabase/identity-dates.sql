-- Kamba Traz · validade do BI e do passaporte. Corre no SQL Editor do Supabase (depois de identity.sql). Pode ser executado de novo.
-- As colunas ficam opcionais na base (contas já criadas não as têm); a app exige-as a quem se identifica a partir de agora.
alter table public.identities add column if not exists bi_expiry date;
alter table public.identities add column if not exists passport_expiry date;

grant insert (bi_expiry, passport_expiry) on public.identities to authenticated;
grant update (bi_expiry, passport_expiry) on public.identities to authenticated;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'identities_expiry_chk') then
    alter table public.identities add constraint identities_expiry_chk check (
      (bi_expiry is null or bi_expiry between date '2000-01-01' and date '2100-01-01')
      and (passport_expiry is null or passport_expiry between date '2000-01-01' and date '2100-01-01')
      and (passport_expiry is null or passport_enc is not null)
    ) not valid;
  end if;
end $$;
