import type { ErrorEvent } from "@sentry/nextjs";

/**
 * Configuração comum do Sentry (erros do servidor e do navegador). Só liga se existir NEXT_PUBLIC_SENTRY_DSN.
 * Privacidade: a app guarda documentos de identificação, por isso nunca se enviam dados do pedido, cookies,
 * cabeçalhos, IP nem utilizador. Só o tipo de erro, o texto do erro e o sítio do código onde aconteceu.
 */
export const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || undefined;

/** Erros que o Next.js usa para navegar (redirecionar, página não encontrada): não são falhas. */
const IGNORE = [/NEXT_REDIRECT/, /NEXT_NOT_FOUND/, /NEXT_HTTP_ERROR_FALLBACK/];

export function scrub(event: ErrorEvent): ErrorEvent | null {
  const msg = event.exception?.values?.map((v) => `${v.type ?? ""} ${v.value ?? ""}`).join(" ") ?? event.message ?? "";
  if (IGNORE.some((r) => r.test(msg))) return null;
  delete event.request; // corpo, cookies, cabeçalhos e endereço
  delete event.user;
  delete event.contexts?.device;
  const nx = event.contexts?.nextjs as { request_path?: string } | undefined;
  if (nx?.request_path) nx.request_path = nx.request_path.split("?")[0]; // sem o que vem depois do «?» (pode ter dados)
  event.breadcrumbs = []; // podem conter ligações visitadas com identificadores
  return event;
}

export const options = {
  dsn,
  enabled: !!dsn,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  sendDefaultPii: false,
  tracesSampleRate: 0, // só erros: sem desempenho, sem gravação de sessões
  beforeSend: scrub,
  beforeBreadcrumb: () => null, // nenhum rasto de cliques, ligações ou pedidos
};
