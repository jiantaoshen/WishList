import {
  useEffect,
  useState,
} from "react";

import {
  LoaderCircle,
  Play,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  fetchScraperStatus,
  runScraper,
} from "@/services/scraperApi";


interface RunNowButtonProps {
  onCompleted?: () =>
    void | Promise<void>;
}


// =============================================================
// Run Now Button
// =============================================================

export function RunNowButton({
  onCompleted,
}: RunNowButtonProps) {
  const [
    running,
    setRunning,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );


  // =========================================================
  // Initial Status
  // =========================================================

  useEffect(() => {
    async function checkStatus() {
      try {
        const status =
          await fetchScraperStatus();

        setRunning(
          status.running,
        );
      }
      catch (exception) {
        console.error(
          "Failed to load scraper status:",
          exception,
        );
      }
    }


    void checkStatus();
  }, []);


  // =========================================================
  // Poll While Running
  // =========================================================

  useEffect(() => {
    if (!running) {
      return;
    }


    const interval =
      window.setInterval(
        async () => {
          try {
            const status =
              await fetchScraperStatus();


            if (!status.running) {
              setRunning(false);

              window.clearInterval(
                interval,
              );


              if (onCompleted) {
                try {
                  await onCompleted();
                }
                catch (exception) {
                  console.error(
                    "Failed to refresh dashboard:",
                    exception,
                  );
                }
              }

              return;
            }


            setRunning(true);
          }
          catch (exception) {
            console.error(
              "Failed to check scraper status:",
              exception,
            );
          }
        },
        2000,
      );


    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, [
    running,
    onCompleted,
  ]);


  // =========================================================
  // Run Now
  // =========================================================

  async function handleRun() {
    if (running) {
      return;
    }


    setError(null);


    try {
      await runScraper();

      setRunning(true);
    }
    catch (exception) {
      setError(
        getErrorMessage(
          exception,
          "Failed to start price checker.",
        ),
      );
    }
  }


  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="sm"
        disabled={running}
        onClick={() => {
          void handleRun();
        }}
      >
        {running ? (
          <>
            <LoaderCircle
              className="animate-spin"
            />

            Checking...
          </>
        ) : (
          <>
            <Play />

            Run now
          </>
        )}
      </Button>


      {error && (
        <p
          className="
            max-w-sm
            text-xs
            text-destructive
          "
        >
          {error}
        </p>
      )}
    </div>
  );
}


// =============================================================
// Error
// =============================================================

function getErrorMessage(
  exception: unknown,
  fallback: string,
): string {
  if (
    exception instanceof Error &&
    exception.message
  ) {
    return exception.message;
  }

  return fallback;
}