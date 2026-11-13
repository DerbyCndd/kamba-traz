import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, Geist_Mono, Public_Sans } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { Header } from "@/components/Header";
import { Logo } from "@/components/Logo";
import { getProfile } from "@/lib/auth";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });
const body = Public_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });
const mono = Geist_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Kamba Traz", template: "%s · Kamba Traz" },
  applicationName: "Kamba Traz",
  description: "Liga quem precisa de enviar encomendas para Angola a quem já tem a viagem marcada. A equipa analisa cada entrada antes de a publicar.",
};
export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: [{ media: "(prefers-color-scheme: light)", color: "#F6F7FB" }, { media: "(prefers-color-scheme: dark)", color: "#0B0F1A" }],
};

const THEME_SCRIPT = `try{var t=localStorage.getItem("kt-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  return (
    <html lang="pt-PT" data-scroll-behavior="smooth" suppressHydrationWarning className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <head>
        {/* aplica o tema escolhido antes de a página aparecer, para não piscar */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={profile ? "in" : undefined}>
        <a className="skip" href="#main">Saltar para o conteúdo</a>
        {profile ? (
          <AppShell profile={profile}>{children}</AppShell>
        ) : (
          <div className="wrap">
            <Header />
            <main id="main" tabIndex={-1}>{children}</main>
            <footer className="foot">
              <div className="footgrid">
                <div className="footbrand">
                  <span className="brand"><Logo /></span>
                  <p className="tagline">O amigo que leva a tua encomenda.</p>
                  <p className="origin">Kamba quer dizer «amigo» em kimbundu.</p>
                </div>
                <div><h4>Produto</h4><Link href="/#como-funciona">Como funciona</Link><Link href="/#seguranca">Segurança</Link><Link href="/#duvidas">Dúvidas</Link></div>
                <div><h4>Conta</h4><Link href="/login">Entrar</Link><Link href="/registo">Criar conta</Link></div>
                <div><h4>Ajuda</h4><Link href="/regras">O que nunca levamos</Link><Link href="/feedback">Deixe o seu feedback</Link></div>
              </div>
              <p className="legal">© {new Date().getFullYear()} Kamba Traz</p>
            </footer>
          </div>
        )}
      </body>
    </html>
  );
}
