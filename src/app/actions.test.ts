import { beforeEach, describe, expect, it, vi } from "vitest";
import type { VerifInput } from "@/lib/verification";

/**
 * Testes das ações de servidor de pedidos e viagens, com a base de dados simulada.
 * Confirmam a validação no servidor e os níveis de verificação (nível 1 para pedir, nível 2 para viajar).
 */

// ---- base de dados falsa: cada consulta devolve sem erro; regista inserções e chamadas a funções
type Call = { table?: string; fn?: string; op: string; payload?: unknown };
let calls: Call[] = [];
function query(table: string) {
  const result = { data: [] as unknown, error: null, count: 0 };
  const b: Record<string, unknown> = {};
  for (const m of ["select", "eq", "limit", "in", "gte", "order"]) b[m] = () => b;
  b.maybeSingle = () => Promise.resolve({ data: table === "profiles" ? { photo_path: "p.jpg" } : null, error: null });
  b.single = () => Promise.resolve({ data: { id: "11111111-2222-3333-4444-555555555555" }, error: null });
  b.insert = (payload: unknown) => { calls.push({ table, op: "insert", payload }); return b; };
  b.then = (ok: (v: unknown) => unknown) => Promise.resolve(result).then(ok);
  return b;
}
const supabase = {
  from: (t: string) => query(t),
  rpc: (fn: string, payload: unknown) => { calls.push({ fn, op: "rpc", payload }); return Promise.resolve({ data: "99999999-2222-3333-4444-555555555555", error: null }); },
  storage: { from: () => ({ upload: () => Promise.resolve({ error: null }), remove: () => Promise.resolve({ error: null }) }) },
};

const full: VerifInput = { emailVerified: true, identity: true, selfie: true, safety: true, passport: true, profilePhoto: true };
let verif: VerifInput = full;

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireUser: async () => ({ user: { id: "u1", email_confirmed_at: "2026-01-01" }, supabase }) }));
vi.mock("@/lib/data", () => ({ getNewAccountRule: async () => ({ limit: null, isNew: false }) }));
vi.mock("@/lib/identity", async () => {
  const { verificationLevel } = await import("@/lib/verification");
  return {
    myIdentity: async () => ({ available: true, safety: verif.safety, selfie: verif.selfie, row: { passport_last4: verif.passport ? "1234" : null, bi_expiry: "2099-01-01", passport_expiry: "2099-01-01" } }),
    myVerification: async () => ({ input: verif, level: verificationLevel(verif) }),
    safetyIncomplete: () => false, // testamos o nível diretamente
  };
});

const { submitRequest, submitTrip } = await import("./actions");

const day = (n: number) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const form = (o: Record<string, string | File>) => { const fd = new FormData(); for (const [k, v] of Object.entries(o)) fd.set(k, v); return fd; };

const goodRequest = {
  name: "Ana Silva", contact: "+244 923 000 000", item: "Livros escolares", kg: "3", currency: "EUR", value: "100", offer: "15000.4", ok: "on",
  origin: "LIS", destination: "LAD", category: "Documentos e papelada", handover: "buscar",
  pickup_address: "Rua das Flores 10, Lisboa", recipient_name: "João Silva", recipient_phone: "+244 923 111 222", recipient_address: "Rua 5, Talatona, Luanda",
};
const jpg = () => new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])], "bilhete.jpg", { type: "image/jpeg" });
const goodTrip = () => ({ name: "Mário Costa", contact: "+351 912 000 000", date: day(10), returnDate: day(20), kg: "10", perKg: "8000", ok: "on", origin: "LIS", destination: "LAD", ticket: jpg() });

beforeEach(() => { calls = []; verif = full; });

