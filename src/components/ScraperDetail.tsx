import type { RunMetadata } from "../types/run";

interface ScraperDetailProps {
  run: RunMetadata | null;
  onBack: () => void;
}

export function ScraperDetail({
  run,
  onBack,
}: ScraperDetailProps) {

  return (
    <div className="min-h-screen bg-gray-50">

      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-5 py-5 sm:px-6">

          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-900"
          >
            ← Back to Dashboard
          </button>

        </div>
      </header>


      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-6">

        <div className="mb-8">

          <h1 className="text-2xl font-bold text-gray-900">
            Scraper Details
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Status and information from the latest price check.
          </p>

        </div>


        {!run ? (

          <div className="rounded-2xl border bg-white p-6">

            <p className="font-medium text-gray-900">
              No scraper run available
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Run the price checker to generate scraper information.
            </p>

          </div>

        ) : (

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <DetailCard
              label="Status"
              value={run.status}
            />

            <DetailCard
              label="Successful"
              value={`${run.successful} / ${run.total_products}`}
            />

            <DetailCard
              label="Failed"
              value={String(run.failed)}
            />

            <DetailCard
              label="Suspicious"
              value={String(run.suspicious)}
            />

            <DetailCard
              label="Duration"
              value={`${run.duration_seconds.toFixed(1)} s`}
            />

            <DetailCard
              label="Last Checked"
              value={
                new Date(
                  run.finished_at,
                ).toLocaleString()
              }
            />

          </div>

        )}

      </main>

    </div>
  );
}


function DetailCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">

      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-lg font-semibold text-gray-900">
        {value}
      </p>

    </div>
  );
}