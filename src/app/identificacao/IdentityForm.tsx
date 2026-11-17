"use client";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useState } from "react";
import { saveIdentity, type IdentityState } from "./actions";
import { Field } from "@/components/ui";
import { useFocusFirstError } from "@/components/useFocusFirstError";
import { shrinkImage } from "@/lib/shrink";

const empty: IdentityState = { errors: {}, values: {} };

/** Escolhe uma foto, reduz-a e mostra uma pré-visualização (para a pessoa ver que se lê). */
export function PhotoPick({ id, label, hint, error, tag }: { id: string; label: string; hint: string; error?: string; tag: string }) {
  const [prev, setPrev] = useState<{ url: string; kb: number } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => () => { if (prev) URL.revokeObjectURL(prev.url); }, [prev]);

  async function pick(ev: React.ChangeEvent<HTMLInputElement>) {
    const input = ev.target;
    const f = input.files?.[0];
    if (!f) { setPrev(null); return; }
    setBusy(true);
    const small = await shrinkImage(f, tag + ".jpg");
    const dt = new DataTransfer();
    dt.items.add(small);
    input.files = dt.files;
    setPrev({ url: URL.createObjectURL(small), kb: Math.round(small.size / 1024) });
    setBusy(false);
  }
  return (
    <>
      <Field id={id} label={label} hint={hint} error={error} full>
        <input id={id} name={id} type="file" accept="image/*" onChange={pick} />
      </Field>
      {busy ? <p className="hint" role="status">A preparar a foto…</p> : null}
      {prev ? (
        <figure className="ticketpreview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={prev.url} alt={"Pré-visualização: " + label.toLowerCase()} />
          <figcaption className="hint">Foto pronta ({prev.kb} KB). Confirma que se lê tudo.</figcaption>
        </figure>
      ) : null}
    </>
  );
}

export function IdentityForm({ defaultName, defaultPhone, next, hasIdentity, dates, sides, needPassport }: { defaultName: string; defaultPhone: string; next: string; hasIdentity: boolean; dates: boolean; sides: boolean; needPassport?: boolean }) {
  const [state, action, pending] = useActionState(saveIdentity, empty);
  const [withPassport, setWithPassport] = useState(!!needPassport);
  useFocusFirstError(state.errors);
  const v = state.values, e = state.errors;

  // Envio manual: o formulário não se apaga quando há um erro e as fotos escolhidas mantêm-se.
  function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    startTransition(() => action(fd));
  }

  return (
    <div className="panel">
      <form onSubmit={onSubmit} noValidate>
        <input type="hidden" name="next" value={next} />
        <fieldset className="fs">
          <legend>Quem és</legend>
          <div className="fields">
            <Field id="fullName" label="Nome completo, como no BI" error={e.fullName} full>
              <input id="fullName" name="fullName" autoComplete="name" maxLength={80} defaultValue={v.fullName ?? defaultName} />
            </Field>
            <Field id="phone" label="WhatsApp ou telefone" hint="Só a equipa vê este número." error={e.phone}>
              <input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+244 9XX XXX XXX" defaultValue={v.phone ?? defaultPhone} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="fs">
          <legend>Bilhete de identidade (BI)</legend>
          <p className="privacy">Só a equipa vê o BI. Guardamos o número cifrado e a foto em espaço privado.</p>
          <div className="fields">
            <Field id="bi" label="Número do BI" error={e.bi} full>
              <input id="bi" name="bi" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={18} placeholder="Ex.: 000123456LA041" />
            </Field>
            {dates ? (
              <Field id="biExpiry" label="Validade do BI" hint="A data que está no cartão." error={e.biExpiry}>
                <input id="biExpiry" name="biExpiry" type="date" min={new Date().toISOString().slice(0, 10)} defaultValue={v.biExpiry} />
              </Field>
            ) : null}
          </div>
          <PhotoPick id="biPhoto" tag="bi" label={sides ? "Foto do BI: frente" : "Foto do BI"} hint="A frente, com o teu rosto e o nome bem legíveis." error={e.biPhoto} />
          {sides ? <PhotoPick id="biBack" tag="bi-verso" label="Foto do BI: verso" hint="O verso do cartão, com os dados bem legíveis." error={e.biBack} /> : null}
        </fieldset>

        <fieldset className="fs">
          <legend>{needPassport ? "Passaporte (obrigatório para viajar)" : "Passaporte (opcional)"}</legend>
          {needPassport ? (
            <>
              <input type="hidden" name="withPassport" value="on" />
              <p className="privacy">Quem viaja tem de ter o passaporte registado, para a equipa o conferir com o bilhete. Se o BI já está guardado, volta a juntar as fotos dele: enviar de novo substitui a identificação anterior.</p>
            </>
          ) : (
            <label className="check" htmlFor="withPassport">
              <input id="withPassport" name="withPassport" type="checkbox" checked={withPassport} onChange={(ev) => setWithPassport(ev.target.checked)} />
              <span>Quero já indicar o meu passaporte. Se não, basta o BI e o telefone para enviar encomendas (para viajar é preciso o passaporte).</span>
            </label>
          )}
          {withPassport ? (
            <>
              <div className="fields">
                <Field id="passport" label="Número do passaporte" error={e.passport} full>
                  <input id="passport" name="passport" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={14} placeholder="Ex.: N1234567" />
                </Field>
                {dates ? (
                  <Field id="passportExpiry" label="Validade do passaporte" hint="Para viajar, tem de valer mais 6 meses depois do regresso." error={e.passportExpiry} full>
                    <input id="passportExpiry" name="passportExpiry" type="date" min={new Date().toISOString().slice(0, 10)} defaultValue={v.passportExpiry} />
                  </Field>
                ) : null}
              </div>
              <PhotoPick id="passportPhoto" tag="passaporte" label={sides ? "Foto do passaporte: 2.ª página" : "Foto do passaporte"} hint={sides ? "A 2.ª página, com a fotografia e os dados." : "A página com a fotografia e os dados."} error={e.passportPhoto} />
              {sides ? <PhotoPick id="passportLast" tag="passaporte-ultima" label="Foto do passaporte: última página" hint="A última página do passaporte." error={e.passportLast} /> : null}
            </>
          ) : null}
        </fieldset>

        <div className="field">
          <label className="check" htmlFor="ok">
            <input id="ok" name="ok" type="checkbox" defaultChecked={v.ok === "on"} aria-invalid={e.ok ? true : undefined} aria-describedby={e.ok ? "ok-e" : undefined} />
            <span>Os dados e documentos são meus e verdadeiros, e autorizo a equipa a guardá-los para confirmar a minha identidade. Ficam guardados para não os pedirmos de novo, como explica a <Link href="/privacidade" target="_blank">política de privacidade</Link>.</span>
          </label>
          <span className="err" id="ok-e" role="alert">{e.ok || ""}</span>
        </div>
        {state.formError ? <div className="notice bad" role="alert">{state.formError}</div> : null}
        <div className="row">
          <button type="submit" className="btn primary" disabled={pending}>{pending ? "A enviar…" : hasIdentity ? "Atualizar identificação" : "Guardar e continuar"}</button>
          {hasIdentity ? <Link className="btn" href="/perfil">Cancelar</Link> : null}
        </div>
      </form>
    </div>
  );
}
