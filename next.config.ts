import type { NextConfig } from "next";

const dev = process.env.NODE_ENV !== "production";

// A base de dados (Supabase) e os mapas (OpenStreetMap) são os únicos sítios externos com que o navegador fala.
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;
const supaHttp = supabase ? supabase.origin : "https://*.supabase.co";
const supaWs = supabase ? "wss://" + supabase.host : "wss://*.supabase.co";

// Política de conteúdo: só carrega e liga a quem conhece. Scripts e estilos em linha são precisos para o Next.js (hidratação) e para o tema.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supaHttp} https://tile.openstreetmap.org`,
  "font-src 'self' data:",
  `connect-src 'self' ${supaHttp} ${supaWs}${dev ? " ws://localhost:*" : ""}`,
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(dev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

// Toda a app depende da sessão de cada utilizador, por isso as páginas são dinâmicas
// (sem Cache Components, que obrigaria a envolver cada leitura de cookies em Suspense).
const nextConfig: NextConfig = {
  poweredByHeader: false,
  // As fotos seguem no pedido do formulário (a app reduz-as antes; 3 a 4 MB de limite cada, até 4 numa identificação).
  experimental: { serverActions: { bodySizeLimit: "10mb" } },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        { key: "Content-Security-Policy", value: csp },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        // A localização do entregador precisa de geolocation; só o próprio site a pode usar (nunca terceiros).
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
      ],
    }];
  },
};

export default nextConfig;
