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


interface ProductDetailProps {
  product: Product;
  history: DataFile[];
  onBack: () => void;
}


export function ProductDetail({
  product,
  history,
  onBack,
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


  return (
    <div className="space-y-8">
      <ProductDetailHeader
        product={product}
        onBack={onBack}
      />


      <Separator />


      <ProductPriceStats
        product={product}
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


      <ProductOffers
        product={product}
      />


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


      <ProductHistoryTable
        data={
          priceHistory.historyPoints
        }
        currency={
          product.currency
        }
        unit={unit}
      />
    </div>
  );
}