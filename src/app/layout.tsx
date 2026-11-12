import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Familjen_Grotesk, IBM_Plex_Mono, Public_Sans } from "next/font/google";
import { Header } from "@/components/Header";
import "./globals.css";

const display = Familjen_Grotesk({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display" });
const body = Public_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: { default: "Kamba Traz", template: "%s · Kamba Traz" },
  description: "Liga quem precisa de enviar encomendas para Angola a quem já tem a viagem marcada. A equipa analisa cada entrada antes de a publicar.",
};
export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#EBEFF2" }, { media: "(prefers-color-scheme: dark)", color: "#0B1117" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <a className="skip" href="#main">Saltar para o conteúdo</a>
        <div className="wrap">
          <Header />
          <main id="main" tabIndex={-1}>{children}</main>
          <footer className="foot">
            <span className="brand small"><span className="tag" aria-hidden="true" />Kamba Traz</span>
            <span className="hint">Envios de e para Angola. Cada entrada é analisada pela equipa.</span>
            <Link href="/regras">Regras de segurança</Link>
          </footer>
        </div>
      </body>
    </html>
  );
}