describe("submitRequest (publicar um pedido)", () => {
  it("valida tudo no servidor", async () => {
    const r = await submitRequest({ errors: {}, values: {} }, form({ name: "", contact: "123", item: "", kg: "0", currency: "", value: "", offer: "", origin: "LIS", destination: "LAD", category: "Documentos e papelada" }));
    expect(Object.keys(r.errors)).toEqual(expect.arrayContaining(["name", "contact", "item", "kg", "value", "offer", "ok"]));
    expect(calls.some((c) => c.op === "insert")).toBe(false);
  });
  it("recusa valor acima do limite da alfândega", async () => {
    const r = await submitRequest({ errors: {}, values: {} }, form({ ...goodRequest, value: "5000" }));
    expect(r.errors.value).toMatch(/limite da alfândega/);
  });
  it("recusa contactos na descrição pública", async () => {
    const r = await submitRequest({ errors: {}, values: {} }, form({ ...goodRequest, item: "Livros, liga 923 456 789" }));
    expect(r.errors.item).toBeTruthy();
  });
  it("sem nível 1 não publica e diz o que falta", async () => {
    verif = { ...full, selfie: false };
    const r = await submitRequest({ errors: {}, values: {} }, form(goodRequest));
    expect(r.formError).toMatch(/nível 1/);
    expect(r.formError).toMatch(/Selfie a segurar o BI/);
    expect(calls.some((c) => c.op === "insert")).toBe(false);
  });
  it("quem envia não precisa de passaporte (nível 1 chega)", async () => {
    verif = { ...full, passport: false, profilePhoto: false };
    const r = await submitRequest({ errors: {}, values: {} }, form(goodRequest));
    expect(r.formError).toBeUndefined();
    expect(r.done?.kind).toBe("request");
  });
  it("com tudo certo grava o pedido do próprio utilizador e devolve a referência", async () => {
    const r = await submitRequest({ errors: {}, values: {} }, form(goodRequest));
    expect(r.done?.ref).toMatch(/^KT-/);
    const ins = calls.find((c) => c.table === "requests" && c.op === "insert")?.payload as Record<string, unknown>;
    expect(ins).toMatchObject({ user_id: "u1", origin: "LIS", destination: "LAD", kg: 3, offer: 15000, item_value: 100 });
  });
});

describe("submitTrip (publicar uma viagem)", () => {
  it("exige a foto do bilhete e confirma que é mesmo uma imagem", async () => {
    const sem = await submitTrip({ errors: {}, values: {} }, form({ ...goodTrip(), ticket: new File([], "x.jpg") }));
    expect(sem.errors.ticket).toMatch(/bilhete/);
    const falsa = await submitTrip({ errors: {}, values: {} }, form({ ...goodTrip(), ticket: new File(["não é imagem"], "x.jpg", { type: "image/jpeg" }) }));
    expect(falsa.errors.ticket).toMatch(/JPG, PNG ou WebP/);
  });
  it("recusa datas impossíveis", async () => {
    const r = await submitTrip({ errors: {}, values: {} }, form({ ...goodTrip(), date: day(-1), returnDate: day(-5) }));
    expect(r.errors.date).toBeTruthy();
  });
  it("sem nível 2 não publica e diz o que falta", async () => {
    verif = { ...full, passport: false };
    const r = await submitTrip({ errors: {}, values: {} }, form(goodTrip()));
    expect(r.formError).toMatch(/nível 2/);
    expect(r.formError).toMatch(/Passaporte/);
    expect(calls.some((c) => c.fn === "submit_trip")).toBe(false);
  });
  it("com o nível 2 grava a viagem pela função da base de dados", async () => {
    const r = await submitTrip({ errors: {}, values: {} }, form(goodTrip()));
    expect(r.done?.kind).toBe("trip");
    const rpc = calls.find((c) => c.fn === "submit_trip")?.payload as Record<string, unknown>;
    expect(rpc).toMatchObject({ p_origin: "LIS", p_destination: "LAD", p_kg: 10, p_per_kg: 8000 });
    expect(String(rpc.p_ticket_path)).toMatch(/^u1\/.+\.jpg$/);
  });
});
