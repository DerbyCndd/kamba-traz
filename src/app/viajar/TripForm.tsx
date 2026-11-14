"use client";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState, startTransition } from "react";
import { submitTrip } from "../actions";
import { FROM, TO } from "@/lib/constants";
import { cityName } from "@/lib/format";
import { emptyForm } from "@/lib/types";
import { Field } from "@/components/ui";
import { useFocusFirstError } from "@/components/useFocusFirstError";
import { SubmitResult } from "@/components/SubmitResult";
import { shrinkImage } from "@/lib/shrink";
import { Src } from "@/components/Src";

const cityOpts = (codes: string[]) =>
  codes.map((c) => <option key={c} value={c}>{cityName(c)}{c !== "OTH" ? ` (${c})` : ""}</option>);

export function TripForm({ perKg, whatsapp, defaultName, defaultPhone, minDate }: { perKg: number; whatsapp: string; defaultName: string; defaultPhone: string; minDate: string }) {
  const [state, action, pending] = useActionState(submitTrip, emptyForm);
  const [preview, setPreview] = useState<{ url: string; kb: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useFocusFirstError(state.errors);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);
  if (state.done) return <SubmitResult done={state.done} whatsapp={whatsapp} />;

  const v = state.values, e = state.errors;

  async function pick(ev: React.ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0];
    if (!f) { setPreview(null); return; }
    setBusy(true);
    const small = await shrinkImage(f, "bilhete.jpg");
    const dt = new DataTransfer();
    dt.items.add(small);
    if (input.current) input.current.files = dt.files;
    setPreview({ url: URL.createObjectURL(small), kb: Math.round(small.size / 1024) });
    setBusy(false);
  }

  // Envio manual: assim o formulário não se apaga quando há um erro (a pessoa não tem de escolher a foto outra vez).
  function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    startTransition(() => action(fd));
  }

  return (
    <div className="panel">
      <form onSubmit={onSubmit} noValidate>
        <fieldset className="fs">
          <legend>Percurso e datas</legend>
          <div className="fields">
            <Field id="origin" label="Sais de" hint="Não está a tua cidade? Escolhe «Outra cidade»: a equipa pergunta-te qual é."><select id="origin" name="origin" defaultValue={v.origin ?? "LIS"}>{cityOpts(FROM)}</select></Field>
            <Field id="destination" label="Chegas a" hint="Entregamos em Angola. Não está a tua cidade? Escolhe «Outra cidade»."><select id="destination" name="destination" defaultValue={v.destination ?? "LAD"}>{cityOpts(TO)}</select></Field>
            <Field id="date" label="Data de ida" error={e.date}><input id="date" name="date" type="date" min={minDate} defaultValue={v.date} /></Field>
            <Field id="returnDate" label="Data de regresso" hint="Como está no bilhete." error={e.returnDate}><input id="returnDate" name="returnDate" type="date" min={minDate} defaultValue={v.returnDate} /></Field>
            <Field id="flight" label="Companhia e voo (opcional)" error={e.flight} full>
              <input id="flight" name="flight" maxLength={30} placeholder="Ex.: TAAG DT 701" defaultValue={v.flight} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="fs">
          <legend>Espaço e preço</legend>
          <div className="fields">
            <Field id="kg" label="Espaço livre na mala (kg)" error={e.kg}>
              <input id="kg" name="kg" type="number" min="1" step="1" inputMode="numeric" defaultValue={v.kg} />
            </Field>
            <Field id="perKg" label="Preço por kg (Kz)" hint="Podes ajustar a cada pedido." error={e.perKg}>
              <input id="perKg" name="perKg" type="number" min="0" step="500" inputMode="numeric" defaultValue={v.perKg ?? perKg} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="fs">
          <legend>Bilhete de avião</legend>
          <p className="privacy">A tua identificação (BI e telefone) já está guardada: não a pedimos de novo. Só a equipa vê o bilhete.</p>
          <p className="notice customs-note"><b>Alfândega em Angola.</b> A lei só isenta bens «destinados ao consumo pessoal» do viajante, por isso tratamos as encomendas de outras pessoas como não isentas: à chegada usa o <b>canal vermelho</b> e declara. Entre Kz 1 000 001 e Kz 1 500 000 aplica-se uma taxa fixa de 16%, e acima disso o regime geral, que a Kamba não aceita. Por isso cada viagem leva no máximo Kz 1 500 000 em mercadoria. <Src refs={[["dlp", "art. 1.º, k) e art. 12.º"], ["guia", "pontos 2.1.1.2 e 2.3"]]} /> <Link href="/regras#alfandega">Ver as regras</Link></p>
          <div className="fields">
            <Field id="ticket" label="Foto do bilhete de avião" hint="Com o teu nome e as datas." error={e.ticket} full>
              <input id="ticket" name="ticket" type="file" accept="image/*" ref={input} onChange={pick} />
            </Field>
          </div>
          {busy ? <p className="hint" role="status">A preparar a foto…</p> : null}
          {preview ? (
            <figure className="ticketpreview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview.url} alt="A foto do bilhete que vais enviar" />
              <figcaption className="hint">Foto pronta ({preview.kb} KB). Confirma que se lê o nome e as datas.</figcaption>
            </figure>
          ) : null}
        </fieldset>

        <fieldset className="fs">
          <legend>Os teus dados</legend>
          <div className="fields">
            <Field id="name" label="O teu nome" hint="No quadro mostramos só o primeiro nome." error={e.name}>
              <input id="name" name="name" autoComplete="name" maxLength={60} defaultValue={v.name ?? defaultName} />
            </Field>
            <Field id="contact" label="WhatsApp ou telefone" hint="Só a equipa vê este número." error={e.contact}>
              <input id="contact" name="contact" type="tel" autoComplete="tel" inputMode="tel" placeholder="+351 9XX XXX XXX" defaultValue={v.contact ?? defaultPhone} />
            </Field>
          </div>
        </fieldset>

        <div className="field">
          <label className="check" htmlFor="ok">
            <input id="ok" name="ok" type="checkbox" defaultChecked={v.ok === "on"} aria-invalid={e.ok ? true : undefined} aria-describedby={e.ok ? "ok-e" : undefined} />
            <span>Os dados são meus e verdadeiros, e autorizo a equipa a confirmar o meu bilhete e a minha identidade. Aceito abrir e fotografar cada volume e não levar o que está nas <Link href="/regras">regras</Link>. Vou declarar na alfândega, pelo canal vermelho, o que levar para outras pessoas, e aceito os <Link href="/termos" target="_blank">termos de uso</Link>.</span>
          </label>
          <span className="err" id="ok-e" role="alert">{e.ok || ""}</span>
        </div>
        {state.formError ? <div className="notice bad" role="alert">{state.formError}</div> : null}
        <div className="row"><button type="submit" className="btn primary" disabled={pending || busy}>{pending ? "A enviar…" : "Publicar viagem"}</button></div>
      </form>
    </div>
  );
}
