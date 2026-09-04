import type {
  RunMetadata,
} from "@/types/run";


export type RunHealthState =
  | "healthy"
  | "warning"
  | "failed"
  | "stale"
  | "unknown";


export interface RunHealthInfo {
  state: RunHealthState;
  label: string;
}


const STALE_AFTER_DAYS = 8;

const MILLISECONDS_PER_DAY =
  1000 * 60 * 60 * 24;


// =============================================================
// Run Health
// =============================================================

export function getRunHealth(
  run: RunMetadata | null,
): RunHealthInfo {
  if (!run) {
    return {
      state: "unknown",
      label: "Unknown",
    };
  }


  // Failed always has
  // highest priority.
  if (run.status === "failed") {
    return {
      state: "failed",
      label: "Failed",
    };
  }


  const finishedAt =
    new Date(
      run.finished_at,
    ).getTime();


  if (
    Number.isNaN(
      finishedAt,
    )
  ) {
    return {
      state: "unknown",
      label: "Unknown",
    };
  }


  const ageMilliseconds =
    Math.max(
      0,
      Date.now() - finishedAt,
    );


  const ageDays =
    ageMilliseconds /
    MILLISECONDS_PER_DAY;


  // A successful/degraded run
  // can still become stale.
  if (
    ageDays >
    STALE_AFTER_DAYS
  ) {
    return {
      state: "stale",
      label: "Stale",
    };
  }


  if (
    run.status === "degraded"
  ) {
    return {
      state: "warning",
      label: "Warning",
    };
  }


  return {
    state: "healthy",
    label: "Healthy",
  };
}