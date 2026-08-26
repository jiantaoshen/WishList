export const API_BASE_URL = "";

export interface ScraperStatus {
  running: boolean;
  process_id: number | null;
}


export async function fetchScraperStatus():
  Promise<ScraperStatus> {

  const response =
    await fetch(
      `${API_BASE_URL}/api/scraper/status`,
      {
        cache: "no-store",
      }
    );


  if (!response.ok) {
    throw new Error(
      `Failed to load scraper status: ${response.status}`
    );
  }


  return response.json();
}


export async function runScraper():
  Promise<void> {

  const response =
    await fetch(
      `${API_BASE_URL}/api/scraper/run`,
      {
        method: "POST",
      }
    );


  if (response.status === 409) {
    throw new Error(
      "Price checker is already running."
    );
  }


  if (!response.ok) {
    throw new Error(
      `Failed to start price checker: ${response.status}`
    );
  }
}