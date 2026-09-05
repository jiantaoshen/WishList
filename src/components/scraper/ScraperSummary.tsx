import {
  Card,
  CardContent,
} from "@/components/ui/card";

import type {
  RunMetadata,
} from "@/types/run";


export function ScraperSummary({
  run,
}: {
  run: RunMetadata;
}) {
  const items = [
    [
      "Status",
      formatStatus(run.status),
    ],
    [
      "Successful",
      `${run.successful} / ${run.total_products}`,
    ],
    [
      "Failed",
      String(run.failed),
    ],
    [
      "Suspicious",
      String(run.suspicious),
    ],
    [
      "Duration",
      `${run.duration_seconds.toFixed(1)} s`,
    ],
    [
      "Last Checked",
      formatDate(
        run.finished_at,
      ),
    ],
  ];


  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(
        ([label, value]) => (
          <Card key={label}>
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">
                {label}
              </p>

              <p className="mt-2 text-xl font-semibold">
                {value}
              </p>
            </CardContent>
          </Card>
        ),
      )}
    </div>
  );
}


export function formatStatus(
  status: RunMetadata["status"],
) {
  switch (status) {
    case "success":
      return "Success";

    case "degraded":
      return "Degraded";

    case "failed":
      return "Failed";
  }
}


export function formatDate(
  value: string,
) {
  const date =
    new Date(value);

  return Number.isNaN(
    date.getTime(),
  )
    ? "Unknown"
    : date.toLocaleString();
}