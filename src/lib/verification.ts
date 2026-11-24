/**
 * Verificação por níveis. O nível exigido depende da ação:
 *  - Nível 1 (publicar um pedido de envio): email confirmado, identificação (telefone e BI), selfie a segurar o BI,
 *    morada e contacto de um familiar. É o rigor que já existia para toda a gente (decisão do dono).
 *  - Nível 2 (publicar uma viagem, ou aceitar levar um pedido): o nível 1, mais passaporte e foto de perfil.
 *    O bilhete de avião continua a ser pedido em cada viagem.
 * Um valor null quer dizer que a base de dados ainda não tem essa coluna (o SQL não foi corrido): não se exige.
 */
export type VerifInput = {
  emailVerified: boolean;
  /** Tem a identificação (telefone e BI). */
  identity: boolean;
  selfie: boolean | null;
  /** Morada e familiares. */
  safety: boolean | null;
  passport: boolean;
  profilePhoto: boolean | null;
};
export type Level = 0 | 1 | 2;
export type Need = { key: string; label: string; href: string };

export const ACTION_LEVEL = { publicar_pedido: 1, publicar_viagem: 2, aceitar_pedido: 2 } as const;
export type VerifAction = keyof typeof ACTION_LEVEL;

/** O que falta para chegar a um nível, pela ordem em que se faz, com a página onde se resolve. */
export function missingForLevel(i: VerifInput, level: 1 | 2): Need[] {
  const out: Need[] = [];
  if (!i.emailVerified) out.push({ key: "email", label: "Confirmar o email", href: "/registo/verificar" });
  if (!i.identity) out.push({ key: "identity", label: "Identificação (telefone e BI)", href: "/identificacao" });
  if (i.selfie === false) out.push({ key: "selfie", label: "Selfie a segurar o BI", href: "/identificacao/contactos" });
  if (i.safety === false) out.push({ key: "safety", label: "Morada e contacto de um familiar", href: "/identificacao/contactos" });
  if (level >= 2) {
    if (!i.passport) out.push({ key: "passport", label: "Passaporte (número, validade e fotos)", href: "/identificacao?next=/viajar&passaporte=1" });
    if (i.profilePhoto === false) out.push({ key: "photo", label: "Foto de perfil", href: "/perfil" });
  }
  return out;
}

export function verificationLevel(i: VerifInput): Level {
  if (missingForLevel(i, 1).length) return 0;
  return missingForLevel(i, 2).length ? 1 : 2;
}

/** O que falta para uma ação concreta (vazio = pode avançar). */
export const missingFor = (action: VerifAction, i: VerifInput): Need[] => missingForLevel(i, ACTION_LEVEL[action]);

/** «Selfie a segurar o BI; Foto de perfil». */
export const needsText = (needs: Need[]) => needs.map((n) => n.label).join("; ");
