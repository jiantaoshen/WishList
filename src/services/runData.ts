import type {
  RunMetadata,
} from "../types/run";


export const API_BASE_URL = "";


export async function fetchLatestRun():
  Promise<RunMetadata | null> {

  const response = await fetch(
    `${API_BASE_URL}/api/runs/latest`,
    {
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Failed to load latest run: ${response.status}`
    );
  }

  return response.json();
}