import { describe, expect, it } from "vitest";
import { hasContactInfo, isTrusted } from "./safety";

describe("filtro de contactos em texto público", () => {
  it("deixa passar descrições normais, mesmo com números", () => {
    for (const t of [
      "Telemóvel Samsung Galaxy A15 128GB novo na caixa",
      "iPhone 15 Pro Max 256GB 2024",
      "3 camisas, 2 calças e 5 pares de meias",
      "Perfume Dior 100ml e creme 50ml",
      "Portátil Dell Inspiron 15 3520 i5 16GB 512GB",
      "Peças de carro: filtro 1234567 e pastilhas",
    ]) expect(hasContactInfo(t), t).toBe(false);
  });
  it("apanha telefones, emails, ligações e redes sociais", () => {
    for (const t of ["liga para 923 456 789", "+244 923-456-789", "923456789", "fala no whatsapp", "joao@gmail.com", "vê em www.loja.com", "https://wa.me/244923456789", "instagram @joao_loja", "telegram"]) {
      expect(hasContactInfo(t), t).toBe(true);
    }
  });
});

describe("selo «Conta de confiança»", () => {
  const base = { avg_stars: 4.8, total: 5, deals_done: 4, id_confirmed: true };
  it("dá o selo a quem cumpre tudo", () => expect(isTrusted(base)).toBe(true));
  it("não dá sem identificação confirmada", () => expect(isTrusted({ ...base, id_confirmed: false })).toBe(false));
  it("não dá com poucas entregas ou poucas avaliações", () => {
    expect(isTrusted({ ...base, deals_done: 2 })).toBe(false);
    expect(isTrusted({ ...base, total: 2 })).toBe(false);
  });
  it("não dá com média baixa ou sem média", () => {
    expect(isTrusted({ ...base, avg_stars: 4.4 })).toBe(false);
    expect(isTrusted({ ...base, avg_stars: null })).toBe(false);
  });
});
