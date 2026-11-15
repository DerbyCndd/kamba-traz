"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { myIdentity } from "@/lib/identity";
import { getNewAccountRule } from "@/lib/data";
import { customsEstimate, needsInvoice } from "@/lib/customs";
import { passportVsTrip } from "@/lib/docchecks";
import { CURRENCIES, isCur, toEur } from "@/lib/currency";
import { CATS, FROM, TO } from "@/lib/constants";
import { cityName, kz, refCode, today } from "@/lib/format";
import type { FormState, RateState } from "@/lib/types";

/** Avalia a outra parte de uma entrega concluída. Toda a validação decisiva corre na base de dados (rate_deal). */
export async function rateDeal(_: RateState, fd: FormData): Promise<RateState> {
  const { supabase } = await requireUser();
  const deal = String(fd.get("deal") ?? "");
  const stars = parseInt(String(fd.get("stars") ?? ""), 10);
  const comment = String(fd.get("comment") ?? "").trim().slice(0, 280);
  if (!/^[0-9a-f-]{36}$/i.test(deal)) return { error: "Entrega inválida." };
  if (!(stars >= 1 && stars <= 5)) return { error: "Escolhe de 1 a 5 estrelas." };

  const { error } = await supabase.rpc("rate_deal", { p_deal: deal, p_stars: stars, p_comment: comment });
  if (error) {
    // Mensagens escritas por nós na função SQL são seguras de mostrar; o resto fica genérico.
    const mine = ["P0001", "42501", "22023", "23505"].includes(error.code ?? "");
    return { error: mine ? error.message : "Não foi possível guardar a avaliação agora. Tenta de novo daqui a pouco." };
  }
  revalidatePath("/", "layout");
  return { done: true };
}

const MAX_PENDING = 10; // limite de entradas por verificar por pessoa (evita spam)

function read(fd: FormData) {
  const v: Record<string, string> = {};
  fd.forEach((x, k) => { if (typeof x === "string") v[k] = x.trim(); });
  return v;
}
const num = (s: string) => { const n = parseFloat(s); return Number.isFinite(n) && n > 0 ? n : null; };
const phoneOk = (s: string) => s.replace(/\D/g, "").length >= 9 && s.length <= 30;

async function tooManyPending(supabase: Awaited<ReturnType<typeof requireUser>>["supabase"], userId: string) {
  const [a, b] = await Promise.all([
    supabase.from("trips").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "pendente"),
    supabase.from("requests").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "pendente"),
  ]);
  return (a.count ?? 0) + (b.count ?? 0) >= MAX_PENDING;
}

const MAX_INVOICE = 3 * 1024 * 1024;
const INVOICE_MIME = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", pdf: "application/pdf" } as const;
function invoiceKind(b: Uint8Array): keyof typeof INVOICE_MIME | null {
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return "pdf";
  return imageKind(b);
}

