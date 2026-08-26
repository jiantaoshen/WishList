import type {
  DataFile,
  HistoryIndex,
} from "../types/product";


export const API_BASE_URL = "";


export async function fetchHistoryIndex():
  Promise<HistoryIndex> {

  const response = await fetch(
    `${API_BASE_URL}/api/history`,
    {
      cache: "no-store",
    },
  );

  
  if (response.status === 404) {
    return {
      periods: [],
    };
  }

  if (!response.ok) {
    throw new Error(
      `Failed to load history index: ${response.status}`
    );
  }

  return response.json();
}


export async function fetchHistoryPeriod(
  period: string,
): Promise<DataFile> {

  const response = await fetch(
    `${API_BASE_URL}/api/history/${encodeURIComponent(
      period
    )}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load history period ${period}: ${response.status}`
    );
  }

  return response.json();
}