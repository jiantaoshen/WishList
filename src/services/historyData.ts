import { apiJson, apiJsonOr } from "@/services/api";

import type { DataFile, HistoryIndex } from "@/types/product";


const HISTORY_URL = "/api/history";


export function fetchHistoryIndex(): Promise<HistoryIndex> {
  return apiJsonOr<HistoryIndex>(HISTORY_URL, { periods: [] });
}


export function fetchHistoryPeriod(period: string): Promise<DataFile> {
  return apiJson<DataFile>(
    `${HISTORY_URL}/${encodeURIComponent(period)}`,
    { cache: "no-store" },
  );
}