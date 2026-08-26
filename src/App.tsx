import { useEffect, useMemo, useState, useCallback } from "react";
import {
  AutomationSettings,
} from "./components/AutomationSettings";

import {
  ProductManagement,
} from "./components/ProductManagement";

import {
  EmailSettings,
} from "./components/EmailSettings";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  DataFile,
  HistoryIndex,
  Product,
} from "./types";

import type {RunMetadata,} from "./types/run";

import {
  fetchLatestRun,
} from "./services/runData";

import {
  SummaryCard,
} from "./components/SummaryCard";

import {
  ScraperHealthCard,
} from "./components/ScraperHealthCard";

import {
  fetchHistoryIndex,
  fetchHistoryPeriod,
} from "./services/historyData";

import {
  fetchProducts,
} from "./services/productData";

import {
  RunNowButton,
} from "./components/RunNowButton";

function App() {
  const [latestData, setLatestData] = useState<DataFile | null>(null);

  const [history, setHistory] = useState<HistoryIndex | null>(null);

  const [historyData, setHistoryData] =useState<DataFile[]>([]);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [latestRun, setLatestRun] = useState<RunMetadata | null>(null);

  const refreshDashboardData =
    useCallback(
      async (
        showLoading = false
      ) => {

        if (showLoading) {
          setLoading(true);
        }

        setError(null);

        try {

          // =============================================
          // Products + History Index + Latest Run
          // =============================================

          const [
            latest,
            historyIndex,
            run,
          ] = await Promise.all([
            fetchProducts(),
            fetchHistoryIndex(),
            fetchLatestRun(),
          ]);


          setLatestData(
            latest
          );

          setHistory(
            historyIndex
          );

          setLatestRun(
            run
          );


          // =============================================
          // History
          // =============================================

          const results =
            await Promise.all(
              historyIndex.periods.map(
                async (period) => {

                  try {

                    return await fetchHistoryPeriod(
                      period
                    );

                  } catch (error) {

                    console.error(
                      `Failed to load history period ${period}:`,
                      error
                    );

                    return null;
                  }
                }
              )
            );


          const validHistory =
            results.filter(
              (
                item
              ): item is DataFile =>
                item !== null
            );


          setHistoryData(
            validHistory
          );

        } catch (err) {

          if (err instanceof Error) {

            setError(
              err.message
            );

          } else {

            setError(
              "Failed to load data"
            );
          }

        } finally {

          if (showLoading) {
            setLoading(false);
          }
        }
      },
      []
    );

  useEffect(() => {

    refreshDashboardData(
      true
    );

  }, [refreshDashboardData]);

  // =========================================================
  // Loading
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">

        <div className="text-center">

          <div
            className="
              mx-auto
              h-8
              w-8
              animate-spin
              rounded-full
              border-4
              border-gray-200
              border-t-gray-700
            "
          />

          <p className="mt-4 text-sm font-medium text-gray-700">
            Loading Price Watch
          </p>

          <p className="mt-1 text-xs text-gray-400">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">

        <div
          className="
            w-full
            max-w-md
            rounded-2xl
            border
            border-red-100
            bg-white
            p-8
            shadow-sm
          "
        >

          <div
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              bg-red-50
              text-lg
            "
          >
            !
          </div>

          <h1 className="mt-5 text-lg font-semibold text-gray-900">
            Unable to load price data
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Price Watch could not retrieve the latest data.
          </p>

          <div
            className="
              mt-4
              rounded-xl
              bg-red-50
              px-4
              py-3
            "
          >
            <p className="text-xs text-red-600">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="
              mt-6
              w-full
              rounded-xl
              bg-gray-900
              px-4
              py-2.5
              text-sm
              font-medium
              text-white
              transition
              hover:bg-gray-700
            "
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }

  if (!latestData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">

        <div
          className="
            w-full
            max-w-md
            rounded-2xl
            border
            bg-white
            p-8
            text-center
            shadow-sm
          "
        >

          <h1 className="text-lg font-semibold text-gray-900">
            No price data available
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Price Watch has not received any product data yet.
          </p>

        </div>

      </div>
    );
  }

  // =========================================================
  // Product detail
  // =========================================================

  if (selectedProduct) {
    return (
      <ProductDetail
        product={selectedProduct}
        history={historyData}
        onBack={() =>
          setSelectedProduct(null)
        }
      />
    );
  }

  // =========================================================
  // Product list
  // =========================================================

  return (
    <ProductList
      data={latestData}
      history={history}
      latestRun={latestRun}
      onRefresh={
        refreshDashboardData
      }
      onSelectProduct={(product) =>
        setSelectedProduct(product)
      }
    />
  );
}


