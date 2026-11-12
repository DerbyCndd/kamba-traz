import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, Geist_Mono, Kalam, Public_Sans } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { Header } from "@/components/Header";
import { Logo } from "@/components/Logo";
import { getProfile } from "@/lib/auth";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });
const body = Public_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });
const hand = Kalam({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-hand" });
const mono = Geist_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Kamba Traz", template: "%s · Kamba Traz" },
  applicationName: "Kamba Traz",
  description: "Liga quem precisa de enviar encomendas para Angola a quem já tem a viagem marcada. A equipa analisa cada entrada antes de a publicar.",
};
export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0E1636",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  return (
    <html lang="pt-PT" className={`${display.variable} ${body.variable} ${mono.variable} ${hand.variable}`}>
      <body className={profile ? "in" : undefined}>
        <a className="skip" href="#main">Saltar para o conteúdo</a>
        {profile ? (
          <AppShell profile={profile}>{children}</AppShell>
        ) : (
          <div className="wrap">
            <Header />
            <main id="main" tabIndex={-1}>{children}</main>
            <footer className="foot">
              <span className="brand small"><Logo small /></span>
              <span className="hint">Envios de e para Angola. Cada entrada é analisada pela equipa.</span>
              <Link href="/regras">Regras de segurança</Link>
            </footer>
          </div>
        )}
      </body>
    </html>
  );
}
