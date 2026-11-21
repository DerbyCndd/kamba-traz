import type { MetadataRoute } from "next";

// Só um endereço https conta (em desenvolvimento a variável aponta para localhost, que não serve a ninguém).
const env = process.env.NEXT_PUBLIC_SITE_URL;
const base = (env && env.startsWith("https://") ? env : "https://kamba-traz-app.vercel.app").replace(/\/$/, "");

/** As páginas públicas, para os motores de pesquisa. A área com sessão e o painel da equipa ficam de fora. */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/tutorial", "/regras", "/termos", "/privacidade", "/declaracao", "/fontes", "/feedback", "/login", "/registo"];
  return paths.map((p) => ({ url: base + p, changeFrequency: "monthly", priority: p === "" ? 1 : 0.6 }));
}
