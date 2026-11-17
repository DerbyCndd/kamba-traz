/**
 * Segurança e retenção: os contactos trocam-se dentro da app, depois de o pagamento ficar retido.
 * Por isso o texto que todos veem (descrição do item, voo) não pode levar contactos.
 */
export const NO_CONTACTS_MSG = "Não escrevas telefone, email, ligações nem WhatsApp aqui: o texto fica visível a todos. Os contactos trocam-se na app, depois de o pagamento ficar retido.";

/** Há contactos (telefone, email, ligação, rede social) escondidos num texto livre? */
export function hasContactInfo(text: string): boolean {
  const t = text.toLowerCase();
  if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(t)) return true; // email
  if (/(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|pt|ao|net|org|me|io|br)\b)/.test(t)) return true; // ligações
  if (/\b(whats\s*app|wpp|zap|telegram|instagram|insta|facebook|messenger)\b|(^|\s)@\w{3,}/.test(t)) return true; // redes e arrobas
  return /(\d[\s.\-()]*){9,}/.test(t); // 9 ou mais algarismos seguidos (com espaços ou hífenes pelo meio)
}

export type FamilyRel = "mae" | "pai" | "conjuge";
export type FamilyContact = { rel: FamilyRel; name: string; phone: string };
export const REL_LABEL: Record<FamilyRel, string> = { mae: "Mãe", pai: "Pai", conjuge: "Cônjuge" };
export const CIVIL: [string, string][] = [["solteiro", "Solteiro(a)"], ["casado", "Casado(a) ou em união de facto"], ["outro", "Divorciado(a), viúvo(a) ou outro"]];
