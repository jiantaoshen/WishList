export const API_BASE_URL = "";

export interface ProductConfig {
  id: string;
  name: string;
  url: string;
  target_price: number;
  currency: string;
}


export async function fetchProductConfigs():
  Promise<ProductConfig[]> {

  const response = await fetch(
    `${API_BASE_URL}/api/product-config`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load product configuration: ${response.status}`
    );
  }

  return response.json();
}


export async function createProductConfig(
  product: ProductConfig,
): Promise<ProductConfig> {

  const response = await fetch(
    `${API_BASE_URL}/api/product-config`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(product),
    }
  );

  if (!response.ok) {
    const text =
      await response.text();

    throw new Error(
      text ||
      `Failed to create product: ${response.status}`
    );
  }

  return response.json();
}


export async function updateProductConfig(
  id: string,
  product: ProductConfig,
): Promise<ProductConfig> {

  const response = await fetch(
    `${API_BASE_URL}/api/product-config/${encodeURIComponent(
      id
    )}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(product),
    }
  );

  if (!response.ok) {
    const text =
      await response.text();

    throw new Error(
      text ||
      `Failed to update product: ${response.status}`
    );
  }

  return response.json();
}


export async function deleteProductConfig(
  id: string,
): Promise<void> {

  const response = await fetch(
    `${API_BASE_URL}/api/product-config/${encodeURIComponent(
      id
    )}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to delete product: ${response.status}`
    );
  }
}