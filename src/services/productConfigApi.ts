import { apiJson, jsonRequest } from "@/services/api";


export const API_BASE_URL = "";


// =============================================================
// Types
// =============================================================

export interface ProductSource {
  store: string;
  url: string;
  scraping_enabled?: boolean;
  manual_price?: number | null;
  unit_quantity: number | null;
  note: string | null;
}


export interface ProductConfig {
  id: string;
  name: string;
  scraping_enabled?: boolean;
  comparison_quantity?: number | null;
  sources: ProductSource[];
  target_price: number;
  target_unit_price: number | null;
  unit: string | null;
  currency: string;
  url?: string;
}


export interface ProductSourceInput {
  store: string;
  url: string;
  scraping_enabled: boolean;
  manual_price: number | null;
  unit_quantity: number | null;
  note: string | null;
}


export interface ProductConfigInput {
  name: string;
  scraping_enabled: boolean;
  comparison_quantity: number | null;
  sources: ProductSourceInput[];
  target_price: number;
  target_unit_price: number | null;
  unit: string | null;
  currency: string;
}


// =============================================================
// API
// =============================================================

const PRODUCTS_URL = `${API_BASE_URL}/api/products`;

export async function fetchProductConfigs(): Promise<ProductConfig[]> {
  const result = await apiJson<unknown>(PRODUCTS_URL);

  if (Array.isArray(result)) return result as ProductConfig[];

  if (result && typeof result === "object") {
    const data = result as Record<string, unknown>;

    if (Array.isArray(data.products)) return data.products as ProductConfig[];
    if (Array.isArray(data.data)) return data.data as ProductConfig[];
  }

  throw new Error("Invalid products response: expected an array.");
}

export function createProductConfig(
  input: ProductConfigInput,
): Promise<ProductConfig> {
  return apiJson<ProductConfig>(
    PRODUCTS_URL,
    jsonRequest("POST", input),
  );
}


export function updateProductConfig(
  id: string,
  input: ProductConfigInput,
): Promise<ProductConfig> {
  return apiJson<ProductConfig>(
    `${PRODUCTS_URL}/${encodeURIComponent(id)}`,
    jsonRequest("PUT", input),
  );
}


export async function deleteProductConfig(id: string): Promise<void> {
  await apiJson<void>(
    `${PRODUCTS_URL}/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    },
  );
}