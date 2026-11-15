import * as Sentry from "@sentry/nextjs";
import { options } from "@/lib/sentry";

/** Liga o Sentry no servidor (só se NEXT_PUBLIC_SENTRY_DSN estiver definido). */
export function register() {
  if (options.enabled) Sentry.init(options);
}

/** O Next.js chama isto sempre que um pedido falha no servidor. */
export const onRequestError = Sentry.captureRequestError;
