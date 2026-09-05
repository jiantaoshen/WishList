import { useCallback, useEffect, useState } from "react";

import { fetchHistoryIndex, fetchHistoryPeriod } from "@/services/historyData";
import { fetchLatestProducts } from "@/services/productData";
import { fetchProductConfigs } from "@/services/productConfigApi";
import { fetchLatestRun } from "@/services/runData";

import type { ProductConfig } from "@/services/productConfigApi";
import type { DataFile, HistoryIndex, Product } from "@/types/product";
import type { RunMetadata } from "@/types/run";


const EMPTY_DATA: DataFile = {
  period: "",
  generated_at: "",
  data: [],
};


function mergeDashboardProducts(
  latestData: DataFile,
  productConfigs: ProductConfig[],
): DataFile {
  const latestProducts = Array.isArray(latestData.data) ? latestData.data : [];
  const configs = Array.isArray(productConfigs) ? productConfigs : [];

  const latestById = new Map(
    latestProducts
      .filter(product => product.product_id)
      .map(product => [product.product_id, product]),
  );

  const latestByName = new Map(
    latestProducts.map(product => [
      product.name.trim().toLowerCase(),
      product,
    ]),
  );

  const products: Product[] = configs.map(config => {
    const latest =
      latestById.get(config.id) ??
      latestByName.get(config.name.trim().toLowerCase());

    if (latest) {
      return {
        ...latest,
        product_id: config.id,
        name: config.name,
        comparison_quantity: config.comparison_quantity ?? null,
        target_price: config.target_price,
        target_unit_price: config.target_unit_price,
        unit: config.unit,
        currency: config.currency,
      };
    }

    const firstSource = config.sources?.[0];

    return {
      product_id: config.id,
      name: config.name,
      comparison_quantity: config.comparison_quantity ?? null,

      url: firstSource?.url ?? config.url ?? "",
      store: firstSource?.store ?? null,

      target_price: config.target_price,
      current_price: null,
      previous_price: null,
      below_target: null,
      difference: null,

      unit: config.unit,
      unit_url: null,
      unit_store: null,
      target_unit_price: config.target_unit_price,
      current_unit_price: null,
      previous_unit_price: null,
      unit_below_target: null,
      unit_difference: null,

      status: "not_run",
      currency: config.currency,

      offers: [],
      error: null,
    };
  });

  return {
    ...latestData,
    data: products,
  };
}


export function useAppData() {
  const [latestData, setLatestData] = useState<DataFile>(EMPTY_DATA);
  const [history, setHistory] = useState<HistoryIndex | null>(null);
  const [historyData, setHistoryData] = useState<DataFile[]>([]);
  const [latestRun, setLatestRun] = useState<RunMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const refresh = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);

    try {
      const [latest, productConfigs, historyIndex, run] = await Promise.all([
        fetchLatestProducts(),
        fetchProductConfigs(),
        fetchHistoryIndex(),
        fetchLatestRun(),
      ]);

      setLatestData(mergeDashboardProducts(latest, productConfigs));
      setHistory(historyIndex);
      setLatestRun(run);

      const historyResults = await Promise.all(
        historyIndex.periods.map(async period => {
          try {
            return await fetchHistoryPeriod(period);
          }
          catch {
            return null;
          }
        }),
      );

      setHistoryData(
        historyResults.filter((item): item is DataFile => item !== null),
      );
    }
    catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Failed to load data.",
      );
    }
    finally {
      if (showLoading) setLoading(false);
    }
  }, []);


  useEffect(() => {
    void refresh(true);
  }, [refresh]);


  return {
    latestData,
    history,
    historyData,
    latestRun,
    loading,
    error,
    refresh,
  };
}