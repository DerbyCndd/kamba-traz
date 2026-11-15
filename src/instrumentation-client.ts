import * as Sentry from "@sentry/nextjs";
import { options } from "@/lib/sentry";

// Erros no navegador (só se NEXT_PUBLIC_SENTRY_DSN estiver definido). Sem gravação de sessões nem dados da pessoa.
if (options.enabled) Sentry.init(options);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
