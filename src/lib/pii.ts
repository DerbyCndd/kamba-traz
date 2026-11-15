import "server-only";
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";

// Cifra dados pessoais sensíveis (número de passaporte) antes de chegarem à base de dados.
// AES-256-GCM: cifra e garante que o texto não foi alterado. Formato: v1:base64(iv 12 | etiqueta 16 | cifrado).
// A chave (PII_KEY, 32 bytes em base64) só existe nas variáveis de ambiente da app. Nunca se regista nem se envia ao browser.

function key(): Buffer | null {
  const raw = process.env.PII_KEY ?? "";
  const buf = Buffer.from(raw, "base64");
  return buf.length === 32 ? buf : null;
}

/** Há chave configurada? Sem ela a app recusa guardar passaportes (falha fechada). */
export const piiReady = () => key() !== null;

export function encryptPii(plain: string): string {
  const k = key();
  if (!k) throw new Error("PII_KEY em falta ou inválida");
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", k, iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return "v1:" + Buffer.concat([iv, c.getAuthTag(), enc]).toString("base64");
}

export function decryptPii(stored: string): string | null {
  const k = key();
  if (!k || !stored.startsWith("v1:")) return null;
  try {
    const raw = Buffer.from(stored.slice(3), "base64");
    const d = createDecipheriv("aes-256-gcm", k, raw.subarray(0, 12));
    d.setAuthTag(raw.subarray(12, 28));
    return Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/**
 * «Impressão» de um número de documento (HMAC-SHA256 com a chave PII_KEY): o mesmo número dá sempre a mesma impressão,
 * o que permite detetar o mesmo BI ou passaporte em contas diferentes sem guardar nem comparar o número em claro.
 * Normaliza (maiúsculas, sem espaços nem hífenes) para que «006 123-45 LA» e «00612345LA» coincidam.
 */
export function idHash(kind: "bi" | "passport", value: string): string | null {
  const k = key();
  if (!k) return null;
  const n = value.replace(/[\s-]/g, "").toUpperCase();
  return createHmac("sha256", k).update("id-hash:" + kind + ":" + n).digest("hex");
}
