/** Regras sobre as datas dos documentos. Puras (sem base de dados), por isso servem no servidor e no painel da equipa. */

const day = (iso: string) => new Date(iso + "T12:00:00Z").getTime();
/** Soma dias a uma data AAAA-MM-DD. */
export const addDays = (iso: string, n: number) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const daysBetween = (from: string, to: string) => Math.round((day(to) - day(from)) / 86_400_000);

/** Muitas companhias exigem passaporte válido pelo menos 6 meses depois do regresso. */
export const PASSPORT_MARGIN_DAYS = 183;

/** Validação de uma data de validade escolhida por quem se identifica. Devolve a mensagem de erro, ou null se estiver bem. */
export function expiryError(expiry: string, today: string, what: "BI" | "passaporte"): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry) || Number.isNaN(day(expiry))) return `Indica a data de validade do ${what}.`;
  if (expiry <= today) return `O ${what} está fora de validade. Renova-o antes de continuar.`;
  if (daysBetween(today, expiry) > 365 * (what === "BI" ? 20 : 15)) return `Confirma a data de validade do ${what}.`;
  return null;
}

/** Problema entre o passaporte e a viagem (devolve a mensagem, ou null). */
export function passportVsTrip(passportExpiry: string | null | undefined, returnDate: string): string | null {
  if (!passportExpiry) return null;
  if (passportExpiry < addDays(returnDate, PASSPORT_MARGIN_DAYS)) {
    return "O teu passaporte caduca antes de 6 meses depois do regresso, e muitas companhias não aceitam isso. Atualiza o passaporte em Meu perfil ou escolhe outras datas.";
  }
  return null;
}

/** Alertas para a equipa olhar primeiro. Lista vazia = nada de especial. */
export function identityAlerts(o: { biExpiry?: string | null; passportExpiry?: string | null; tripReturn?: string | null; today: string; accountName?: string; fullName?: string }): string[] {
  const out: string[] = [];
  const near = (iso: string) => daysBetween(o.today, iso) <= PASSPORT_MARGIN_DAYS;
  if (o.biExpiry) {
    if (o.biExpiry <= o.today) out.push("BI fora de validade.");
    else if (near(o.biExpiry)) out.push("BI caduca em menos de 6 meses.");
  }
  if (o.passportExpiry) {
    if (o.passportExpiry <= o.today) out.push("Passaporte fora de validade.");
    else if (o.tripReturn && passportVsTrip(o.passportExpiry, o.tripReturn)) out.push("Passaporte caduca antes de 6 meses depois do regresso.");
    else if (near(o.passportExpiry)) out.push("Passaporte caduca em menos de 6 meses.");
  }
  const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().split(/\s+/)[0] ?? "";
  if (o.accountName && o.fullName && norm(o.accountName) !== norm(o.fullName)) out.push("O primeiro nome da conta não coincide com o do BI.");
  return out;
}
