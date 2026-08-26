import type {
  DataFile,
} from "../types/product";


export const API_BASE_URL = "";


export async function fetchProducts():Promise<DataFile> {

  const response = await fetch(
    `${API_BASE_URL}/api/products`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load products: ${response.status}`,
    );
  }

  return response.json();
}