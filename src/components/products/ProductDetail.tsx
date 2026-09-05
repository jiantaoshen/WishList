import {
  Play,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import {
  Separator,
} from "@/components/ui/separator";

import {
  ProductDetailHeader,
} from "@/components/products/ProductDetailHeader";

import {
  ProductHistoryTable,
} from "@/components/products/ProductHistoryTable";

import {
  ProductOffers,
} from "@/components/products/ProductOffers";

import {
  ProductPriceChart,
} from "@/components/products/ProductPriceChart";

import {
  ProductPriceStats,
} from "@/components/products/ProductPriceStats";

import {
  useProductHistory,
} from "@/hooks/useProductHistory";

import type {
  DataFile,
  Product,
} from "@/types/product";


// =============================================================
// Props
// =============================================================

interface ProductDetailProps {
  product: Product;

  history: DataFile[];

  onBack:
    () => void;

  onRefresh:
    () => void | Promise<void>;
}


// =============================================================
// Product Detail
// =============================================================

export function ProductDetail({
  product,
  history,
  onBack,
  onRefresh,
}: ProductDetailProps) {
  const priceHistory =
    useProductHistory(
      product,
      history,
    );


  const unit =
    product.unit ?? null;


  const unitCurrency =
    unit
      ? `${product.currency}/${unit}`
      : product.currency;


  const isNotRun =
    product.status === "not_run";


  return (
    <div className="space-y-8">
      {/* =====================================================
          Header
      ===================================================== */}

      <ProductDetailHeader
        product={
          product
        }

        onBack={
          onBack
        }

        onRefresh={
          onRefresh
        }
      />


      <Separator />


      {/* =====================================================
          Not Run Yet
      ===================================================== */}

      {isNotRun ? (
        <Card className="border-dashed">
          <CardContent
            className="
              flex min-h-[260px]
              flex-col
              items-center
              justify-center
              px-6 py-12
              text-center
            "
          >
            <div
              className="
                flex size-12
                items-center
                justify-center
                rounded-full
                bg-muted
              "
            >
              <Play
                className="
                  size-5
                  text-muted-foreground
                "
              />
            </div>


            <h2
              className="
                mt-4
                text-lg
                font-semibold
              "
            >
              No price data yet
            </h2>


            <p
              className="
                mt-2
                max-w-md
                text-sm
                leading-6
                text-muted-foreground
              "
            >
              This product has been
              added successfully but
              has not been included in
              a scraper run yet.
            </p>


            <p
              className="
                mt-1
                max-w-md
                text-sm
                text-muted-foreground
              "
            >
              Run the scraper to load
              prices, store offers,
              statistics and history.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* =================================================
              Price Stats
          ================================================= */}

          <ProductPriceStats
            product={
              product
            }

            totalLow={
              priceHistory.totalLow
            }

            totalHigh={
              priceHistory.totalHigh
            }

            totalAverage={
              priceHistory.totalAverage
            }

            unitLow={
              priceHistory.unitLow
            }

            unitHigh={
              priceHistory.unitHigh
            }

            unitAverage={
              priceHistory.unitAverage
            }
          />


          {/* =================================================
              Offers
          ================================================= */}

          <ProductOffers
            product={
              product
            }
          />


          {/* =================================================
              Charts
          ================================================= */}

          <div
            className="
              grid gap-6
              xl:grid-cols-2
            "
          >
            <ProductPriceChart
              title="Total price history"

              description="Lowest total price recorded each period."

              data={
                priceHistory.totalChartData
              }

              currency={
                product.currency
              }

              target={
                product.target_price
              }
            />


            <ProductPriceChart
              title="Unit price history"

              description="Lowest unit price recorded each period."

              data={
                priceHistory.unitChartData
              }

              currency={
                unitCurrency
              }

              target={
                product.target_unit_price ??
                null
              }
            />
          </div>


          {/* =================================================
              History
          ================================================= */}

          <ProductHistoryTable
            data={
              priceHistory.historyPoints
            }

            currency={
              product.currency
            }

            unit={
              unit
            }
          />
        </>
      )}
    </div>
  );
}