import { useEffect, useMemo, useState } from "react";
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

function App() {
  const [latestData, setLatestData] = useState<DataFile | null>(null);

  const [history, setHistory] = useState<HistoryIndex | null>(null);

  const [historyData, setHistoryData] =useState<DataFile[]>([]);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const DATA_BASE_URL = "https://storage.googleapis.com/wishlist-example-price-data";

  // =========================================================
  // Load data
  // =========================================================

  useEffect(() => {
    async function loadData() {
      try {
        const [
          latestResponse,
          historyIndexResponse,
        ] = await Promise.all([
          fetch(`${DATA_BASE_URL}/latest.json`),
          fetch(`${DATA_BASE_URL}/history/index.json`),
        ]);

        if (!latestResponse.ok) {
          throw new Error(
            "Unable to load latest.json"
          );
        }

        if (!historyIndexResponse.ok) {
          throw new Error(
            "Unable to load price history"
          );
        }

        const latest: DataFile =
          await latestResponse.json();

        const historyIndex: HistoryIndex =
          await historyIndexResponse.json();

        setLatestData(latest);
        setHistory(historyIndex);

        // ===================================================
        // Load all history
        // ===================================================

        const results =
          await Promise.all(
            historyIndex.periods.map(
              async (period) => {
                try {
                  const response =
                    await fetch(
                      `${DATA_BASE_URL}/history/${period}.json`
                    );

                  if (!response.ok) {
                    return null;
                  }

                  return (
                    (await response.json()) as DataFile
                  );
                } catch {
                  return null;
                }
              }
            )
          );

        const validHistory =
          results.filter(
            (item): item is DataFile =>
              item !== null
          );

        setHistoryData(validHistory);

      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load data");
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // =========================================================
  // Loading
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">
          Loading price data...
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
        <div className="bg-white rounded-2xl border p-8 max-w-md w-full">
          <h1 className="text-lg font-semibold text-gray-900">
            Failed to load data
          </h1>

          <p className="text-sm text-red-500 mt-2">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!latestData) {
    return null;
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
      onSelectProduct={(product) =>
        setSelectedProduct(product)
      }
    />
  );
}


// =============================================================
// Product List
// =============================================================

function ProductList({
  data,
  history,
  onSelectProduct,
}: {
  data: DataFile;
  history: HistoryIndex | null;
  onSelectProduct: (
    product: Product
  ) => void;
}) {
  const discountCount =
    data.data.filter(
      (product) =>
        product.below_target
    ).length;

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

        {/* Summary */}

        <div className="grid grid-cols-2 gap-4 mb-8">

          <div className="bg-white border rounded-2xl p-5">

            <p className="text-sm text-gray-500">
              Tracked Products
            </p>

            <p className="text-3xl font-bold text-gray-900 mt-2">
              {data.data.length}
            </p>

          </div>


          <div className="bg-white border rounded-2xl p-5">

            <p className="text-sm text-gray-500">
              At Target Price
            </p>

            <p className="text-3xl font-bold text-green-600 mt-2">
              {discountCount}
            </p>

          </div>

        </div>


        {/* Title */}

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


        {/* Products */}

        <div className="space-y-3">

          {data.data.map(
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

          <StatCard
            label="Target Price"
            value={`${product.target_price.toFixed(2)} kr`}
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

        </div>


        {/* Status badge */}

        <div className="mb-8">

          {product.below_target ? (

            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">

              <p className="text-sm font-medium text-green-700">
                🟢 Target price reached
              </p>

              <p className="text-sm text-green-600 mt-1">
                Below target by{" "}
                {Math.abs(
                  product.difference
                ).toFixed(2)}{" "}
                kr
              </p>

            </div>

          ) : (

            <div className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3">

              <p className="text-sm font-medium text-gray-700">
                ⚪ Current PriceAbove target
              </p>

              <p className="text-sm text-gray-500 mt-1">
                Needs to drop by{" "}
                {product.difference.toFixed(
                  2
                )}{" "}
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
                    ) => [
                      `${Number(
                        value
                      ).toFixed(2)} kr`,
                      name === "price"
                        ? "Price"
                        : "Target Price",
                    ]}
                  />

                  <ReferenceLine
                    y={product.target_price}
                    strokeDasharray="6 6"
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