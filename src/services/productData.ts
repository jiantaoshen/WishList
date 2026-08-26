import type {
  DataFile,
} from "../types";


export const API_BASE_URL = "";


export async function fetchProducts():
  Promise<DataFile | null> {

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