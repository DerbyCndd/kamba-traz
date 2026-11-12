"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const hhmm = () => new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });

/**
 * Mantém o quadro actual. Quando alguém recebe uma avaliação, a base de dados avisa (Realtime) e a página
 * recalcula o quadro no servidor. Se a ligação falhar, recalcula de minuto a minuto enquanto o separador estiver visível.
 */
export function LiveRank() {
  const router = useRouter();
  const [live, setLive] = useState(false);
  const [at, setAt] = useState<string | null>(null);
  const wait = useRef<number | undefined>(undefined);

  useEffect(() => {
    const refresh = () => {
      window.clearTimeout(wait.current);
      wait.current = window.setTimeout(() => { router.refresh(); setAt(hhmm()); }, 400); // junta avisos seguidos
    };
    const supabase = createClient();
    const channel = supabase
      .channel("rank-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "rank_events" }, refresh)
      // O estado SUBSCRIBED sozinho não chega: sem a tabela no Realtime o servidor também diz SUBSCRIBED e depois avisa do erro.
      .on("system", {}, (p: { status?: string; message?: string }) => {
        const msg = p?.message ?? "";
        if (p?.status === "error" || /unable to subscribe/i.test(msg)) setLive(false);
        else if (/subscribed to postgresql/i.test(msg)) setLive(true);
      })
      .subscribe((status) => { if (status !== "SUBSCRIBED") setLive(false); });

    const tick = window.setInterval(() => { if (document.visibilityState === "visible") refresh(); }, 60000);
    const back = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", back);

    return () => {
      window.clearTimeout(wait.current);
      window.clearInterval(tick);
      document.removeEventListener("visibilitychange", back);
      supabase.removeChannel(channel);
    };
  }, [router]);

  return (
    <p className={"live" + (live ? " on" : "")} role="status">
      <span className="dotlive" aria-hidden="true" />
      {live ? "Ao vivo: o quadro muda assim que alguém recebe uma avaliação." : "O quadro atualiza-se de minuto a minuto."}
      {at ? <span className="hint"> Atualizado às {at}.</span> : null}
    </p>
  );
}
