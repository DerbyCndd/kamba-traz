"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { pickupDeal, uploadDealPhotos } from "@/app/entregas/actions";
import { shrinkImage } from "@/lib/shrink";

const MIN_PHOTOS = 2;

/**
 * O entregador pega a encomenda. Antes, fotografa o estado do volume (pelo menos 2 fotos) e aceita partilhar a localização.
 * `photos` é o número de fotos já enviadas, ou null enquanto o SQL das fotos não foi corrido (então não se pedem).
 */
export function PickupPanel({ dealId, photos }: { dealId: string; photos: number | null }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");
  const [picked, setPicked] = useState<{ file: File; url: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [pending, start] = useTransition();
  const [sending, startSend] = useTransition();

  const needsPhotos = photos !== null;
  const have = photos ?? 0;
  const enough = !needsPhotos || have >= MIN_PHOTOS;

  async function choose(ev: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(ev.target.files ?? []).slice(0, 6);
    if (!list.length) return;
    setBusy(true); setError("");
    const small = await Promise.all(list.map((f, i) => shrinkImage(f, `volume-${i + 1}.jpg`)));
    picked.forEach((p) => URL.revokeObjectURL(p.url));
    setPicked(small.map((file) => ({ file, url: URL.createObjectURL(file) })));
    setBusy(false);
  }

  function send() {
    setError("");
    const fd = new FormData();
    fd.set("deal", dealId);
    picked.forEach((p) => fd.append("photos", p.file));
    startSend(async () => {
      const r = await uploadDealPhotos(fd);
      if (r.error) { setError(r.error); return; }
      picked.forEach((p) => URL.revokeObjectURL(p.url));
      setPicked([]);
      if (input.current) input.current.value = "";
      router.refresh();
    });
  }

  function pick() {
    setError("");
    start(async () => {
      const r = await pickupDeal(dealId);
      if (r.error) setError(r.error);
    });
  }

  return (
    <div className="panel">
      <h3>Pegar a encomenda</h3>
      <p className="muted">O pagamento já está retido na carteira. Quando tiveres a encomenda contigo, confirma aqui.</p>

      {needsPhotos ? (
        <div className="pickphotos">
          <p><b>1. Fotografa o volume</b> <span className="hint">({have} {have === 1 ? "foto enviada" : "fotos enviadas"}, pelo menos {MIN_PHOTOS})</span></p>
          <p className="hint">Tira fotos do volume aberto e do conteúdo, e depois selado, junto de quem envia. Protegem-te a ti e a quem envia se houver um problema.</p>
          <input ref={input} type="file" accept="image/*" capture="environment" multiple onChange={choose} aria-label="Fotos do volume" />
          {busy ? <p className="hint" role="status">A preparar as fotos…</p> : null}
          {picked.length ? (
            <>
              <div className="thumbs">
                {picked.map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p.url} src={p.url} alt="Foto do volume pronta a enviar" />
                ))}
              </div>
              <div className="row"><button type="button" className="btn" onClick={send} disabled={sending}>{sending ? "A enviar…" : `Enviar ${picked.length} ${picked.length === 1 ? "foto" : "fotos"}`}</button></div>
            </>
          ) : null}
        </div>
      ) : null}

      <p>{needsPhotos ? <b>2. Confirma</b> : null}</p>
      <label className="check" htmlFor="loc-ok">
        <input id="loc-ok" type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />
        <span>Aceito partilhar a minha localização com quem enviou e com a equipa enquanto levo a encomenda. Pára quando a entrega for confirmada.</span>
      </label>
      {error ? <div className="notice bad" role="alert">{error}</div> : null}
      <div className="row">
        <button type="button" className="btn primary" disabled={!ok || !enough || pending} onClick={pick}>{pending ? "A confirmar…" : "Peguei a encomenda"}</button>
        {!enough ? <span className="hint">Envia pelo menos {MIN_PHOTOS} fotos para continuar.</span> : null}
      </div>
    </div>
  );
}
