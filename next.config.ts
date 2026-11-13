import type { NextConfig } from "next";

// Toda a app depende da sessão de cada utilizador, por isso as páginas são dinâmicas
// (sem Cache Components, que obrigaria a envolver cada leitura de cookies em Suspense).
const nextConfig: NextConfig = {
  poweredByHeader: false,
  // A foto do bilhete segue no pedido do formulário (a app reduz-na antes; 4 MB de limite + margem do multipart).
  experimental: { serverActions: { bodySizeLimit: "10mb" } },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        // Subconjunto seguro de CSP: bloqueia incorporação noutros sites, plugins e formulários para fora.
        { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    }];
  },
};

export default nextConfig;
