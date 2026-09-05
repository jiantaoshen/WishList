export const API_BASE_URL = "";

export interface ProductSource {
  store: string;
  url: string;

  // Optional only for old JSON/API compatibility.
  scraping_enabled?: boolean;

  manual_price?: number | null;

  unit_quantity: number | null;
  note: string | null;
}


export interface ProductConfig {
  id: string;
  name: string;

  scraping_enabled?: boolean;

  comparison_quantity?:
    number | null;

  sources: ProductSource[];

  target_price: number;

  target_unit_price:
    number | null;

  unit: string | null;

  currency: string;

  // Old single-URL product compatibility.
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

  comparison_quantity:
    number | null;

  sources:
    ProductSourceInput[];

  target_price: number;

  target_unit_price:
    number | null;

  unit: string | null;

  currency: string;
}

// =============================================================
// Fetch
// =============================================================

export async function fetchProductConfigs():
Promise<ProductConfig[]> {

  const response = await fetch(
    `${API_BASE_URL}/api/product-config`,
    {
      cache: "no-store",
    },
  );


  if (!response.ok) {

    throw new Error(
      `Failed to load product configuration: ${response.status}`,
    );

  }


  return response.json();
}


// =============================================================
// Create
// =============================================================

export async function createProductConfig(
  product: ProductConfigInput,
): Promise<ProductConfig> {

  const response = await fetch(
    `${API_BASE_URL}/api/product-config`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(
        product
      ),
    },
  );


  if (!response.ok) {

    const text =
      await response.text();


    throw new Error(
      text ||
      `Failed to create product: ${response.status}`,
    );

  }


  return response.json();
}


// =============================================================
// Update
// =============================================================

export async function updateProductConfig(
  id: string,
  product: ProductConfigInput,
): Promise<ProductConfig> {

  const response = await fetch(
    `${API_BASE_URL}/api/product-config/${encodeURIComponent(id)}`,
    {
      method: "PUT",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(
        product
      ),
    },
  );


  if (!response.ok) {

    const text =
      await response.text();


    throw new Error(
      text ||
      `Failed to update product: ${response.status}`,
    );

  }


  return response.json();
}


// =============================================================
// Delete
// =============================================================

export async function deleteProductConfig(
  id: string,
): Promise<void> {

  const response = await fetch(
    `${API_BASE_URL}/api/product-config/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    },
  );


  if (!response.ok) {

    throw new Error(
      `Failed to delete product: ${response.status}`,
    );

  }
}