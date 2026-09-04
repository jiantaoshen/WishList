export interface ProductError {
  type: string;
  message: string;
}
export interface ProductOffer {
  store: string;
  url: string;
  price: number;
}


export interface Product {
  product_id: string;
  name: string;

  // Older history files may not contain these fields
  store?: string | null;
  url: string;

  target_price: number;

  status:
    | "success"
    | "failed"
    | "suspicious";

  current_price: number | null;
  previous_price: number | null;

  below_target: boolean | null;
  difference: number | null;

  currency: string;

  // Older history files may not contain offers
  offers?: ProductOffer[];

  error?: {
    type: string;
    message: string;
  } | null;
}


export interface DataFile {
  period: string;
  generated_at: string;
  data: Product[];
}


export interface HistoryIndex {
  periods: string[];
}