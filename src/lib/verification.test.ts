import { describe, expect, it } from "vitest";
import { ACTION_LEVEL, missingFor, needsText, verificationLevel, type VerifInput } from "./verification";

const full: VerifInput = { emailVerified: true, identity: true, selfie: true, safety: true, passport: true, profilePhoto: true };
const keys = (i: VerifInput, a: keyof typeof ACTION_LEVEL) => missingFor(a, i).map((n) => n.key);

describe("níveis de verificação", () => {
  it("tudo feito é nível 2", () => expect(verificationLevel(full)).toBe(2));
  it("sem passaporte ou sem foto é nível 1", () => {
    expect(verificationLevel({ ...full, passport: false })).toBe(1);
    expect(verificationLevel({ ...full, profilePhoto: false })).toBe(1);
  });
  it("sem selfie, morada, identificação ou email é nível 0", () => {
    for (const k of ["selfie", "safety"] as const) expect(verificationLevel({ ...full, [k]: false })).toBe(0);
    expect(verificationLevel({ ...full, identity: false })).toBe(0);
    expect(verificationLevel({ ...full, emailVerified: false })).toBe(0);
  });
  it("null (SQL ainda não corrido) não se exige", () => {
    expect(verificationLevel({ ...full, selfie: null, safety: null, profilePhoto: null })).toBe(2);
  });
});

describe("nível exigido por ação", () => {
  it("publicar um pedido pede o nível 1, publicar uma viagem e aceitar um pedido pedem o nível 2", () => {
    expect(ACTION_LEVEL).toEqual({ publicar_pedido: 1, publicar_viagem: 2, aceitar_pedido: 2 });
  });
  it("quem envia não precisa de passaporte nem de foto", () => {
    expect(keys({ ...full, passport: false, profilePhoto: false }, "publicar_pedido")).toEqual([]);
  });
  it("quem viaja precisa, e vê exatamente o que falta", () => {
    expect(keys({ ...full, passport: false, profilePhoto: false }, "publicar_viagem")).toEqual(["passport", "photo"]);
    expect(keys({ ...full, profilePhoto: false }, "aceitar_pedido")).toEqual(["photo"]);
  });
  it("lista o que falta pela ordem em que se faz", () => {
    const nada: VerifInput = { emailVerified: false, identity: false, selfie: false, safety: false, passport: false, profilePhoto: false };
    expect(keys(nada, "publicar_viagem")).toEqual(["email", "identity", "selfie", "safety", "passport", "photo"]);
  });
  it("cada falta aponta para a página onde se resolve, e o texto junta-as", () => {
    const f = missingFor("publicar_viagem", { ...full, selfie: false, passport: false });
    expect(f.map((n) => n.href)).toEqual(["/identificacao/contactos", "/identificacao?next=/viajar&passaporte=1"]);
    expect(needsText(f)).toBe("Selfie a segurar o BI; Passaporte (número, validade e fotos)");
  });
});
