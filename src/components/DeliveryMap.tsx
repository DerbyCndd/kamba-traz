"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { Map as LMap, Marker, Polyline } from "leaflet";
import { createClient } from "@/lib/supabase/client";
import type { Position } from "@/lib/types";

type Ref = { map: LMap; marker: Marker; line: Polyline };

const ago = (iso: string, now: number) => {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  return s < 60 ? `há ${s} s` : s < 3600 ? `há ${Math.round(s / 60)} min` : `há ${Math.round(s / 3600)} h`;
};

/**
 * Mapa com a posição do entregador. Actualiza em directo (Realtime) e, por segurança, de 15 em 15 segundos.
 * Os mosaicos do mapa vêm do OpenStreetMap.
 */
export function DeliveryMap({ dealId, initial }: { dealId: string; initial: Position[] }) {
  const el = useRef<HTMLDivElement>(null);
  const ref = useRef<Ref | null>(null);
  const centered = useRef(false);
  const [first] = useState(initial); // só a posição inicial; as seguintes chegam em directo
  const [points, setPoints] = useState<Position[]>(initial);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState<number | null>(null); // só no browser, para o servidor e o browser mostrarem o mesmo ao início

  // cria o mapa (só no browser)
  useEffect(() => {
    let dead = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (dead || !el.current) return;
      const start = first.length ? ([first[first.length - 1].lat, first[first.length - 1].lng] as [number, number]) : ([-8.84, 13.23] as [number, number]); // Luanda, até chegar a 1.ª posição
      const map = L.map(el.current, { zoomControl: true }).setView(start, first.length ? 15 : 11);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map);
      const line = L.polyline([], { color: "#FFC52A", weight: 4, opacity: 0.9 }).addTo(map);
      const marker = L.marker(start, { icon: L.divIcon({ className: "pindot", html: "<span></span>", iconSize: [22, 22], iconAnchor: [11, 11] }) }).addTo(map);
      ref.current = { map, marker, line };
      setReady(true);
    })();
    return () => { dead = true; ref.current?.map.remove(); ref.current = null; setReady(false); };
  }, [first]);

  // desenha os pontos
  useEffect(() => {
    const r = ref.current;
    if (!ready || !r || !points.length) return;
    const ll = points.map((p) => [p.lat, p.lng] as [number, number]);
    r.line.setLatLngs(ll);
    r.marker.setLatLng(ll[ll.length - 1]);
    // Só aproxima na 1.ª posição; depois respeita o zoom de quem está a ver e acompanha só se o entregador sair da vista.
    const here = ll[ll.length - 1];
    if (!centered.current) { r.map.setView(here, Math.max(r.map.getZoom(), 15)); centered.current = true; }
    else if (!r.map.getBounds().contains(here)) r.map.panTo(here);
  }, [points, ready]);

  // em directo + reserva
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("pos-" + dealId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "delivery_positions", filter: `deal_id=eq.${dealId}` },
        (payload) => setPoints((p) => [...p, payload.new as Position].slice(-200)))
      .subscribe();
    const poll = window.setInterval(async () => {
      const { data } = await supabase.from("delivery_positions").select("id, lat, lng, accuracy, at").eq("deal_id", dealId).order("id", { ascending: false }).limit(200);
      if (data?.length) setPoints((data as Position[]).reverse());
    }, 15000);
    const t0 = window.setTimeout(() => setNow(Date.now()), 0);
    const tick = window.setInterval(() => setNow(Date.now()), 5000);
    return () => { window.clearTimeout(t0); window.clearInterval(poll); window.clearInterval(tick); supabase.removeChannel(channel); };
  }, [dealId]);

  const last = points[points.length - 1];
  return (
    <div className="mapbox">
      <div ref={el} className="map" aria-label="Mapa com a posição do entregador" />
      <p className="hint mapnote">
        {last ? (now === null ? "Última posição recebida." : `Última posição ${ago(last.at, now)}.`) : "À espera da primeira posição do entregador…"}
      </p>
    </div>
  );
}
