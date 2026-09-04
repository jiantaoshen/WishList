export const API_BASE_URL = "";

export interface ProductSource {
  store: string;
  url: string;
}


export interface ProductConfig {
  id: string;
  name: string;

  sources: ProductSource[];

  target_price: number;
  currency: string;

  // Temporary backward compatibility
  // for old products using "url"
  url?: string;
}


export type ProductConfigInput = Omit<ProductConfig, "id">;

// =============================================================
// Fetch
// =============================================================

export async function fetchProductConfigs(): Promise<ProductConfig[]> {

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
        "Content-Type": "application/json",
      },

      body: JSON.stringify(product),
    },
  );

  if (!response.ok) {
    const text = await response.text();

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
        "Content-Type": "application/json",
      },

      body: JSON.stringify(product),
    },
  );

  if (!response.ok) {
    const text = await response.text();

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