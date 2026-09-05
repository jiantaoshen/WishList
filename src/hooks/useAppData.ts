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
  fetchLatestRun,
} from "@/services/runData";

import type {
  DataFile,
  HistoryIndex,
} from "@/types/product";

import type {
  RunMetadata,
} from "@/types/run";


const EMPTY_DATA: DataFile = {
  period: "",
  generated_at: "",
  data: [],
};


export function useAppData() {
  const [latestData, setLatestData] =
    useState<DataFile>(EMPTY_DATA);

  const [history, setHistory] =
    useState<HistoryIndex | null>(null);

  const [historyData, setHistoryData] =
    useState<DataFile[]>([]);

  const [latestRun, setLatestRun] =
    useState<RunMetadata | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);


  const refresh =
    useCallback(
      async (
        showLoading = false,
      ) => {
        if (showLoading) {
          setLoading(true);
        }

        setError(null);

        try {
          const [
            latest,
            historyIndex,
            run,
          ] = await Promise.all([
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
                item !== null,
            ),
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
          if (showLoading) {
            setLoading(false);
          }
        }
      },
      [],
    );


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