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
- O pagamento retido ainda não está ligado a nenhum fornecedor: a equipa confirma-o no painel quando o dinheiro chega.
  O resto do caminho da entrega é feito na app (ver «Entregas»).

## Monitorização

- **Site no ar:** `/api/saude` responde 200 se o site e a base de dados funcionam e 503 se não (não mostra dados). Aponte para lá um serviço de monitorização gratuito (por exemplo UptimeRobot), com aviso por email ou Telegram.
- **Resumo diário da equipa:** a Vercel chama `/api/cron/resumo` todos os dias às 08:00 UTC (`vercel.json`). Envia só contagens (entradas por aprovar, identificações, acordos, pagamentos, tentativas de entrada), nunca dados de pessoas. Para funcionar:
  1. Correr `supabase/monitor.sql` no SQL Editor.
  2. Na Vercel, definir `CRON_SECRET` (mínimo 16 caracteres) e um canal: `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`, ou `RESEND_API_KEY` + `DIGEST_EMAIL` (ver `.env.example`). Sem canal, o resumo corre mas não é enviado.
- **Erros da app (Sentry):** o código está pronto e fica desligado até existir `NEXT_PUBLIC_SENTRY_DSN`. Crie um projeto Next.js em sentry.io, copie o DSN e ponha-o na Vercel (produção). Só envia o tipo de erro, o texto e o sítio do código: nunca cookies, cabeçalhos, IP, utilizador, dados do pedido, texto depois do «?» das ligações nem o rasto de cliques (ver `src/lib/sentry.ts`). Não envia desempenho nem gravação de sessões.
- **Bibliotecas:** o Dependabot (`.github/dependabot.yml`) abre um pedido por semana quando há versões novas ou falhas de segurança conhecidas.

## Ficheiros SQL (por ordem)

Correm no SQL Editor do Supabase e podem ser executados de novo. Depois de `schema.sql` e dos que já estão em produção,
os mais recentes são:

1. `supabase/matching.sql` — funções do emparelhamento (viagens sugeridas e pedidos que cabem na mala, sem contactos).
2. `supabase/niveis.sql` — verificação por níveis: nível 1 para publicar pedidos, nível 2 para viajar e levar encomendas.
3. `supabase/estados-entrega.sql` — estados da entrega, histórico, código de entrega (só hash, com validade) e avisos.
4. `supabase/metricas.sql` — eventos do piloto (sem dados pessoais) para o separador Análise.

Testes das regras de acesso (não guardam nada; a mensagem final diz se passou): `supabase/test-identity-duplicates.sql`,
`supabase/test-offers.sql` e `supabase/test-niveis-entregas.sql`.

## Verificação por níveis

| Nível | Para quê | O que é preciso |
| --- | --- | --- |
| 1 | Publicar um pedido de envio | Email confirmado, telefone e BI, selfie a segurar o BI, morada e um familiar |
| 2 | Publicar uma viagem, propor ou aceitar levar um pedido | O nível 1, mais passaporte e foto de perfil (o bilhete pede-se em cada viagem) |

A app diz em «Meu perfil» e em cada ação o que falta. A base de dados aplica a mesma regra (política dos pedidos,
`submit_trip` e gatilho das propostas), por isso não se contorna falando com a API diretamente.

## Entregas

Acordo → pagamento retido (a equipa confirma) → recolhido (o viajante tira pelo menos 2 fotos) → em viagem → entregue
(código de 6 dígitos de quem recebe) → libertado (a equipa paga ao viajante). Só estes passos são aceites (gatilho na
base de dados) e cada um fica no histórico da entrega e gera um email às duas partes (se `RESEND_API_KEY` estiver definida).

O código de entrega é criado no servidor quando quem envia carrega em «Gerar o código», aparece uma única vez e só o
hash fica guardado. Vale 30 dias e aceita 5 tentativas erradas (mais um limite por pessoa). Se se perder, gera-se outro
e o anterior deixa de valer.

## Testes

`npm test` corre os testes (Vitest): moedas, alfândega, filtro de contactos, emparelhamento, níveis de verificação,
caminho da entrega, métricas e as ações de servidor de pedidos e viagens (com a base de dados simulada).
Antes de publicar: `npx tsc --noEmit`, `npm run lint` e `npm test` (o GitHub Actions corre os três).

## Estrutura

- `src/proxy.ts` — renova a sessão e manda para `/login` quem não tem email verificado.
- `src/app/(auth)` — login, registo, recuperação. `src/app/auth/callback` — links dos emails.
- `src/app/actions.ts` — pedidos e viagens (validação no servidor, entram como `pendente`).
- `src/lib/matching.ts` — emparelhamento (filtros, pontuação 0–100 e explicação; pesos em `MATCH_WEIGHTS`).
- `src/lib/verification.ts` — níveis de verificação. `src/lib/deal-flow.ts` — caminho da entrega. `src/lib/metrics.ts` — métricas do piloto.
- `src/app/admin` — painel da equipa (só `role = 'admin'`, protegido no servidor e por RLS).
- `supabase/schema.sql` — tabelas, políticas RLS e vistas públicas (sem contactos).
