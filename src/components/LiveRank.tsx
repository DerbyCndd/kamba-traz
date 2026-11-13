"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Mantém o quadro actual, sem nada para ver. Quando alguém recebe uma avaliação a base de dados avisa (Realtime)
 * e a página recalcula o quadro no servidor. Se a ligação falhar, recalcula de minuto a minuto com o separador visível.
 */
export function LiveRank() {
  const router = useRouter();
  const wait = useRef<number | undefined>(undefined);

  useEffect(() => {
    const refresh = () => {
      window.clearTimeout(wait.current);
      wait.current = window.setTimeout(() => router.refresh(), 400); // junta avisos seguidos
    };
    const supabase = createClient();
    const channel = supabase
      .channel("rank-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "rank_events" }, refresh)
      .subscribe();
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

  return null;
}
