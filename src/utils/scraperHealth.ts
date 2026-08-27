import type { RunMetadata } from "../types/run";

export type ScraperHealthState =
  | "healthy"
  | "warning"
  | "failed"
  | "stale"
  | "unknown";

export interface ScraperHealthInfo {
  state: ScraperHealthState;
  label: string;
  dotClass: string;
  badgeClass: string;
  buttonClass: string;
}

const STALE_AFTER_DAYS = 8;
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

export function getScraperHealth(run: RunMetadata | null): ScraperHealthInfo {
  if (!run) {
    return {
    state: "unknown",
    label: "Unknown",
    dotClass: "bg-app-text-muted",
    badgeClass: "bg-surface-muted text-app-text-secondary",
    buttonClass: "border-app-border bg-surface-muted text-app-text-secondary hover:border-app-border-hover",
    };
  }

  // Failed always has highest priority
  if (run.status === "failed") {
    return {
    state: "failed",
    label: "Failed",
    dotClass: "bg-danger",
    badgeClass: "bg-danger-soft text-danger-text",
    buttonClass: "border-danger-border bg-danger-soft text-danger-text",
    };
  }

  const finishedAt =new Date(run.finished_at).getTime();

  if (Number.isNaN(finishedAt)) {
    return {
        state: "unknown",
        label: "Unknown",
        dotClass: "bg-app-text-muted",
        badgeClass: "bg-surface-muted text-app-text-secondary",
        buttonClass: "border-app-border bg-surface-muted text-app-text-secondary hover:border-app-border-hover",
    };
  }

  const ageMilliseconds = Math.max(0, Date.now() - finishedAt);
  const ageDays =ageMilliseconds / MILLISECONDS_PER_DAY;

  if (ageDays >STALE_AFTER_DAYS) {
    return {
        state: "stale",
        label: "Stale",
        dotClass: "bg-stale",
        badgeClass: "bg-stale-soft text-stale-text",
        buttonClass: "border-stale-border bg-stale-soft text-stale-text",
    };
  }


  if (run.status ==="degraded") {
    return {
        state: "warning",
        label: "Warning",
        dotClass: "bg-warning",
        badgeClass: "bg-warning-soft text-warning-text",
        buttonClass: "border-warning-border bg-warning-soft text-warning-text",
    };
  }

  return {
    state: "healthy",
    label: "Healthy",
    dotClass: "bg-success",
    badgeClass: "bg-success-soft text-success-text",
    buttonClass: "border-success-border bg-success-soft text-success-text",
  };
}