export async function submitRequest(_: FormState, fd: FormData): Promise<FormState> {
  const { user, supabase } = await requireUser();
  const v = read(fd);
  const errors: Record<string, string> = {};

  if (v.name.length < 2 || v.name.length > 60) errors.name = "Escreve o teu nome.";
  if (!phoneOk(v.contact)) errors.contact = "Indica um número com indicativo, por exemplo +244 923 000 000.";
  if (v.item.length < 3 || v.item.length > 90) errors.item = "Descreve o que queres enviar.";
  if (!num(v.kg) || num(v.kg)! > 100) errors.kg = "Indica o peso aproximado em kg.";
  // O valor escreve-se na moeda do país de origem; por dentro tudo é em euros (alfândega, fatura, teto, limite das contas novas).
  const currency = isCur(v.currency) ? v.currency : null;
  const valueEur = currency ? toEur(Number(v.value) || 0, currency) : 0;
  if (!currency) errors.value = "Escolhe a moeda do item.";
  else if (v.value === "" || !(Number(v.value) >= 0)) errors.value = "Indica o valor do item.";
  else if (customsEstimate(valueEur).kind === "geral") errors.value = `O valor passa o limite da alfândega para uma encomenda de viajante (Kz 1 500 000, cerca de ${valueEur} € ao nosso câmbio de referência). Divide em envios mais pequenos.`;
  if (!num(v.offer)) errors.offer = "Indica quanto ofereces pelo transporte, em Kz.";
  if (v.ok !== "on") errors.ok = "Tens de confirmar para continuar.";
  if (!FROM.includes(v.origin) || !TO.includes(v.destination) || !CATS.includes(v.category)) errors.item = "Escolhe valores válidos da lista.";
  else if (v.origin === v.destination && v.origin !== "OTH") errors.item = "A origem e o destino não podem ser iguais.";
  if (v.deadline && v.deadline < today()) errors.deadline = "A data já passou.";
  // Bens de risco levam a fatura da compra (só se a base já guarda faturas: invoices.sql).
  const currencyOn = (await supabase.from("requests").select("item_currency").limit(1)).error === null; // moeda.sql corrido?
  const invoicesOn = (await supabase.from("requests").select("invoice_path").limit(1)).error === null;
  const mustInvoice = invoicesOn && needsInvoice(v.category, valueEur);
  const invFile = fd.get("invoice");
  let invBytes: Uint8Array | null = null;
  let invKind: keyof typeof INVOICE_MIME | null = null;
  if (mustInvoice) {
    if (!(invFile instanceof File) || invFile.size === 0) errors.invoice = "Junta a fatura da compra: é obrigatória para eletrónicos, cosméticos e peças, ou itens de valor elevado.";
    else if (invFile.size > MAX_INVOICE) errors.invoice = "O ficheiro é demasiado grande (máximo 3 MB).";
    else { invBytes = new Uint8Array(await invFile.arrayBuffer()); invKind = invoiceKind(invBytes); if (!invKind) errors.invoice = "Usa uma foto (JPG, PNG, WebP) ou um PDF."; }
  }
  // Conta nova: acima do limite só com «urgente» e uma justificação, que a equipa lê antes de decidir.
  const rule = await getNewAccountRule();
  const overLimit = rule.limit != null && rule.isNew && valueEur > rule.limit;
  const urgent = overLimit && v.urgent === "on";
  const reason = (v.urgent_reason ?? "").slice(0, 400);
  if (overLimit && (!urgent || reason.length < 20)) {
    errors.urgent_reason = `Conta nova: o valor passa o limite de ${rule.limit} €. Marca o pedido como urgente e explica porquê, em pelo menos 20 caracteres.`;
  }
  if (Object.keys(errors).length) return { errors, values: v };

  const ident = await myIdentity(supabase, user.id);
  if (ident.available && !ident.row) return { errors: {}, values: v, formError: "Completa primeiro a tua identificação (BI e telefone) em Meu perfil." };
  if (await tooManyPending(supabase, user.id)) {
    return { errors: {}, values: v, formError: "Já tens muitas entradas por verificar. Espera que a equipa as analise." };
  }

  let invoicePath: string | null = null;
  if (mustInvoice && invBytes && invKind) {
    const path = `${user.id}/${crypto.randomUUID()}.${invKind}`;
    const up = await supabase.storage.from("invoices").upload(path, invBytes, { contentType: INVOICE_MIME[invKind], upsert: false });
    if (up.error) return { errors: {}, values: v, formError: "Não foi possível enviar a fatura agora. Tenta de novo daqui a pouco." };
    invoicePath = path;
  }

  const row = {
    ...(invoicePath ? { invoice_path: invoicePath } : {}),
    ...(rule.limit != null ? { urgent, urgent_reason: urgent ? reason : null } : {}),
    ...(currencyOn && currency ? { item_currency: currency, item_amount: Number(v.value) } : {}),
    user_id: user.id, name: v.name, contact: v.contact, origin: v.origin, destination: v.destination,
    item: v.item, category: v.category, kg: num(v.kg)!, item_value: valueEur, offer: Math.round(num(v.offer)!),
    deadline: v.deadline || null,
  };
  const { data, error } = await supabase.from("requests").insert(row).select("id").single();
  if ((error || !data) && invoicePath) await supabase.storage.from("invoices").remove([invoicePath]); // não deixa a fatura órfã
  if (error || !data) return { errors: {}, values: v, formError: "Não foi possível registar o pedido agora. Tenta de novo daqui a pouco." };

  revalidatePath("/meus");
  const summary = [
    "PEDIDO · Kamba Traz", "Nome: " + row.name, "Contacto: " + row.contact,
    `Rota: ${cityName(row.origin)} → ${cityName(row.destination)}`, `Item: ${row.item} (${row.category})`,
    `Peso: ${row.kg} kg`, `Valor do item: ${row.item_value} €` + (currency && currency !== "EUR" ? ` (${v.value} ${CURRENCIES[currency].symbol} na moeda do país, convertido ao câmbio de referência)` : ""), "Oferta pelo transporte: " + kz(row.offer),
    row.deadline ? "Preciso até: " + row.deadline : null,
  ].filter(Boolean).join("\n");
  return { errors: {}, values: {}, done: { ref: "KT-" + refCode(data.id), summary, kind: "request" } };
}

const MAX_TICKET = 4 * 1024 * 1024;
const MIME = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;

/** Confirma pelo conteúdo (não pelo nome nem pelo tipo declarado) que o ficheiro é mesmo uma imagem aceite. */
function imageKind(b: Uint8Array): keyof typeof MIME | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "webp";
  return null;
}
const addDays = (iso: string, n: number) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

