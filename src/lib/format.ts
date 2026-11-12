import { CITY } from "./constants";

const nf = new Intl.NumberFormat("pt-PT", { useGrouping: "always" });
export const kz = (n: unknown) => nf.format(Math.round(Number(n) || 0)) + " Kz"; // espaço sem quebra: o valor não se parte entre linhas
export const cityName = (c: string) => CITY[c] || c;
export const firstName = (n: string) => String(n || "").trim().split(/\s+/)[0] || "—";
export const digits = (s: string) => String(s || "").replace(/\D/g, "");
export const refCode = (id: string) => id.replace(/-/g, "").slice(-5).toUpperCase();
export const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) + "%" : "–");

/** Data de hoje em Luanda (AAAA-MM-DD), igual no servidor e no browser. */
export function today() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Luanda" });
}

export function fdate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00Z");
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("pt-PT", { day: "numeric", month: "short", timeZone: "UTC" });
}

export function waLink(num: string, text?: string) {
  const d = digits(num);
  return d ? "https://wa.me/" + d + (text ? "?text=" + encodeURIComponent(text) : "") : null;
}

/** Iniciais para o avatar: primeira e última palavra do nome, ou o início do email. */
export const initials = (name: string, email = "") => {
  const parts = name.trim().split(/s+/).filter(Boolean);
  const s = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? email).slice(0, 2);
  return s.toUpperCase();
};
