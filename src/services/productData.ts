import { apiJson } from "@/services/api";

import type { DataFile } from "@/types/product";

const LATEST_URL = "/api/latest";

export function fetchLatestProducts(): Promise<DataFile> {
  return apiJson<DataFile>(LATEST_URL, {
    cache: "no-store",
  });
}