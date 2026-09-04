import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AutomationSettings } from "./components/AutomationSettings";
import { EmailSettings } from "./components/EmailSettings";
import { ProductDetail } from "./components/products/ProductDetail";
import { ProductList } from "./components/products/ProductList";
import { ProductManagement } from "./components/products/ProductManagement";
import { RunNowButton } from "./components/RunNowButton";
import { ScraperDetail } from "./components/ScraperDetail";
import { fetchHistoryIndex, fetchHistoryPeriod } from "./services/historyData";
import { fetchProducts } from "./services/productData";
import { fetchLatestRun } from "./services/runData";
import type { DataFile, HistoryIndex, Product } from "./types/product";
import type { RunMetadata } from "./types/run";
import { getScraperHealth } from "./utils/scraperHealth";


const EMPTY_DATA: DataFile = {
  period: "",
  generated_at: "",
  data: [],
};

type AppView = "dashboard" | "scraper" | "products" | "automation" | "email";

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}


function App() {
  const [view, setView] =useState<AppView>("dashboard");

  const [latestData, setLatestData] =useState<DataFile>(EMPTY_DATA);

  const [history, setHistory] =useState<HistoryIndex | null>(null);

  const [historyData, setHistoryData] =useState<DataFile[]>([]);

  const [selectedProduct, setSelectedProduct] =useState<Product | null>(null);

  const [loading, setLoading] =useState(true);

  const [error, setError] =useState<string | null>(null);

  const [latestRun, setLatestRun] =useState<RunMetadata | null>(null);

  const refreshDashboardData = useCallback(
    async (showLoading = false) => {

      if (showLoading) {
        setLoading(true);
      }

      setError(null);

      try {
        const [latest, historyIndex,run] = await Promise.all([
          fetchProducts(),
          fetchHistoryIndex(),
          fetchLatestRun(),
        ]);

        setLatestData(latest);
        setHistory(historyIndex);
        setLatestRun(run);

        const results =
          await Promise.all(
            historyIndex.periods.map(
              async (period) => {
                try {
                  return await fetchHistoryPeriod(period);
                }
                catch (error) {
                  console.error(`Failed to load history period ${period}:`, error);
                  return null;
                }
              },
            )
          );

        const validHistory = results.filter((item): item is DataFile => item !== null);

        setHistoryData(validHistory);

      }
      catch (err) {

        if (err instanceof Error) {
          setError(err.message);
        }
        else {
          setError("Failed to load data");
        }
      }
      finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    []
  );


  useEffect(() => {
    refreshDashboardData(true);
  }, [refreshDashboardData]);


  const scraperHealth = getScraperHealth(latestRun);

  function navigateTo(nextView: AppView) {
    setSelectedProduct(null);
    setView(nextView);
  }

  // =========================================================
  // Loading
  // =========================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">

        <div className="text-center">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-700" />

          <p className="mt-4 text-sm font-medium text-gray-700">
            Fetching the latest product data...
          </p>

        </div>

      </div>
    );
  }


  // =========================================================
  // Error
  // =========================================================
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 bg-app">

        <div className="app-card w-full max-w-md p-8">

          <h1 className="app-section-title">
            Could not connect to the server
          </h1>

          <p className="app-body mt-2">
            Make sure the local Price Watch API is running, then try again.
          </p>

          <div className="status-danger mt-4 rounded-xl px-4 py-3">
            <p className="text-xs">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>window.location.reload()}
            className="app-btn app-btn-primary mt-4 w-full px-4 py-3"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }


  // =========================================================
  // Application shell
  // =========================================================

  return (
    <div className="min-h-screen bg-app">

      {/* Header */}
      <header className="border-b border-app-border bg-surface">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-5 sm:px-6">

          {/* Brand */}
          <h1 className="app-title text-app-text">
            PriceWatch  
          </h1>

          {/* Divider */}
          <div className="mx-4 h-5 w-px bg-app-border" />

          {/* Navigation */}
          <nav className="flex h-full items-center gap-5">

            <NavButton
              active={view === "dashboard" && !selectedProduct}
              onClick={() => navigateTo("dashboard")}
            >
              Dashboard
            </NavButton>

            <NavButton
              active={view === "products"}
              onClick={() =>navigateTo("products")}
            >
              Products
            </NavButton>

            <NavButton
              active={view === "automation"}
              onClick={() => navigateTo("automation")}
            >
              Automation
            </NavButton>

            <NavButton
              active={view === "email"}
              onClick={() =>navigateTo("email")}
            >
              Email Settings
            </NavButton>

          </nav>


          {/* Right */}
          <div className="ml-auto flex items-center gap-4">
            <span className="whitespace-nowrap text-xs text-app-text-muted">
              Updated{" "}
              {latestData.generated_at ? new Date(latestData.generated_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                : "Never"}
            </span>

            {/* Divider */}
            <div className="mx-4 h-5 w-px bg-app-border" />

              <RunNowButton onCompleted={refreshDashboardData}/>

              <button
                type="button"
                onClick={() =>navigateTo("scraper")}
                className={`app-btn app-btn-status px-3 py-1.5 ${scraperHealth.buttonClass}`}
              >
                <span className={`h-2 w-2 rounded-full ${scraperHealth.dotClass}`} />

                <span>
                  {scraperHealth.label}
                </span>

                <span className="opacity-60">
                  Details
                </span>
              </button>
          </div>
        </div>
      </header>


      {/* Main */}

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-6">

        {selectedProduct ? (
          <ProductDetail
            product={selectedProduct}
            history={historyData}
            onBack={() => setSelectedProduct(null)}
          />
        ) : (
          <>
            {view === "dashboard" && (
              <ProductList
                data={latestData}
                history={history}
                onManageProducts={() =>navigateTo("products")}
                onSelectProduct={(product) =>setSelectedProduct(product)}
              />
            )}

            {view === "scraper" && (<ScraperDetail run={latestRun}/>)}

            {view === "products" && (<ProductManagement />)}

            {view === "automation" && (<AutomationSettings />)}

            {view === "email" && (<EmailSettings />)}
          </>
        )}
      </main>
    </div>
  );
}

// =============================================================
// Navigation Button
// =============================================================
function NavButton({active,onClick,children}: NavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`app-nav-button ${active ? "app-nav-button-active" : ""}`}
    >
      {children}
    </button>
  );
}

export default App;
