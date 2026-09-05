import { useMemo } from "react";

import type { DataFile, Product } from "@/types/product";


export interface ProductHistoryPoint {
  period: string;
  price: number | null;
  unitPrice: number | null;
}

export interface PriceChartPoint {
  period: string;
  value: number;
}


export function useProductHistory(product: Product, history: DataFile[]) {
  return useMemo(() => {
    const historyPoints: ProductHistoryPoint[] = [...history]
      .sort((a, b) => a.period.localeCompare(b.period))
      .flatMap(period => {
        const item = period.data.find(
          candidate =>
            candidate.product_id === product.product_id ||
            candidate.name === product.name,
        );

        if (!item) return [];

        const price = item.current_price ?? null;
        const unitPrice = item.current_unit_price ?? null;

        if (price === null && unitPrice === null) return [];

        return [{
          period: period.period,
          price,
          unitPrice,
        }];
      });

    const totalChartData: PriceChartPoint[] = historyPoints.flatMap(item =>
      item.price === null
        ? []
        : [{ period: item.period, value: item.price }],
    );

    const unitChartData: PriceChartPoint[] = historyPoints.flatMap(item =>
      item.unitPrice === null
        ? []
        : [{ period: item.period, value: item.unitPrice }],
    );

    const totalPrices = totalChartData.map(item => item.value);
    const unitPrices = unitChartData.map(item => item.value);

    return {
      historyPoints,
      totalChartData,
      unitChartData,

      totalLow: totalPrices.length
        ? Math.min(...totalPrices)
        : product.current_price,

      totalHigh: totalPrices.length
        ? Math.max(...totalPrices)
        : product.current_price,

      totalAverage:
        average(totalPrices) ??
        product.current_price,

      unitLow: unitPrices.length
        ? Math.min(...unitPrices)
        : product.current_unit_price ?? null,

      unitHigh: unitPrices.length
        ? Math.max(...unitPrices)
        : product.current_unit_price ?? null,

      unitAverage:
        average(unitPrices) ??
        product.current_unit_price ??
        null,
    };
  }, [
    history,
    product.product_id,
    product.name,
    product.current_price,
    product.current_unit_price,
  ]);
}


function average(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}