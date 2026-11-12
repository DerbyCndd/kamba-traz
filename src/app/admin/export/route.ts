import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// CSV das entregas, só para a equipa.
export async function GET() {
  const profile = await getProfile();
  if (profile?.role !== "admin") return new Response("Não autorizado", { status: 403 });

  const supabase = await createClient();
  const { data } = await supabase.from("deals").select("*").order("created_at", { ascending: false });

  const safe = (v: unknown) => {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // evita fórmulas no Excel
    return '"' + s.replace(/"/g, '""') + '"';
  };
  const rows = [["data", "pedido", "viajante", "cliente", "valor_kz", "comissao_kz", "estado"]].concat(
    (data ?? []).map((d) => [String(d.created_at).slice(0, 10), d.label, d.traveler, d.requester, d.price, d.commission, d.status].map(String)),
  );
  const body = "﻿" + rows.map((r) => r.map(safe).join(",")).join("\n");
  return new Response(body, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="entregas-kamba.csv"' },
  });
}
