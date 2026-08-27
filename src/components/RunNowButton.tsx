import {useEffect, useState} from "react";
import {fetchScraperStatus, runScraper} from "../services/scraperApi";

interface RunNowButtonProps {
  onCompleted?: () =>
    void | Promise<void>;
}

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
    null
  );


  // =========================================================
  // Initial status
  // =========================================================

  useEffect(() => {

    async function checkStatus() {

      try {

        const status =
          await fetchScraperStatus();

        setRunning(
          status.running
        );

      } catch (error) {

        console.error(
          "Failed to load scraper status:",
          error
        );
      }
    }


    checkStatus();

  }, []);


  // =========================================================
  // Poll while scraper is running
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


            // ---------------------------------------------
            // Scraper finished
            // ---------------------------------------------

            if (!status.running) {

              setRunning(
                false
              );

              window.clearInterval(
                interval
              );


              if (onCompleted) {

                try {

                  await onCompleted();

                } catch (error) {

                  console.error(
                    "Failed to refresh dashboard:",
                    error
                  );
                }
              }

              return;
            }


            setRunning(
              true
            );

          } catch (error) {

            console.error(
              "Failed to check scraper status:",
              error
            );
          }

        },
        2000
      );


    return () => {
      window.clearInterval(interval);
    };

  }, [
    running,
    onCompleted,
  ]);


  // =========================================================
  // Run Now
  // =========================================================

  async function handleRun() {

    setError(
      null
    );

    try {
      await runScraper();

      setRunning(
        true
      );

    } catch (error) {

      if (error instanceof Error) {
        setError(error.message);
      } 
      else {
        setError("Failed to start price checker.");
      }
    }
  }


  return (
    <div>
      <button type="button"
        disabled={running}
        onClick={handleRun}
        className="app-btn app-btn-primary px-3 py-1.5"
      >
        {running ? "Checking...": "Run Now"}
      </button>

      {error && (
        <p className="app-error">
          {error}
        </p>
      )}

    </div>
  );
}