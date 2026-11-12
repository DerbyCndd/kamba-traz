import type { MetadataRoute } from "next";

// Permite instalar a Kamba Traz no ecrã inicial do telemóvel, com o ícone e as cores da marca.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kamba Traz",
    short_name: "Kamba Traz",
    description: "Liga quem precisa de enviar encomendas para Angola a quem já tem a viagem marcada.",
    lang: "pt-PT",
    start_url: "/",
    display: "standalone",
    background_color: "#0A1020",
    theme_color: "#0E1636",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
