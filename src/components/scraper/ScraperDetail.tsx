import {
  Card,
  CardContent,
} from "@/components/ui/card";

import {
  ScraperHealthBadge,
} from "@/components/scraper/ScraperHealthBadge";

import {
  ScraperRunDetails,
} from "@/components/scraper/ScraperRunDetails";

import {
  ScraperSummary,
} from "@/components/scraper/ScraperSummary";

import {
  getRunHealth,
} from "@/utils/runHealth";

import type {
  RunMetadata,
} from "@/types/run";


export function ScraperDetail({
  run,
}: {
  run: RunMetadata | null;
}) {
  const health =
    getRunHealth(run);


  if (!run) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-14 text-center">
          <h2 className="font-semibold">
            No scraper runs yet
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Run the price checker to generate scraper information.
          </p>
        </CardContent>
      </Card>
    );
  }


  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Scraper Details
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Status and information from the latest price check.
          </p>
        </div>

        <ScraperHealthBadge
          health={health}
        />
      </div>

      <ScraperSummary
        run={run}
      />

      <ScraperRunDetails
        run={run}
        health={health}
      />
    </div>
  );
}