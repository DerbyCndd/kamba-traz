import { requireAdmin } from "@/lib/auth";
import { loadPilotMetrics } from "@/lib/match-data";
import { metricsCsv } from "@/lib/metrics";

/** Exporta as métricas do piloto em CSV (só a equipa). Os eventos não têm dados pessoais. */
export async function GET() {
  const { supabase } = await requireAdmin();
  const { metrics, events } = await loadPilotMetrics(supabase);
  const day = new Date().toISOString().slice(0, 10);
  return new Response(metricsCsv(metrics, events), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kamba-traz-metricas-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
