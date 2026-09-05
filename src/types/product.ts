export interface ProductOffer {
  store: string;
  url: string;

  price: number;

  price_source?: "scrape" | "manual";

  unit_quantity?: number | null;

  comparison_price?: number | null;

  unit_price?: number | null;

  note?: string | null;
}


export interface ProductError {
  type: string;
  message: string;
}


export interface Product {
  product_id: string;
  name: string;

  // =========================================================
  // Cheapest total
  // =========================================================

  url: string;

  // Optional for old history
  store?: string | null;

  target_price: number;

  current_price: number | null;
  previous_price: number | null;

  below_target: boolean | null;
  difference: number | null;

  // =========================================================
  // Cheapest unit price
  // =========================================================

  unit?: string | null;

  unit_url?: string | null;
  unit_store?: string | null;

  target_unit_price?: number | null;

  current_unit_price?: number | null;
  previous_unit_price?: number | null;

  unit_below_target?: boolean | null;
  unit_difference?: number | null;

  // =========================================================
  // General
  // =========================================================

  status:
    | "not_run"
    | "success"
    | "failed"
    | "suspicious";

  comparison_quantity?: number | null;

  currency: string;

  // Optional for old history
  offers?: ProductOffer[];

  error?: ProductError | null;
}


export interface DataFile {
  period: string;
  generated_at: string;
  data: Product[];
}


export interface HistoryIndex {
  periods: string[];
}