export async function submitTrip(_: FormState, fd: FormData): Promise<FormState> {
  const { user, supabase } = await requireUser();
  const v = read(fd);
  const safe = (x: Record<string, string>) => x;
  const errors: Record<string, string> = {};


  if (v.name.length < 2 || v.name.length > 60) errors.name = "Escreve o teu nome.";
  if (!phoneOk(v.contact)) errors.contact = "Indica um número com indicativo, por exemplo +351 912 000 000.";
  if (!v.date || v.date < today()) errors.date = "Escolhe a data de ida.";
  if (!v.returnDate) errors.returnDate = "Indica a data de regresso, como está no bilhete.";
  else if (v.date && v.returnDate < v.date) errors.returnDate = "O regresso tem de ser igual ou depois da ida.";
  else if (v.date && v.returnDate > addDays(v.date, 400)) errors.returnDate = "Confirma a data de regresso.";
  if (v.date && v.date > addDays(today(), 365)) errors.date = "Só aceitamos viagens até um ano à frente.";
  if (!num(v.kg) || num(v.kg)! > 100) errors.kg = "Indica quantos kg tens livres.";
  if (!num(v.perKg)) errors.perKg = "Indica o preço por kg em Kz.";
  if (v.flight && v.flight.length > 30) errors.flight = "Demasiado longo.";
  if (v.ok !== "on") errors.ok = "Tens de confirmar para continuar.";
  if (!FROM.includes(v.origin) || !TO.includes(v.destination)) errors.date = "Escolhe valores válidos da lista.";
  else if (v.origin === v.destination && v.origin !== "OTH") errors.date = "A origem e o destino não podem ser iguais.";

  // A foto do bilhete: tamanho e conteúdo verificados aqui, no servidor.
  const file = fd.get("ticket");
  let bytes: Uint8Array | null = null;
  let kind: keyof typeof MIME | null = null;
  if (!(file instanceof File) || file.size === 0) errors.ticket = "Junta a foto do bilhete de avião (com o teu nome e as datas).";
  else if (file.size > MAX_TICKET) errors.ticket = "A foto é demasiado grande (máximo 4 MB).";
  else {
    bytes = new Uint8Array(await file.arrayBuffer());
    kind = imageKind(bytes);
    if (!kind) errors.ticket = "Usa uma foto em JPG, PNG ou WebP.";
  }
  if (Object.keys(errors).length) return { errors, values: safe(v) };

  if (await tooManyPending(supabase, user.id)) {
    return { errors: {}, values: safe(v), formError: "Já tens muitas entradas por verificar. Espera que a equipa as analise." };
  }
  const ident = await myIdentity(supabase, user.id);
  if (!ident.available || !ident.row) return { errors: {}, values: safe(v), formError: "Completa primeiro a tua identificação (BI e telefone) em Meu perfil." };
  // Quem viaja tem de ter o passaporte registado (número e fotos): a equipa confere-o com o bilhete. Para só enviar, não é preciso.
  if (!ident.row.passport_last4) return { errors: {}, values: safe(v), formError: "Para viajar, tens de ter o passaporte registado (número e fotos). Abre «Vou viajar» outra vez e regista-o primeiro." };
  if (ident.row.bi_expiry && ident.row.bi_expiry <= today()) return { errors: {}, values: safe(v), formError: "O teu BI está fora de validade. Atualiza a identificação em Meu perfil." };
  if (ident.row.passport_expiry && ident.row.passport_expiry <= today()) return { errors: {}, values: safe(v), formError: "O teu passaporte está fora de validade. Atualiza a identificação em Meu perfil." };
  const pp = passportVsTrip(ident.row.passport_expiry, v.returnDate);
  if (pp) return { errors: { returnDate: pp }, values: safe(v) };

  const path = `${user.id}/${crypto.randomUUID()}.${kind}`;
  const up = await supabase.storage.from("tickets").upload(path, bytes!, { contentType: MIME[kind!], upsert: false });
  if (up.error) return { errors: {}, values: safe(v), formError: "Não foi possível enviar a foto do bilhete agora. Tenta de novo daqui a pouco." };

  // Viagem e documentos gravados numa só operação: ou ficam os dois, ou nenhum.
  const { data: tripId, error } = await supabase.rpc("submit_trip", {
    p_name: v.name, p_contact: v.contact, p_origin: v.origin, p_destination: v.destination,
    p_travel_date: v.date, p_return_date: v.returnDate, p_flight: v.flight || "", p_kg: num(v.kg)!, p_per_kg: Math.round(num(v.perKg)!),
    p_ticket_path: path,
  });
  if (error || !tripId) {
    await supabase.storage.from("tickets").remove([path]); // não deixa a foto órfã
    const mine = error?.code === "P0001";
    return { errors: {}, values: safe(v), formError: mine ? error!.message : "Não foi possível registar a viagem agora. Tenta de novo daqui a pouco." };
  }

  revalidatePath("/meus");
  const summary = [
    "VIAGEM · Kamba Traz", "Nome: " + v.name, "Contacto: " + v.contact,
    `Rota: ${cityName(v.origin)} → ${cityName(v.destination)}`, `Ida: ${v.date} · Regresso: ${v.returnDate}`,
    v.flight ? "Voo: " + v.flight : null, `Espaço livre: ${num(v.kg)} kg`, "Preço por kg: " + kz(Math.round(num(v.perKg)!)),
    "Identificação: já guardada · bilhete enviado",
  ].filter(Boolean).join("\n");
  return { errors: {}, values: {}, done: { ref: "KT-" + refCode(tripId as string), summary, kind: "trip" } };
}
