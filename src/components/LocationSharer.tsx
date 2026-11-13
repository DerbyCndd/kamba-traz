"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type State = "idle" | "on" | "denied" | "unsupported" | "error";
const TEXT: Record<State, string> = {
  idle: "A localização não está a ser partilhada.",
  on: "A partilhar a tua localização com quem enviou e com a equipa.",
  denied: "Sem permissão de localização. Ativa-a nas definições do navegador e toca em Partilhar.",
  unsupported: "Este navegador não consegue partilhar a localização.",
  error: "Não conseguimos obter a tua posição agora. A tentar de novo.",
};

/**
 * Envia a posição do entregador de poucos em poucos segundos, só enquanto esta página estiver aberta.
 * Mantém o ecrã ligado (os navegadores suspendem o GPS em segundo plano). Pode parar e retomar quando quiser.
 */
export function LocationSharer({ dealId }: { dealId: string }) {
  const [state, setState] = useState<State>("idle");
  const [last, setLast] = useState("");
  const watch = useRef<number | null>(null);
  const lock = useRef<WakeLockSentinel | null>(null);
  const sent = useRef(0);

  const stop = useCallback(() => {
    if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
    watch.current = null;
    lock.current?.release().catch(() => {});
    lock.current = null;
  }, []);

  const start = useCallback(() => {
    if (!("geolocation" in navigator)) { queueMicrotask(() => setState("unsupported")); return; }
    stop();
    const supabase = createClient();
    watch.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const now = Date.now();
        if (now - sent.current < 8000) return; // no máximo um ponto a cada 8 segundos
        sent.current = now;
        const { error } = await supabase.rpc("push_location", { p_deal: dealId, p_lat: pos.coords.latitude, p_lng: pos.coords.longitude, p_acc: pos.coords.accuracy });
        if (error) { sent.current = 0; setState("error"); return; } // não finge que partilha se o servidor recusou
        setState("on");
        setLast(new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      },
      (err) => setState(err.code === 1 ? "denied" : "error"),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
    navigator.wakeLock?.request("screen").then((l) => { lock.current = l; }).catch(() => {});
  }, [dealId, stop]);

  useEffect(() => {
    start();
    // O ecrã apagou-se e voltou: a trava de ecrã perde-se e é preciso pedi-la outra vez.
    const back = () => { if (document.visibilityState === "visible" && watch.current !== null) navigator.wakeLock?.request("screen").then((l) => { lock.current = l; }).catch(() => {}); };
    document.addEventListener("visibilitychange", back);
    return () => { document.removeEventListener("visibilitychange", back); stop(); };
  }, [start, stop]);

  const on = state === "on";
  return (
    <div className={"sharer" + (on ? " on" : "")} role="status">
      <p>{TEXT[state]}{on && last ? <span className="hint"> Última posição enviada às {last}.</span> : null}</p>
      <p className="hint">Mantém esta página aberta e o ecrã ligado: o navegador não partilha a localização em segundo plano.</p>
      <div className="row">
        {state !== "on" && state !== "error"
          ? <button type="button" className="btn small" onClick={() => { setState("idle"); start(); }}>Partilhar localização</button>
          : <button type="button" className="btn small" onClick={() => { stop(); setState("idle"); }}>Parar de partilhar</button>}
      </div>
    </div>
  );
}
