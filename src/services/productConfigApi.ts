import { apiJson, jsonRequest } from "@/services/api";


const PRODUCTS_URL = "/api/product-config";


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


export async function fetchProductConfigs(): Promise<ProductConfig[]> {
  const products = await apiJson<ProductConfig[]>(PRODUCTS_URL, {
    cache: "no-store",
  });

  if (!Array.isArray(products)) {
    throw new Error("Invalid product configuration response.");
  }

  return products.map(normalizeProduct);
}


export async function createProductConfig(
  input: ProductConfigInput,
): Promise<ProductConfig> {
  const product = await apiJson<ProductConfig>(
    PRODUCTS_URL,
    jsonRequest("POST", input),
  );

  return normalizeProduct(product);
}


export async function updateProductConfig(
  id: string,
  input: ProductConfigInput,
): Promise<ProductConfig> {
  const product = await apiJson<ProductConfig>(
    `${PRODUCTS_URL}/${encodeURIComponent(id)}`,
    jsonRequest("PUT", input),
  );

  return normalizeProduct(product);
}


export async function deleteProductConfig(id: string): Promise<void> {
  await apiJson<void>(
    `${PRODUCTS_URL}/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}


function normalizeProduct(product: ProductConfig): ProductConfig {
  const raw = product as ProductConfig & {
    Id?: string;
    product_id?: string;
    productId?: string;
  };

  const id =
    product.id ??
    raw.Id ??
    raw.product_id ??
    raw.productId;

  if (!id) {
    throw new Error(`Product "${product.name}" has no ID.`);
  }

  return {
    ...product,
    id,
  };
}