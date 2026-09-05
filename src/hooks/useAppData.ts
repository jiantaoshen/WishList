import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  fetchHistoryIndex,
  fetchHistoryPeriod,
} from "@/services/historyData";

import {
  fetchProducts,
} from "@/services/productData";

import {
  fetchProductConfigs,
} from "@/services/productConfigApi";

import {
  fetchLatestRun,
} from "@/services/runData";

import type {
  ProductConfig,
} from "@/services/productConfigApi";

import type {
  DataFile,
  HistoryIndex,
  Product,
} from "@/types/product";

import type {
  RunMetadata,
} from "@/types/run";


const EMPTY_DATA: DataFile = {
  period: "",
  generated_at: "",
  data: [],
};


// =============================================================
// Merge Product Config + Latest Result
// =============================================================

function mergeDashboardProducts(
  latestData: DataFile,
  productConfigs: ProductConfig[],
): DataFile {
  const latestById =
    new Map<string, Product>(
      latestData.data.map(
        product => [
          product.product_id,
          product,
        ],
      ),
    );


  const products =
    productConfigs.map(
      config => {
        const latest =
          latestById.get(
            config.id,
          );


        // =====================================================
        // Product has already been run
        // =====================================================

        if (latest) {
          return {
            ...latest,

            // Keep configuration fields current
            // even before the next scraper run.
            name:
              config.name,

            target_price:
              config.target_price,

            target_unit_price:
              config.target_unit_price,

            unit:
              config.unit,

            currency:
              config.currency,
          };
        }


        // =====================================================
        // Product has never been run
        // =====================================================

        const firstSource =
          config.sources?.[0];


        const product:
          Product = {
          product_id:
            config.id,

          name:
            config.name,

          url:
            firstSource?.url ??
            config.url ??
            "",

          store:
            firstSource?.store ??
            null,

          target_price:
            config.target_price,

          current_price:
            null,

          previous_price:
            null,

          below_target:
            null,

          difference:
            null,

          unit:
            config.unit,

          unit_url:
            null,

          unit_store:
            null,

          target_unit_price:
            config.target_unit_price,

          current_unit_price:
            null,

          previous_unit_price:
            null,

          unit_below_target:
            null,

          unit_difference:
            null,

          status:
            "not_run",

          currency:
            config.currency,

          comparison_quantity:
            config.comparison_quantity ??
            null,

          offers:
            [],

          error:
            null,
        };


        return product;
      },
    );


  return {
    ...latestData,

    data:
      products,
  };
}


// =============================================================
// Hook
// =============================================================

export function useAppData() {
  const [
    latestData,
    setLatestData,
  ] =
    useState<DataFile>(
      EMPTY_DATA,
    );


  const [
    history,
    setHistory,
  ] =
    useState<
      HistoryIndex | null
    >(
      null,
    );


  const [
    historyData,
    setHistoryData,
  ] =
    useState<DataFile[]>(
      [],
    );


  const [
    latestRun,
    setLatestRun,
  ] =
    useState<
      RunMetadata | null
    >(
      null,
    );


  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );


  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(
      null,
    );


  // ===========================================================
  // Refresh
  // ===========================================================

  const refresh =
    useCallback(
      async (
        showLoading = false,
      ) => {
        if (showLoading) {
          setLoading(
            true,
          );
        }


        setError(
          null,
        );


        try {
          const [
            latest,
            productConfigs,
            historyIndex,
            run,
          ] =
            await Promise.all([
              fetchProducts(),

              fetchProductConfigs(),

              fetchHistoryIndex(),

              fetchLatestRun(),
            ]);


          // ===================================================
          // Merge configured products with scraper results
          // ===================================================

          const mergedData =
            mergeDashboardProducts(
              latest,
              productConfigs,
            );


          setLatestData(
            mergedData,
          );

          setHistory(
            historyIndex,
          );

          setLatestRun(
            run,
          );


          // ===================================================
          // History
          // ===================================================

          const results =
            await Promise.all(
              historyIndex.periods.map(
                async period => {
                  try {
                    return await fetchHistoryPeriod(
                      period,
                    );
                  }
                  catch {
                    return null;
                  }
                },
              ),
            );


          setHistoryData(
            results.filter(
              (
                item,
              ): item is DataFile =>
                item !==
                null,
            ),
          );
        }
        catch (
          exception
        ) {
          setError(
            exception instanceof Error
              ? exception.message
              : "Failed to load data.",
          );
        }
        finally {
          if (
            showLoading
          ) {
            setLoading(
              false,
            );
          }
        }
      },
      [],
    );


  // ===========================================================
  // Initial load
  // ===========================================================

  useEffect(
    () => {
      void refresh(
        true,
      );
    },
    [
      refresh,
    ],
  );


  // ===========================================================
  // Public API
  // ===========================================================

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