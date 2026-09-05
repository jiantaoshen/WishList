import { useMemo } from "react";

import type {
  DataFile,
  Product,
} from "@/types/product";


export interface ProductHistoryPoint {
  period: string;
  price: number | null;
  unitPrice: number | null;
}


export interface PriceChartPoint {
  period: string;
  value: number;
}


export function useProductHistory(
  product: Product,
  history: DataFile[],
) {
  const historyPoints =
    useMemo<ProductHistoryPoint[]>(() => {
      const points: ProductHistoryPoint[] = [];

      const sorted =
        [...history].sort(
          (a, b) =>
            a.period.localeCompare(
              b.period,
            ),
        );

      for (const period of sorted) {
        const item =
          period.data.find(
            (candidate) =>
              candidate.product_id ===
              product.product_id,
          );

        if (!item) {
          continue;
        }

        const price =
          item.current_price ?? null;

        const unitPrice =
          item.current_unit_price ??
          null;

        if (
          price === null &&
          unitPrice === null
        ) {
          continue;
        }

        points.push({
          period: period.period,
          price,
          unitPrice,
        });
      }

      return points;
    }, [
      history,
      product.product_id,
    ]);


  const totalChartData =
    useMemo<PriceChartPoint[]>(() => {
      const points: PriceChartPoint[] = [];

      for (
        const item
        of historyPoints
      ) {
        if (item.price === null) {
          continue;
        }

        points.push({
          period: item.period,
          value: item.price,
        });
      }

      return points;
    }, [historyPoints]);


  const unitChartData =
    useMemo<PriceChartPoint[]>(() => {
      const points: PriceChartPoint[] = [];

      for (
        const item
        of historyPoints
      ) {
        if (
          item.unitPrice === null
        ) {
          continue;
        }

        points.push({
          period: item.period,
          value: item.unitPrice,
        });
      }

      return points;
    }, [historyPoints]);


  const totalPrices =
    totalChartData.map(
      (item) => item.value,
    );


  const unitPrices =
    unitChartData.map(
      (item) => item.value,
    );


  return {
    historyPoints,
    totalChartData,
    unitChartData,

    totalLow:
      totalPrices.length > 0
        ? Math.min(...totalPrices)
        : product.current_price,

    totalHigh:
      totalPrices.length > 0
        ? Math.max(...totalPrices)
        : product.current_price,

    totalAverage:
      average(totalPrices) ??
      product.current_price,

    unitLow:
      unitPrices.length > 0
        ? Math.min(...unitPrices)
        : (
            product.current_unit_price ??
            null
          ),

    unitHigh:
      unitPrices.length > 0
        ? Math.max(...unitPrices)
        : (
            product.current_unit_price ??
            null
          ),

    unitAverage:
      average(unitPrices) ??
      (
        product.current_unit_price ??
        null
      ),
  };
}


function average(
  values: number[],
): number | null {
  if (values.length === 0) {
    return null;
  }

  return (
    values.reduce(
      (sum, value) =>
        sum + value,
      0,
    ) / values.length
  );
}