// =============================================================
// Product List
// =============================================================
// =============================================================
// Product List
// =============================================================

type ProductFilter =
  | "all"
  | "belowTarget"
  | "priceDrops";

type ProductSort =
  | "name"
  | "priceLow"
  | "priceHigh"
  | "biggestDrop";


function ProductList({
  data,
  history,
  latestRun,
  onRefresh,
  onSelectProduct,
}: {
  data: DataFile;
  history: HistoryIndex | null;
  latestRun: RunMetadata | null;

  onRefresh: () =>
    Promise<void>;

  onSelectProduct: (
    product: Product
  ) => void;
}) {

  // =========================================================
  // Dashboard summary
  // =========================================================

  const totalProducts =
    data.data.length;

  const hasProducts = totalProducts > 0;

  const belowTarget =
    data.data.filter(
      (product) =>
        product.below_target
    ).length;

  const priceDrops =
    data.data.filter(
      (product) =>
        product.previous_price !== null &&
        product.previous_price !== undefined &&
        product.current_price <
          product.previous_price
    ).length;


  // =========================================================
  // Search / Filter / Sort
  // =========================================================

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] = useState<ProductFilter>(
    "all"
  );

  const [
    sort,
    setSort,
  ] = useState<ProductSort>(
    "name"
  );


  // =========================================================
  // Visible products
  // =========================================================

  const visibleProducts =
    useMemo(() => {

      const query =
        searchQuery
          .trim()
          .toLowerCase();

      const filtered =
        data.data.filter(
          (product) => {

            // -----------------------------------------------
            // Search
            // -----------------------------------------------

            const matchesSearch =
              query.length === 0 ||
              product.name
                .toLowerCase()
                .includes(query);

            if (!matchesSearch) {
              return false;
            }

            // -----------------------------------------------
            // Filter
            // -----------------------------------------------

            if (
              filter ===
              "belowTarget"
            ) {
              return product.below_target;
            }

            if (
              filter ===
              "priceDrops"
            ) {
              return (
                product.previous_price !==
                  null &&
                product.previous_price !==
                  undefined &&
                product.current_price <
                  product.previous_price
              );
            }

            return true;
          }
        );


      // =====================================================
      // Sort
      // =====================================================

      return [...filtered].sort(
        (a, b) => {

          // -----------------------------------------------
          // Name
          // -----------------------------------------------

          if (
            sort === "name"
          ) {
            return a.name.localeCompare(
              b.name
            );
          }

          // -----------------------------------------------
          // Price low → high
          // -----------------------------------------------

          if (
            sort === "priceLow"
          ) {
            return (
              a.current_price -
              b.current_price
            );
          }

          // -----------------------------------------------
          // Price high → low
          // -----------------------------------------------

          if (
            sort === "priceHigh"
          ) {
            return (
              b.current_price -
              a.current_price
            );
          }

          // -----------------------------------------------
          // Biggest price drop
          // -----------------------------------------------

          if (
            sort ===
            "biggestDrop"
          ) {

            const aDrop =
              a.previous_price !== null &&
              a.previous_price !==
                undefined
                ? a.previous_price -
                  a.current_price
                : 0;

            const bDrop =
              b.previous_price !== null &&
              b.previous_price !==
                undefined
                ? b.previous_price -
                  b.current_price
                : 0;

            return (
              bDrop -
              aDrop
            );
          }

          return 0;
        }
      );

    }, [
      data.data,
      searchQuery,
      filter,
      sort,
    ]);


  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}

      <header className="bg-white border-b">

        <div className="max-w-5xl mx-auto px-5 sm:px-6 py-6">

          <div className="flex items-center justify-between">

            <div>

              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Price Watch
              </h1>

              <p className="text-sm text-gray-500 mt-1">
                Product Price Tracker
              </p>

            </div>


            <RunNowButton
              onCompleted={
                onRefresh
              }
            />

            <div className="text-right">

              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Last update
              </p>

              <p className="text-sm font-medium text-gray-700 mt-1">
                {data.period}
              </p>

            </div>

          </div>

        </div>

      </header>


      {/* Main */}

      <main className="max-w-5xl mx-auto px-5 sm:px-6 py-8">

        {/* ===================================================
            Summary
        =================================================== */}

        <div
          className="
            grid
            grid-cols-1
            gap-4
            md:grid-cols-2
            xl:grid-cols-4
            mb-8
          "
        >

          <SummaryCard
            title="Products"
            value={totalProducts}
          />

          <SummaryCard
            title="Below Target"
            value={belowTarget}
          />

          <SummaryCard
            title="Price Drops"
            value={priceDrops}
          />

          <ScraperHealthCard
            run={latestRun}
          />

        </div>
        
        <div className="mb-8">
          <AutomationSettings />
        </div>

        <div className="mb-8">
          <ProductManagement />
        </div>

        <div className="mb-8">
          <EmailSettings />
        </div>

        {/* Empty State */}
        {!hasProducts && (

          <div
            className="
              rounded-2xl
              border
              border-dashed
              border-gray-300
              bg-white
              px-6
              py-14
              text-center
            "
          >

            <div
              className="
                mx-auto
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-full
                bg-gray-100
                text-xl
              "
            >
              $
            </div>

            <h2 className="mt-4 font-semibold text-gray-900">
              No products tracked yet
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Add products to products.json and run the price checker.
            </p>

          </div>

        )}

        {hasProducts && (
          <>
            {/* ===================================================
                Product title
            =================================================== */}

            <div className="flex items-end justify-between mb-4">

              <div>

                <h2 className="text-lg font-semibold text-gray-900">
                  Products
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Click a product to view price history
                </p>

              </div>

              {history && (
                <span className="text-xs text-gray-400">
                  {history.periods.length} weeks of history
                </span>
              )}
            </div>


            {/* ===================================================
                Search
            =================================================== */}

            <div className="mb-4">

              <input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  text-gray-900
                  outline-none
                  transition
                  placeholder:text-gray-400
                  focus:border-gray-400
                "
              />

            </div>


            {/* ===================================================
                Filters + Sort
            =================================================== */}

            <div
              className="
                flex
                flex-col
                gap-3
                sm:flex-row
                sm:items-center
                sm:justify-between
                mb-6
              "
            >

              {/* Filters */}

              <div className="flex flex-wrap gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setFilter("all")
                  }
                  className={`
                    rounded-full
                    px-4
                    py-2
                    text-sm
                    font-medium
                    transition
                    ${
                      filter === "all"
                        ? "bg-gray-900 text-white"
                        : "bg-white border text-gray-600 hover:border-gray-400"
                    }
                  `}
                >
                  All
                </button>


                <button
                  type="button"
                  onClick={() =>
                    setFilter(
                      "belowTarget"
                    )
                  }
                  className={`
                    rounded-full
                    px-4
                    py-2
                    text-sm
                    font-medium
                    transition
                    ${
                      filter ===
                      "belowTarget"
                        ? "bg-green-600 text-white"
                        : "bg-white border text-gray-600 hover:border-gray-400"
                    }
                  `}
                >
                  Below Target
                </button>


                <button
                  type="button"
                  onClick={() =>
                    setFilter(
                      "priceDrops"
                    )
                  }
                  className={`
                    rounded-full
                    px-4
                    py-2
                    text-sm
                    font-medium
                    transition
                    ${
                      filter ===
                      "priceDrops"
                        ? "bg-blue-600 text-white"
                        : "bg-white border text-gray-600 hover:border-gray-400"
                    }
                  `}
                >
                  Price Drops
                </button>

              </div>


              {/* Sort */}

              <select
                value={sort}
                onChange={(event) =>
                  setSort(
                    event.target
                      .value as ProductSort
                  )
                }
                className="
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  px-4
                  py-2.5
                  text-sm
                  text-gray-700
                  outline-none
                  focus:border-gray-400
                "
              >

                <option value="name">
                  Name
                </option>

                <option value="priceLow">
                  Price: Low to High
                </option>

                <option value="priceHigh">
                  Price: High to Low
                </option>

                <option value="biggestDrop">
                  Biggest Price Drop
                </option>

              </select>

            </div>


            {/* ===================================================
                Results count
            =================================================== */}

            <p className="text-xs text-gray-400 mb-3">

              Showing{" "}
              {visibleProducts.length}{" "}
              of{" "}
              {data.data.length}{" "}
              products

            </p>


            {/* ===================================================
                Products
            =================================================== */}

            {visibleProducts.length > 0 ? (

              <div className="space-y-3">

                {visibleProducts.map(
                  (product) => (

                    <ProductCard
                      key={product.url}
                      product={product}
                      onClick={() =>
                        onSelectProduct(
                          product
                        )
                      }
                    />

                  )
                )}

              </div>

            ) : (

              <div
                className="
                  bg-white
                  border
                  rounded-2xl
                  px-6
                  py-12
                  text-center
                "
              >

                <p className="font-medium text-gray-700">
                  No products found
                </p>

                <p className="text-sm text-gray-400 mt-1">
                  Try changing your search or filter.
                </p>

              </div>
            )}
          </>
        )}
        
      </main>
    </div>
  );
}


