export interface Product {
  product_id: string;
  name: string;
  url: string;
  target_price: number;
  current_price: number;
  previous_price: number;
  below_target: boolean;
  difference: number;
}

export interface DataFile {
  period: string;
  generated_at: string;
  data: Product[];
}

export interface HistoryIndex {
  periods: string[];
}