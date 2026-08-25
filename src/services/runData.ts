import type {
  RunMetadata,
} from "../types/run";


export async function fetchLatestRun():
  Promise<RunMetadata> {

  const response = await fetch(
    "/data/runs/latest.json",
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load latest run: ${response.status}`,
    );
  }

  return response.json();
}