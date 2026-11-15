import type { MetadataRoute } from "next";

/** Os motores de pesquisa podem ver a parte pública; a área com sessão e o painel da equipa ficam de fora. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/identificacao", "/perfil", "/carteira", "/entregas", "/meus", "/quadro", "/pedir", "/viajar", "/nova-palavra-passe", "/auth/", "/api/"],
    },
  };
}
