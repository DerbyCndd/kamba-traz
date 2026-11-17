"use client";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { submitRequest } from "../actions";
import { CATS, FROM, TO } from "@/lib/constants";
import { cityName, kz } from "@/lib/format";
import { CUSTOMS, INVOICE_MIN_EUR, MAX_TRIP_EUR, customsEstimate, needsInvoice } from "@/lib/customs";
import { emptyForm } from "@/lib/types";
import { CURRENCIES, ORIGIN_CURRENCY, RATES_DATE, isCur, toEur, type Cur } from "@/lib/currency";
import { Field } from "@/components/ui";
import { Src } from "@/components/Src";
import { useFocusFirstError } from "@/components/useFocusFirstError";
import { SubmitResult } from "@/components/SubmitResult";

const cityOpts = (codes: string[]) =>
  codes.map((c) => <option key={c} value={c}>{cityName(c)}{c !== "OTH" ? ` (${c})` : ""}</option>);

export function RequestForm({ perKg, whatsapp, defaultName, defaultPhone, invoices, minDate, limitEur, delivery, handoverChoice }: { perKg: number; whatsapp: string; defaultName: string; defaultPhone: string; invoices: boolean; minDate: string; limitEur: number | null; delivery: boolean; handoverChoice: boolean }) {
  const [state, action, pending] = useActionState(submitRequest, emptyForm);
  const [cat, setCat] = useState<string | null>(null);
  const [kg, setKg] = useState("");
  const [val, setVal] = useState("");
  const [map, setMap] = useState(state.values.pickup_map ?? "");
  const [geoMsg, setGeoMsg] = useState("");
  const [handover, setHandover] = useState<"buscar" | "levar">(state.values.handover === "levar" ? "levar" : "buscar");
  const [cur, setCur] = useState<Cur>(isCur(state.values.currency) ? state.values.currency : ORIGIN_CURRENCY[state.values.origin ?? "LIS"] ?? "EUR");
  useFocusFirstError(state.errors);
  if (state.done) return <SubmitResult done={state.done} whatsapp={whatsapp} />;

  const v = state.values, e = state.errors;
  const k = parseFloat(kg);
  const amount = parseFloat(val) || Number(v.value) || 0;
  const valEur = toEur(amount, cur); // tudo por dentro é em euros
  const wantsInvoice = invoices && needsInvoice(cat ?? v.category ?? CATS[0], valEur);

  const overLimit = limitEur != null && valEur > limitEur;

  // Localização atual: preenche a ligação do mapa. A pessoa confirma que é o sítio certo.
  function fillLocation() {
    if (!navigator.geolocation) { setGeoMsg("O teu navegador não permite obter a localização."); return; }
    setGeoMsg("A obter a localização…");
    navigator.geolocation.getCurrentPosition(
      (p) => { setMap(`https://www.google.com/maps?q=${p.coords.latitude.toFixed(5)},${p.coords.longitude.toFixed(5)}`); setGeoMsg("Localização preenchida. Confirma que é o sítio certo."); },
      () => setGeoMsg("Não foi possível obter a localização. Escreve a morada ou cola uma ligação do mapa."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  // Envio manual: assim o formulário não se apaga quando há um erro (a pessoa não tem de escolher a fatura outra vez).
  function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    startTransition(() => action(fd));
  }
  const est = valEur > 0 ? customsEstimate(valEur) : null;
  return (
    <div className="panel">
      <form onSubmit={onSubmit} noValidate>
        <fieldset className="fs">
          <legend>Percurso</legend>
          <div className="fields">
            <Field id="origin" label="Sai de" hint="Não está a tua cidade? Escolhe «Outra cidade»: a equipa pergunta-te qual é."><select id="origin" name="origin" defaultValue={v.origin ?? "LIS"} onChange={(ev) => setCur(ORIGIN_CURRENCY[ev.target.value] ?? "EUR")}>{cityOpts(FROM)}</select></Field>
            <Field id="destination" label="Chega a" hint="Entregamos em Angola. Não está a tua cidade? Escolhe «Outra cidade»."><select id="destination" name="destination" defaultValue={v.destination ?? "LAD"}>{cityOpts(TO)}</select></Field>
          </div>
        </fieldset>
        <fieldset className="fs">
          <legend>A encomenda</legend>
          <div className="fields">
            <Field id="item" label="O que queres enviar" full error={e.item}>
            <input id="item" name="item" maxLength={90} placeholder="Ex.: telemóvel novo na caixa" defaultValue={v.item} />
          </Field>
            <Field id="category" label="Tipo de item" full>
            <select id="category" name="category" defaultValue={v.category ?? CATS[0]} onChange={(ev) => setCat(ev.target.value)}>{CATS.map((c) => <option key={c} value={c}>{c}</option>)}</select>
          </Field>
            <Field id="kg" label="Peso aproximado (kg)" error={e.kg}>
            <input id="kg" name="kg" type="number" min="0.1" step="0.1" inputMode="decimal" defaultValue={v.kg} onChange={(ev) => setKg(ev.target.value)} />
          </Field>
            <Field id="currency" label="Moeda do item" hint="Muda sozinha com a cidade de onde sai. Podes escolher outra.">
            <select id="currency" name="currency" value={cur} onChange={(ev) => setCur(ev.target.value as Cur)}>
              {(Object.keys(CURRENCIES) as Cur[]).map((c) => <option key={c} value={c}>{CURRENCIES[c].name} ({CURRENCIES[c].symbol === c ? c : CURRENCIES[c].symbol + ", " + c})</option>)}
            </select>
          </Field>
            <Field id="value" label={`Valor do item (${CURRENCIES[cur].symbol})`} hint="Quanto pagaste, ou quanto vale, na moeda do país de onde sai." error={e.value}>
            <input id="value" name="value" type="number" min="0" step="1" inputMode="decimal" defaultValue={v.value} onChange={(ev) => setVal(ev.target.value)} />
          </Field>
          <div className="hint customs" role="note">
            <b>Porque convertemos para euros?</b> A alfândega de Angola, a exigência de fatura (a partir de {INVOICE_MIN_EUR} €), o teto por viagem e o limite das contas novas calculam-se todos numa só moeda, para tratarmos toda a gente da mesma forma. Por isso a Kamba Traz converte o valor que escreves para euros, com uma taxa de referência de {RATES_DATE} arredondada de propósito para não ficar abaixo do valor real.
            {" "}Não é a taxa do teu banco, e o valor na alfândega pode diferir um pouco.
            {cur !== "EUR" && valEur > 0 ? <> <b>{amount} {CURRENCIES[cur].symbol} ≈ {valEur} €</b> (1 € = {String(CURRENCIES[cur].perEur).replace(".", ",")} {CURRENCIES[cur].symbol === cur ? cur : CURRENCIES[cur].symbol}).</> : null}
          </div>
          {est ? (
            <p className={"hint customs" + (est.kind === "geral" ? " over" : "")} role="status">
              {est.kind === "geral"
                ? `Acima de ${kz(CUSTOMS.flatMaxKz)} (cerca de ${MAX_TRIP_EUR} €) a alfândega aplica o regime geral e a Kamba não aceita o pedido. Divide em vários envios mais pequenos, ou usa um serviço de courier.`
                : `Imposto estimado na alfândega, se não for tratado como uso pessoal: cerca de ${kz(est.taxKz)} (${CUSTOMS.flatPct}% do valor). É uma estimativa e o câmbio muda.`}
              {" "}<Src refs={est.kind === "geral" ? [["dlp", "art. 12.º, n.º 6"]] : [["dlp", "art. 12.º, n.º 2"], ["guia", "ponto 2.3"]]} />
            </p>
          ) : null}
          </div>
        </fieldset>
        <fieldset className="fs">
          <legend>Pagamento e prazo</legend>
          <div className="fields">
            <Field id="offer" label="Quanto ofereces pelo transporte (Kz)" error={e.offer}>
            <input id="offer" name="offer" type="number" min="0" step="500" inputMode="numeric" defaultValue={v.offer} />
          </Field>
            <Field id="deadline" label="Preciso até (opcional)" error={e.deadline}>
            <input id="deadline" name="deadline" type="date" min={minDate} defaultValue={v.deadline} />
          </Field>
          </div>
        </fieldset>
        {delivery ? (
          <>
            {handoverChoice ? (
              <fieldset className="fs">
                <legend>Como a encomenda chega ao entregador</legend>
                <div className="fields">
                  <div className="field full">
                    <label className="check" htmlFor="h-buscar">
                      <input id="h-buscar" name="handover" type="radio" value="buscar" checked={handover === "buscar"} onChange={() => setHandover("buscar")} />
                      <span><b>O entregador vem buscar</b> à minha morada. Indico onde, e ele só a vê depois de o pagamento ficar retido.</span>
                    </label>
                    <label className="check" htmlFor="h-levar">
                      <input id="h-levar" name="handover" type="radio" value="levar" checked={handover === "levar"} onChange={() => setHandover("levar")} />
                      <span><b>Levo eu a encomenda ao entregador.</b> Não preciso de indicar a minha morada: vejo onde ele recebe depois de o pagamento ficar retido, e combinamos.</span>
                    </label>
                  </div>
                </div>
              </fieldset>
            ) : null}
            {handover === "buscar" ? (
            <fieldset className="fs">
              <legend>Onde pegar a encomenda</legend>
              <p className="privacy">O entregador vê isto só depois de o pagamento ficar retido, para vir buscar a encomenda. Mais ninguém, além da equipa.</p>
              <div className="fields">
                <Field id="pickup_address" label="Morada de recolha" hint="Rua, número, bairro e cidade." error={e.pickup_address} full>
                  <input id="pickup_address" name="pickup_address" maxLength={300} autoComplete="street-address" defaultValue={v.pickup_address} />
                </Field>
                <Field id="pickup_notes" label="Horários e referências (opcional)" hint="Ex.: depois das 18h, portão azul, tocar à campainha." error={e.pickup_notes} full>
                  <input id="pickup_notes" name="pickup_notes" maxLength={300} defaultValue={v.pickup_notes} />
                </Field>
                <Field id="pickup_map" label="Localização no mapa (opcional)" hint="Cola uma ligação do Google Maps, ou usa o botão para enviar a tua localização atual." error={e.pickup_map} full>
                  <input id="pickup_map" name="pickup_map" inputMode="url" maxLength={300} placeholder="https://maps.google.com/…" value={map} onChange={(ev) => setMap(ev.target.value)} />
                </Field>
                <div className="field full">
                  <button type="button" className="btn small" onClick={fillLocation}>Usar a minha localização atual</button>
                  {geoMsg ? <span className="hint" role="status"> {geoMsg}</span> : null}
                </div>
              </div>
            </fieldset>
            ) : null}
            <fieldset className="fs">
              <legend>Quem recebe em Angola</legend>
              <p className="privacy">O entregador usa isto para entregar. Pede à pessoa que dê o código de entrega ao receber. Só o entregador e a equipa veem estes dados.</p>
              <div className="fields">
                <Field id="recipient_name" label="Nome de quem recebe" error={e.recipient_name}>
                  <input id="recipient_name" name="recipient_name" maxLength={80} defaultValue={v.recipient_name} />
                </Field>
                <Field id="recipient_phone" label="Telefone de quem recebe" error={e.recipient_phone}>
                  <input id="recipient_phone" name="recipient_phone" type="tel" inputMode="tel" placeholder="+244 9XX XXX XXX" defaultValue={v.recipient_phone} />
                </Field>
                <Field id="recipient_address" label="Onde entregar" hint="Bairro, rua e uma referência (ex.: junto ao mercado)." error={e.recipient_address} full>
                  <input id="recipient_address" name="recipient_address" maxLength={300} defaultValue={v.recipient_address} />
                </Field>
              </div>
            </fieldset>
          </>
        ) : null}
        <fieldset className="fs">
          <legend>Os teus dados</legend>
          <div className="fields">
            <Field id="name" label="O teu nome" error={e.name}><input id="name" name="name" autoComplete="name" maxLength={60} defaultValue={v.name ?? defaultName} /></Field>
            <Field id="contact" label="WhatsApp ou telefone" hint="Só a equipa vê este número." error={e.contact}>
            <input id="contact" name="contact" type="tel" autoComplete="tel" inputMode="tel" placeholder="+244 9XX XXX XXX" defaultValue={v.contact ?? defaultPhone} />
          </Field>
          </div>
        </fieldset>
        {wantsInvoice ? (
          <fieldset className="fs">
            <legend>Fatura da compra</legend>
            <p className="privacy">Pedimos a fatura de eletrónicos, cosméticos (perfumes) e peças, e de qualquer item acima de {INVOICE_MIN_EUR} €. Serve para a alfândega e para te proteger. Só a equipa a vê.</p>
            <div className="fields">
              <Field id="invoice" label="Foto ou PDF da fatura" hint="JPG, PNG, WebP ou PDF, até 3 MB." error={e.invoice} full>
                <input id="invoice" name="invoice" type="file" accept="image/*,application/pdf" />
              </Field>
            </div>
          </fieldset>
        ) : null}
        {overLimit ? (
          <fieldset className="fs">
            <legend>Valor acima do limite de conta nova</legend>
            <p className="privacy">As contas novas podem enviar itens até {limitEur} €, para proteger quem envia e quem viaja. O limite sobe depois da primeira entrega concluída. Se precisas de enviar mais já, marca o pedido como urgente e explica porquê: a equipa lê e decide se liberta.</p>
            <div className="fields">
              <div className="field full">
                <label className="check" htmlFor="urgent">
                  <input id="urgent" name="urgent" type="checkbox" defaultChecked={v.urgent === "on"} />
                  <span>Marco este pedido como urgente</span>
                </label>
              </div>
              <Field id="urgent_reason" label="Porque precisas de enviar este valor agora" hint="Pelo menos 20 caracteres. Só a equipa lê." error={e.urgent_reason} full>
                <textarea id="urgent_reason" name="urgent_reason" rows={3} maxLength={400} defaultValue={v.urgent_reason} />
              </Field>
            </div>
          </fieldset>
        ) : null}
        {k > 0 ? <span className="hint">Referência: cerca de {kz(k * perKg)} para {k} kg.</span> : null}
        <div className="field">
          <label className="check" htmlFor="ok">
            <input id="ok" name="ok" type="checkbox" defaultChecked={v.ok === "on"} aria-invalid={e.ok ? true : undefined} aria-describedby={e.ok ? "ok-e" : undefined} />
            <span>Confirmo que o item é legal, que posso mostrá-lo ao viajante para inspecção e que li as <Link href="/regras">regras de itens proibidos e da alfândega</Link>. Sei que a alfândega pode cobrar taxas sobre o item e aceito os <Link href="/termos" target="_blank">termos de uso</Link>.</span>
          </label>
          <span className="err" id="ok-e" role="alert">{e.ok || ""}</span>
        </div>
        {state.formError ? <div className="notice bad" role="alert">{state.formError}</div> : null}
        <div className="row"><button type="submit" className="btn primary" disabled={pending}>{pending ? "A enviar…" : "Enviar pedido"}</button></div>
      </form>
    </div>
  );
}
