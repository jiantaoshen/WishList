import type { RunMetadata } from "../types/run";
import { getScraperHealth } from "../utils/scraperHealth";


interface ScraperDetailProps {
  run: RunMetadata | null;
}

interface DetailItemProps {
  label: string;
  value: string;
}


// =============================================================
// Scraper Detail
// =============================================================

export function ScraperDetail({
  run,
}: ScraperDetailProps) {

  const scraperHealth =
    getScraperHealth(
      run,
    );


  const lastCheckedDate =
    run
      ? new Date(
          run.finished_at,
        )
      : null;


  const hasValidLastChecked =
    lastCheckedDate !== null &&
    !Number.isNaN(
      lastCheckedDate.getTime(),
    );


  const lastChecked =
    hasValidLastChecked &&
    lastCheckedDate
      ? lastCheckedDate.toLocaleString()
      : "Unknown";


  return (
    <>

      {/* Header */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div>
          <h1 className="app-page-title">
            Scraper Details
          </h1>

          <p className="app-body mt-1">
            Status and information from the latest price check.
          </p>
        </div>


        <span className={`app-card-tag px-3 py-1.5 ${scraperHealth.badgeClass}`}>
          <span className={`mr-2 h-2 w-2 rounded-full ${scraperHealth.dotClass}`} />
          {scraperHealth.label}
        </span>

      </div>


      {!run ? (

        <div className="app-card-dashed px-6 py-14 text-center">

          <h2 className="app-section-title">
            No scraper runs yet
          </h2>

          <p className="app-body mt-2">
            Run the price checker to generate scraper information.
          </p>

        </div>

      ) : (

        <>

          {/* Summary */}

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <DetailCard
              label="Run Status"
              value={formatRunStatus(
                run.status,
              )}
            />

            <DetailCard
              label="Successful"
              value={`${run.successful} / ${run.total_products}`}
            />

            <DetailCard
              label="Failed"
              value={String(
                run.failed,
              )}
            />

            <DetailCard
              label="Suspicious"
              value={String(
                run.suspicious,
              )}
            />

            <DetailCard
              label="Duration"
              value={`${run.duration_seconds.toFixed(1)} s`}
            />

            <DetailCard
              label="Last Checked"
              value={lastChecked}
            />

          </div>


          {/* Latest Run */}

          <div className="app-card overflow-hidden">

            <div className="border-b border-app-border px-5 py-4">

              <h2 className="app-section-title">
                Latest Run
              </h2>

              <p className="app-body mt-1">
                Result summary from the most recent scraper execution.
              </p>

            </div>


            <div className="divide-y divide-app-border">

              <DetailRow
                label="Health"
                value={scraperHealth.label}
              />

              <DetailRow
                label="Run Status"
                value={formatRunStatus(
                  run.status,
                )}
              />

              <DetailRow
                label="Products Checked"
                value={String(
                  run.total_products,
                )}
              />

              <DetailRow
                label="Successful"
                value={String(
                  run.successful,
                )}
              />

              <DetailRow
                label="Failed"
                value={String(
                  run.failed,
                )}
              />

              <DetailRow
                label="Suspicious"
                value={String(
                  run.suspicious,
                )}
              />

              <DetailRow
                label="Duration"
                value={`${run.duration_seconds.toFixed(1)} s`}
              />

              <DetailRow
                label="Last Checked"
                value={lastChecked}
              />

            </div>

          </div>

        </>

      )}

    </>
  );
}


// =============================================================
// Run Status
// =============================================================

function formatRunStatus(
  status: RunMetadata["status"],
): string {

  switch (status) {

    case "success":
      return "Success";

    case "degraded":
      return "Degraded";

    case "failed":
      return "Failed";

    default:
      return String(
        status,
      );
  }
}


// =============================================================
// Detail Card
// =============================================================

function DetailCard({label, value}: DetailItemProps) {

  return (
    <div className="app-card p-5">

      <p className="app-card-title">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold text-app-text">
        {value}
      </p>

    </div>
  );
}


// =============================================================
// Detail Row
// =============================================================
function DetailRow({label, value}: DetailItemProps) {
  return (
    <div className="flex items-center justify-between gap-6 px-5 py-4">

      <span className="app-body">
        {label}
      </span>

      <span className="text-right text-sm font-medium text-app-text">
        {value}
      </span>

    </div>
  );
}