// =============================================================
// Product Card
// =============================================================

function ProductCard({
  product,
  onClick,
}: {
  product: Product;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border rounded-2xl p-5 sm:p-6 hover:border-gray-400 hover:shadow-sm transition-all group"
    >

      <div className="flex items-center gap-5">

        {/* Product info */}

        <div className="flex-1 min-w-0">

          <h3 className="font-semibold text-gray-900 group-hover:text-gray-600 transition-colors line-clamp-2">
            {product.name}
          </h3>


          <div className="flex flex-wrap items-center gap-2 mt-3">

            {product.below_target ? (

              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                🟢 Target reached
              </span>

            ) : (

              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                Above target
              </span>

            )}

            <span className="text-xs text-gray-400">
              Target {product.target_price.toFixed(0)} kr
            </span>

          </div>

        </div>


        {/* Price */}

        <div className="text-right shrink-0">

          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            {product.current_price.toFixed(2)}
            <span className="text-sm font-normal text-gray-500 ml-1">
              kr
            </span>
          </p>


          {product.below_target ? (

            <p className="text-xs text-green-600 mt-1">
              Below target by{" "}
              {Math.abs(
                product.difference
              ).toFixed(0)}{" "}
              kr
            </p>

          ) : (

            <p className="text-xs text-gray-400 mt-1">
              Above target by{" "}
              {product.difference.toFixed(
                0
              )}{" "}
              kr
            </p>

          )}

        </div>


        {/* Arrow */}

        <div className="text-gray-300 group-hover:text-gray-600 transition-colors">

          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>

        </div>

      </div>

    </button>
  );
}


