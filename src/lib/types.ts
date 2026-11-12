export type Config = { commission: number; per_kg: number; whatsapp: string };

export type TripPub = {
  id: string; origin: string; destination: string; travel_date: string;
  kg: number; per_kg: number; name: string; status: string; example: boolean;
};
export type ReqPub = {
  id: string; origin: string; destination: string; item: string; category: string;
  kg: number; offer: number; deadline: string | null; name: string; status: string; example: boolean;
};

// Linhas completas (só o dono e a equipa as vêem).
export type Trip = TripPub & { user_id: string; contact: string; flight: string; created_at: string };
export type Req = ReqPub & { user_id: string; contact: string; item_value: number; created_at: string };

export type Deal = {
  id: string; request_id: string | null; trip_id: string | null; label: string; traveler: string; requester: string;
  price: number; commission_pct: number; commission: number; status: string; created_at: string;
};

export type FormState = {
  errors: Record<string, string>;
  values: Record<string, string>;
  formError?: string;
  done?: { ref: string; summary: string; kind: "trip" | "request" };
};
export const emptyForm: FormState = { errors: {}, values: {} };
