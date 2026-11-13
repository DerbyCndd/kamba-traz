export type Config = { commission: number; per_kg: number; whatsapp: string };

// rating e rating_count vêm das vistas depois de correr supabase/ratings.sql (antes disso não existem).
export type TripPub = {
  id: string; origin: string; destination: string; travel_date: string;
  kg: number; per_kg: number; name: string; status: string; example: boolean;
  rating?: number | null; rating_count?: number;
};
export type ReqPub = {
  id: string; origin: string; destination: string; item: string; category: string;
  kg: number; offer: number; deadline: string | null; name: string; status: string; example: boolean;
  rating?: number | null; rating_count?: number;
};

export type RatingRole = "traveler" | "requester";
export type TopEntry = { first_name: string; avg_stars: number; total: number };
export type PendingRating = { deal_id: string; label: string; counterpart: string; ratee_role: RatingRole };
export type RatingSummary = { ratee_role: RatingRole; avg_stars: number; total: number };
export type RateState = { error?: string; done?: boolean };

export type TripPreview = Omit<TripPub, "id" | "name">;
export type ReqPreview = Omit<ReqPub, "id" | "name" | "item">;

// Linhas completas (só o dono e a equipa as vêem).
export type Trip = TripPub & { user_id: string; contact: string; flight: string; created_at: string; return_date?: string | null };

/** Documentos do viajante, sem o passaporte nem o caminho da foto (esses só passam por acções da equipa). */
export type TravelerDocView = {
  trip_id: string; full_name: string; passport_last4: string; outbound_date: string; return_date: string;
  status: "pendente" | "confirmado" | "recusado"; created_at: string;
};
export type Req = ReqPub & { user_id: string; contact: string; item_value: number; created_at: string };

export type Deal = {
  id: string; request_id: string | null; trip_id: string | null; label: string; traveler: string; requester: string;
  price: number; commission_pct: number; commission: number; status: string; created_at: string;
  fee_waived?: boolean;
  sender_id?: string | null; traveler_id?: string | null;
  funded_at?: string | null; picked_up_at?: string | null; delivered_at?: string | null;
};

export type Position = { id: number; lat: number; lng: number; accuracy: number | null; at: string };
export type Wallet = { held: number; to_receive: number; received: number; refunded: number; paid: number };
export type LedgerRow = { id: number; kind: "retido" | "a_receber" | "libertado" | "recebido" | "reembolso" | "comissao"; amount: number; note: string; created_at: string; deal_id: string | null };

export type Winner = { role: RatingRole; first_name: string };
export type WaiverHolder = { user_id: string; role: RatingRole; first_name: string };

export type FormState = {
  errors: Record<string, string>;
  values: Record<string, string>;
  formError?: string;
  done?: { ref: string; summary: string; kind: "trip" | "request" };
};
export const emptyForm: FormState = { errors: {}, values: {} };
