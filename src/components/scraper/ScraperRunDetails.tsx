import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  formatDate,
  formatStatus,
} from "@/components/scraper/ScraperSummary";

import type {
  RunMetadata,
} from "@/types/run";

import type {
  RunHealthInfo,
} from "@/utils/runHealth";


export function ScraperRunDetails({
  run,
  health,
}: {
  run: RunMetadata;
  health: RunHealthInfo;
}) {
  const rows = [
    ["Health", health.label],
    [
      "Run Status",
      formatStatus(run.status),
    ],
    [
      "Products Checked",
      String(run.total_products),
    ],
    [
      "Successful",
      String(run.successful),
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
    <Card>
      <CardHeader>
        <CardTitle>
          Latest Run
        </CardTitle>

        <CardDescription>
          Result summary from the most recent scraper execution.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        {rows.map(
          ([label, value]) => (
            <div
              key={label}
              className="
                flex items-center
                justify-between
                gap-6
                border-b
                px-6 py-4
                last:border-b-0
              "
            >
              <span className="text-sm text-muted-foreground">
                {label}
              </span>

              <span className="text-sm font-medium">
                {value}
              </span>
            </div>
          ),
        )}
      </CardContent>
    </Card>
  );
}