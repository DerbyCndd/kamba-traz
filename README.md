# Kamba Traz

Next.js (App Router) + Supabase (login por email verificado, Postgres, RLS).

## Pôr a funcionar

1. **Criar o projecto Supabase** (gratuito) em https://supabase.com → New project.
2. **Base de dados:** Supabase → SQL Editor → cola `supabase/schema.sql` → Run.
3. **Chaves:** Project Settings → API. Copia `.env.example` para `.env.local` e preenche
   `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (chave anon/publishable, nunca a service_role).
4. **Verificação por email:** Authentication → Sign In / Providers → Email → deixa **Confirm email** ligado.
5. **Links dos emails** (para funcionarem noutro telemóvel/browser): Authentication → Email Templates.
   - *Confirm signup*: troca o link por
     `<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email">Confirmar email</a>`
   - *Reset password*: troca o link por
     `<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery">Escolher nova palavra-passe</a>`
6. **URLs:** Authentication → URL Configuration → Site URL = o endereço do site
   (`http://localhost:3000` em desenvolvimento) e adiciona `http://localhost:3000/**` aos Redirect URLs.
7. `npm install` e `npm run dev` → http://localhost:3000. Regista-te e confirma o email.
8. **Tornar-te administrador** (SQL Editor, com o teu email):
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'o-teu-email@exemplo.com');
   ```
   Aparece o separador **Equipa**. Em Definições põe o WhatsApp e a comissão.

## Antes de ir para produção

- O envio de emails do Supabase por omissão tem limite muito baixo (poucos por hora). Configura SMTP próprio
  (Authentication → SMTP Settings), por exemplo Resend ou Brevo, ambos com plano gratuito.
- Projectos gratuitos do Supabase pausam após cerca de uma semana sem actividade.
- Define `NEXT_PUBLIC_SITE_URL` com o domínio real (ex.: no Vercel) e actualiza o Site URL no Supabase.
- O pagamento em garantia e o código de entrega ainda não estão ligados a nenhum fornecedor: hoje a equipa
  acompanha os estados à mão no painel (como no protótipo).

## Monitorização

- **Site no ar:** `/api/saude` responde 200 se o site e a base de dados funcionam e 503 se não (não mostra dados). Aponte para lá um serviço de monitorização gratuito (por exemplo UptimeRobot), com aviso por email ou Telegram.
- **Resumo diário da equipa:** a Vercel chama `/api/cron/resumo` todos os dias às 08:00 UTC (`vercel.json`). Envia só contagens (entradas por aprovar, identificações, acordos, pagamentos, tentativas de entrada), nunca dados de pessoas. Para funcionar:
  1. Correr `supabase/monitor.sql` no SQL Editor.
  2. Na Vercel, definir `CRON_SECRET` (mínimo 16 caracteres) e um canal: `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`, ou `RESEND_API_KEY` + `DIGEST_EMAIL` (ver `.env.example`). Sem canal, o resumo corre mas não é enviado.
- **Bibliotecas:** o Dependabot (`.github/dependabot.yml`) abre um pedido por semana quando há versões novas ou falhas de segurança conhecidas.

## Estrutura

- `src/proxy.ts` — renova a sessão e manda para `/login` quem não tem email verificado.
- `src/app/(auth)` — login, registo, recuperação. `src/app/auth/callback` — links dos emails.
- `src/app/actions.ts` — pedidos e viagens (validação no servidor, entram como `pendente`).
- `src/app/admin` — painel da equipa (só `role = 'admin'`, protegido no servidor e por RLS).
- `supabase/schema.sql` — tabelas, políticas RLS e vistas públicas (sem contactos).
