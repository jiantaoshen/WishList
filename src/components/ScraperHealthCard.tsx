import type { RunMetadata } from "../types/run";

interface ScraperHealthCardProps {
  run: RunMetadata | null;
}

type HealthState =
  | "healthy"
  | "warning"
  | "failed"
  | "stale";

const STALE_AFTER_DAYS = 8;

const MILLISECONDS_PER_DAY =
  1000 * 60 * 60 * 24;

// ============================================================
// Health state
// ============================================================
function getHealthState(run: RunMetadata): HealthState {

  // Failed always has highest priority
  if (run.status === "failed") {
    return "failed";
  }

  const finishedAt = new Date(run.finished_at);
  const finishedAtMilliseconds = finishedAt.getTime();

  if (Number.isNaN(finishedAtMilliseconds)) {
    return "warning";
  }

  const ageMilliseconds = Date.now() - finishedAtMilliseconds;
  const ageDays = ageMilliseconds / MILLISECONDS_PER_DAY;

  if (ageDays > STALE_AFTER_DAYS
  ) {
    return "stale";
  }

  if (run.status ==="degraded") {
    return "warning";
  }

  return "healthy";
}


// ============================================================
// Label
// ============================================================

function getHealthLabel(
  health: HealthState,
): string {

  switch (health) {

    case "healthy":
      return "Healthy";

    case "warning":
      return "Warning";

    case "failed":
      return "Failed";

    case "stale":
      return "Stale";
  }
}


// ============================================================
// Badge classes
// ============================================================

function getHealthClasses(health: HealthState): string {
  switch (health) {
    case "healthy":
      return "bg-green-100 text-green-700";

    case "warning":
      return "bg-yellow-100 text-yellow-700";

    case "failed":
      return "bg-red-100 text-red-700";

    case "stale":
      return "bg-orange-100 text-orange-700";
  }
}


// ============================================================
// Component
// ============================================================
export function ScraperHealthCard({run}: ScraperHealthCardProps) {
  if (!run) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

        <p className="text-sm text-gray-500">
          Scraper
        </p>

        <p className="mt-2 font-semibold text-gray-700">
          Unknown
        </p>

        <p className="mt-1 text-xs text-gray-400">
          No run data available
        </p>

      </div>
    );
  }


  const health = getHealthState(run);

  const lastCheckedDate =new Date(run.finished_at,);
  const lastCheckedMilliseconds =lastCheckedDate.getTime();
  const hasValidLastChecked =!Number.isNaN(lastCheckedMilliseconds,);
  const lastChecked =hasValidLastChecked ? lastCheckedDate.toLocaleString() : "Unknown";
  const ageMilliseconds = hasValidLastChecked ? Math.max(0,Date.now() - lastCheckedMilliseconds) : null;
  const ageDays = ageMilliseconds !== null ? Math.floor(ageMilliseconds /MILLISECONDS_PER_DAY): null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <p className="text-sm font-medium text-gray-500">
          Scraper
        </p>

        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getHealthClasses(health)}`}>
          {getHealthLabel(health)}
        </span>
      </div>


      <p className="mt-3 text-lg font-semibold text-gray-900">
        {run.successful}
        {" / "}
        {run.total_products}
        {" successful"}
      </p>


      <p className="mt-1 text-sm text-gray-500">
        {run.failed} failed ·{" "}
        {run.suspicious} suspicious
      </p>


      <p className="mt-3 text-xs text-gray-400">
        Last checked:{" "}
        {lastChecked}
      </p>


      <p className="mt-1 text-xs text-gray-400">
        {ageDays === null
          ? "Update time unavailable"
          : ageDays === 0
            ? "Updated today"
            : `${ageDays} day${
                ageDays === 1
                  ? ""
                  : "s"
              } ago`}
      </p>


      <p className="mt-1 text-xs text-gray-400">
        Duration:{" "}
        {run.duration_seconds.toFixed(
          1,
        )}
        s
      </p>


      {health === "stale" && (
        <p className="mt-3 text-xs font-medium text-orange-600">
          Price data may be outdated.
        </p>
      )}

    </div>
  );
}