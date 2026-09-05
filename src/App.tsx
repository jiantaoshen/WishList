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
  ProductManagement,
} from "@/components/products/ProductManagement";

import {
  ScraperDetail,
} from "@/components/scraper/ScraperDetail";

import {
  useAppData,
} from "@/hooks/useAppData";

import type {
  AppView,
} from "@/types/app";

import type {
  Product,
} from "@/types/product";


function App() {
  const data =
    useAppData();

  const [
    view,
    setView,
  ] = useState<AppView>(
    "dashboard",
  );

  const [
    selectedProduct,
    setSelectedProduct,
  ] = useState<Product | null>(
    null,
  );


  function navigate(
    next: AppView,
  ) {
    setSelectedProduct(null);
    setView(next);
  }


  if (data.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }


  if (data.error) {
    return (
      <div className="flex min-h-screen items-center justify-center text-destructive">
        {data.error}
      </div>
    );
  }


  return (
    <div className="min-h-screen">
      <AppHeader
        view={view}
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


      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-6">
        {selectedProduct ? (
          <ProductDetail
            product={
              selectedProduct
            }
            history={
              data.historyData
            }
            onBack={() =>
              setSelectedProduct(
                null,
              )
            }
          />
        ) : (
          <>
            {view === "dashboard" && (
              <ProductList
                data={
                  data.latestData
                }
                history={
                  data.history
                }
                onManageProducts={() =>
                  navigate(
                    "products",
                  )
                }
                onSelectProduct={
                  setSelectedProduct
                }
              />
            )}

            {view === "scraper" && (
              <ScraperDetail
                run={
                  data.latestRun
                }
              />
            )}

            {view === "products" && (
              <ProductManagement />
            )}

            {view === "automation" && (
              <AutomationSettings />
            )}

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