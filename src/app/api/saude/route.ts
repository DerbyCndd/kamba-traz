import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Para um serviço de monitorização (ver README): responde 200 se o site e a base de dados estão a funcionar, 503 se não. Não expõe dados. */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("public_pricing");
    if (error || !data) throw new Error("db");
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
