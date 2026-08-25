export type RunStatus =
  | "success"
  | "degraded"
  | "failed";

export interface RunMetadata {
  run_id: string;
  started_at: string;
  finished_at: string;
  duration_seconds: number;

  status: RunStatus;

  total_products: number;
  successful: number;
  failed: number;
  suspicious: number;
}