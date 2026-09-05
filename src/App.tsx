import {
  useState,
} from "react";

import {
  AutomationSettings,
} from "@/components/AutomationSettings";

import {
  EmailSettings,
} from "@/components/EmailSettings";

import {
  AppHeader,
} from "@/components/layout/AppHeader";

import {
  ProductDetail,
} from "@/components/products/ProductDetail";

import {
  ProductList,
} from "@/components/products/ProductList";

import {
  ScraperDetail,
} from "@/components/scraper/ScraperDetail";

import {
  useAppData,
} from "@/hooks/useAppData";

import type {
  AppView,
} from "@/types/app";


// =============================================================
// App
// =============================================================

function App() {
  const data =
    useAppData();


  // ===========================================================
  // Current View
  // ===========================================================

  const [
    view,
    setView,
  ] = useState<AppView>(
    "dashboard",
  );


  // ===========================================================
  // Selected Product
  //
  // Store only the ID.
  //
  // The actual Product is always derived from latestData so
  // edits appear immediately after refresh().
  // ===========================================================

  const [
    selectedProductId,
    setSelectedProductId,
  ] = useState<string | null>(
    null,
  );


  const selectedProduct =
    selectedProductId !== null
      ? (
          data.latestData.data.find(
            product =>
              product.product_id ===
              selectedProductId,
          ) ?? null
        )
      : null;


  // ===========================================================
  // Navigation
  // ===========================================================

  function navigate(
    next: AppView,
  ) {
    setSelectedProductId(
      null,
    );

    setView(
      next,
    );
  }


  // ===========================================================
  // Select Product
  // ===========================================================

  function handleSelectProduct(
    productId: string,
  ) {
    setSelectedProductId(
      productId,
    );
  }


  // ===========================================================
  // Back From Detail
  // ===========================================================

  function handleBackFromProduct() {
    setSelectedProductId(
      null,
    );

    setView(
      "dashboard",
    );
  }


  // ===========================================================
  // Loading
  // ===========================================================

  if (data.loading) {
    return (
      <div
        className="
          flex min-h-screen
          items-center
          justify-center
        "
      >
        Loading...
      </div>
    );
  }


  // ===========================================================
  // Error
  // ===========================================================

  if (data.error) {
    return (
      <div
        className="
          flex min-h-screen
          items-center
          justify-center
          text-destructive
        "
      >
        {data.error}
      </div>
    );
  }


  // ===========================================================
  // Render
  // ===========================================================

  return (
    <div className="min-h-screen">
      {/* =====================================================
          Header
      ===================================================== */}

      <AppHeader
        view={
          view
        }

        generatedAt={
          data.latestData.generated_at
        }

        latestRun={
          data.latestRun
        }

        onNavigate={
          navigate
        }

        onRefresh={
          data.refresh
        }
      />


      {/* =====================================================
          Main
      ===================================================== */}

      <main
        className="
          mx-auto
          max-w-6xl
          px-5 py-8
          sm:px-6
        "
      >
        {/* ===================================================
            Product Detail
        =================================================== */}

        {selectedProduct ? (
          <ProductDetail
            product={
              selectedProduct
            }

            history={
              data.historyData
            }

            onBack={
              handleBackFromProduct
            }

            onRefresh={
              data.refresh
            }
          />
        ) : (
          <>
            {/* ===============================================
                Dashboard
            =============================================== */}

            {view === "dashboard" && (
              <ProductList
                data={
                  data.latestData
                }

                history={
                  data.history
                }

                onSelectProduct={
                  product => {
                    handleSelectProduct(
                      product.product_id,
                    );
                  }
                }

                onRefresh={
                  data.refresh
                }
              />
            )}


            {/* ===============================================
                Scraper
            =============================================== */}

            {view === "scraper" && (
              <ScraperDetail
                run={
                  data.latestRun
                }
              />
            )}

            {/* ===============================================
                Automation
            =============================================== */}

            {view === "automation" && (
              <AutomationSettings />
            )}


            {/* ===============================================
                Email
            =============================================== */}

            {view === "email" && (
              <EmailSettings />
            )}
          </>
        )}
      </main>
    </div>
  );
}


export default App;