// =============================================================
// Product Detail
// =============================================================

function ProductDetail({
  product,
  history,
  onBack,
}: {
  product: Product;
  history: DataFile[];
  onBack: () => void;
}) {
  // =========================================================
  // Chart data
  // =========================================================

  const chartData = useMemo(() => {

    return [...history]
      .sort((a, b) =>
        a.period.localeCompare(
          b.period
        )
      )
      .map((historyData) => {

        const item =
          historyData.data.find(
            (productItem) =>
              productItem.url ===
              product.url
          );

        if (!item) {
          return null;
        }

        return {
          period:
            historyData.period,
          price:
            item.current_price,
          target:
            item.target_price,
        };
      })
      .filter(
        (
          item
        ): item is {
          period: string;
          price: number;
          target: number;
        } => item !== null
      );

  }, [history, product.url]);

  // =========================================================
  // Statistics
  // =========================================================

  const prices =
    chartData.map(
      (item) => item.price
    );


  const lowestPrice =
    prices.length > 0
      ? Math.min(...prices)
      : product.current_price;


  const highestPrice =
    prices.length > 0
      ? Math.max(...prices)
      : product.current_price;


  const averagePrice =
    prices.length > 0
      ? prices.reduce(
          (sum, price) =>
            sum + price,
          0
        ) / prices.length
      : product.current_price;


  const previousPrice = product.previous_price ?? null;

  const priceChangePercent =
    previousPrice !== null &&
    previousPrice !== 0
      ? (
          (
            product.current_price -
            previousPrice
          ) /
          previousPrice
        ) * 100
      : null;


  const targetDifference =
    product.current_price -
    product.target_price;

  function formatChange(
    value: number | null
  ) {

    if (value === null) {
      return "N/A";
    }

    if (value > 0) {
      return `+${value.toFixed(1)}%`;
    }

    return `${value.toFixed(1)}%`;
  }


  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}

      <header className="bg-white border-b">

        <div className="max-w-5xl mx-auto px-5 sm:px-6 py-5">

          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >

            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>

            Back to Products

          </button>

        </div>

      </header>


      {/* Main */}

      <main className="max-w-5xl mx-auto px-5 sm:px-6 py-8">

        {/* Product header */}

        <div className="mb-8">

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">

            <div className="flex-1">

              <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                {product.name}
              </h1>

              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm text-gray-400 hover:text-gray-700 mt-2"
              >
                Open Product Page ↗
              </a>

            </div>


            <div className="sm:text-right">

              <p className="text-sm text-gray-500">
                Current Price
              </p>

              <p className="text-3xl font-bold text-gray-900 mt-1">
                {product.current_price.toFixed(2)}
                <span className="text-base font-normal text-gray-500 ml-1">
                  kr
                </span>
              </p>

            </div>

          </div>

        </div>


        {/* Status */}
        <div
          className="
            grid
            grid-cols-2
            md:grid-cols-3
            gap-4
            mb-8
          "
        >

          <StatCard
            label="Target Price"
            value={`${product.target_price.toFixed(2)} kr`}
          />


          <StatCard
            label="Previous Price"
            value={
              previousPrice !== null
                ? `${previousPrice.toFixed(2)} kr`
                : "N/A"
            }
          />


          <StatCard
            label="Change"
            value={
              formatChange(
                priceChangePercent
              )
            }
            green={
              priceChangePercent !== null &&
              priceChangePercent < 0
            }
          />


          <StatCard
            label="Historical Low"
            value={`${lowestPrice.toFixed(2)} kr`}
            green
          />


          <StatCard
            label="Historical High"
            value={`${highestPrice.toFixed(2)} kr`}
          />


          <StatCard
            label="Historical Average"
            value={`${averagePrice.toFixed(2)} kr`}
          />

        </div>

        {/* Status badge */}

        <div className="mb-8">
          {product.below_target ? (
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">

              <p className="text-sm font-medium text-green-700">
                🟢 Target price reached
              </p>

              <p className="text-sm text-green-600 mt-1">
                {Math.abs(
                  targetDifference
                ).toFixed(2)}{" "}
                kr below target
              </p>

            </div>

          ) : (

            <div className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3">

              <p className="text-sm font-medium text-gray-700">
                Above target
              </p>

              <p className="text-sm text-gray-500 mt-1">
                Needs to drop by{" "}
                {targetDifference.toFixed(2)}{" "}
                kr
              </p>

            </div>

          )}

        </div>


        {/* Chart */}

        <div className="bg-white border rounded-2xl p-5 sm:p-6">

          <div className="mb-6">

            <h2 className="text-lg font-semibold text-gray-900">
              Price History
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Weekly recorded prices
            </p>

          </div>


          {chartData.length > 0 ? (

            <div className="h-80">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 15,
                    left: 5,
                    bottom: 5,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 12 }}
                  />

                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) =>
                      `${value} kr`
                    }
                  />

                  <Tooltip
                    formatter={(
                      value,
                      name
                    ) => {

                      const numericValue =
                        Number(value);

                      if (name === "price") {
                        return [
                          `${numericValue.toFixed(2)} kr`,
                          "Price",
                        ];
                      }

                      return [
                        `${numericValue.toFixed(2)} kr`,
                        "Target",
                      ];
                    }}
                    labelFormatter={(label) =>
                      `Period: ${label}`
                    }
                  />

                  <ReferenceLine
                    y={product.target_price}
                    strokeDasharray="6 6"
                    label={{
                      value: `Target ${product.target_price.toFixed(
                        0
                      )} kr`,
                      position: "insideTopRight",
                      fontSize: 12,
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="price"
                    strokeWidth={3}
                    dot={{
                      r: 5,
                    }}
                    activeDot={{
                      r: 7,
                    }}
                    name="price"
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          ) : (

            <div className="h-80 flex items-center justify-center">

              <p className="text-gray-500">
                No price history available yet
              </p>

            </div>

          )}

        </div>


        {/* History table */}

        <div className="bg-white border rounded-2xl mt-6 overflow-hidden">

          <div className="px-5 py-4 border-b">

            <h2 className="font-semibold text-gray-900">
              Price History
            </h2>

          </div>


          <div className="divide-y">

            {[...chartData]
              .reverse()
              .map((item) => (

                <div
                  key={item.period}
                  className="flex items-center justify-between px-5 py-4"
                >

                  <span className="text-sm text-gray-500">
                    {item.period}
                  </span>

                  <span className="font-semibold text-gray-900">
                    {item.price.toFixed(2)} kr
                  </span>

                </div>

              ))}

          </div>

        </div>

      </main>

    </div>
  );
}


// =============================================================
// Stat Card
// =============================================================

function StatCard({
  label,
  value,
  green = false,
}: {
  label: string;
  value: string;
  green?: boolean;
}) {
  return (
    <div className="bg-white border rounded-2xl p-5">

      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p
        className={`text-xl font-bold mt-2 ${
          green
            ? "text-green-600"
            : "text-gray-900"
        }`}
      >
        {value}
      </p>

    </div>
  );
}

export default App;