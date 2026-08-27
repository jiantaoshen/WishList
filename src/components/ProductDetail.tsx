import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DataFile, Product } from "../types/product";


interface ProductDetailProps {
  product: Product;
  history: DataFile[];
  onBack: () => void;
}

interface StatCardProps {
  label: string;
  value: string;
  green?: boolean;
}


// =============================================================
// Product Detail
// =============================================================

export function ProductDetail({
  product,
  history,
  onBack,
}: ProductDetailProps) {

  // =========================================================
  // Chart Data
  // =========================================================

  const chartData = useMemo(() => {
    return [...history]
      .sort((a, b) => a.period.localeCompare(b.period))
      .map((historyData) => {
        const item = historyData.data.find((productItem) => productItem.product_id === product.product_id);

        if (!item) { return null; }

        return {
          period: historyData.period,
          price: item.current_price,
          target: item.target_price,
        };
      })
      .filter(
        (item): item is {
          period: string;
          price: number;
          target: number;
        } => item !== null,
      );
  }, [history, product.product_id]);


  // =========================================================
  // Statistics
  // =========================================================

  const prices = chartData.map((item) => item.price);

  const lowestPrice = prices.length > 0 ? Math.min(...prices) : product.current_price;
  const highestPrice = prices.length > 0 ? Math.max(...prices) : product.current_price;
  const averagePrice = prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : product.current_price;

  const previousPrice = product.previous_price ?? null;

  const priceChangePercent =
    previousPrice !== null && previousPrice !== 0
      ? ((product.current_price - previousPrice) / previousPrice) * 100
      : null;

  const targetDifference = product.current_price - product.target_price;


  function formatChange(value: number | null) {
    if (value === null) { return "N/A"; }
    if (value > 0) { return `+${value.toFixed(1)}%`; }

    return `${value.toFixed(1)}%`;
  }


  return (
    <>

      {/* Back */}

      <button
        type="button"
        onClick={onBack}
        className="app-btn app-btn-ghost mb-6 px-0"
      >
        <svg
          className="h-4 w-4"
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

        Back to Dashboard
      </button>


      {/* Product Header */}

      <div className="mb-8">

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

          <div className="min-w-0 flex-1">

            <h1 className="app-page-title leading-tight">
              {product.name}
            </h1>

            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="app-body mt-2 inline-block transition hover:text-app-text"
            >
              Open Product Page ↗
            </a>

          </div>


          <div className="shrink-0 sm:text-right">

            <p className="app-body">
              Current Price
            </p>

            <p className="mt-1 text-3xl font-bold text-app-text">
              {product.current_price.toFixed(2)}

              <span className="ml-1 text-base font-normal text-app-text-secondary">
                kr
              </span>
            </p>

          </div>

        </div>

      </div>


      {/* Statistics */}

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">

        <StatCard
          label="Target Price"
          value={`${product.target_price.toFixed(2)} kr`}
        />

        <StatCard
          label="Previous Price"
          value={previousPrice !== null ? `${previousPrice.toFixed(2)} kr` : "N/A"}
        />

        <StatCard
          label="Change"
          value={formatChange(priceChangePercent)}
          green={priceChangePercent !== null && priceChangePercent < 0}
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


      {/* Target Status */}

      <div className="mb-8">

        {product.below_target ? (

          <div className="status-success rounded-xl border px-4 py-3">

            <p className="text-sm font-medium">
              Target price reached
            </p>

            <p className="mt-1 text-sm">
              {Math.abs(targetDifference).toFixed(2)}{" "}
              kr below target
            </p>

          </div>

        ) : (

          <div className="status-unknown rounded-xl border px-4 py-3">

            <p className="text-sm font-medium">
              Above target
            </p>

            <p className="mt-1 text-sm">
              Needs to drop by{" "}
              {targetDifference.toFixed(2)}{" "}
              kr
            </p>

          </div>

        )}

      </div>


      {/* Chart */}

      <div className="app-card p-5 sm:p-6">

        <div className="mb-6">

          <h2 className="app-section-title">
            Price History
          </h2>

          <p className="app-body mt-1">
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

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="period"
                  tick={{
                    fontSize: 12,
                  }}
                />

                <YAxis
                  tick={{
                    fontSize: 12,
                  }}
                  tickFormatter={(value) => `${value} kr`}
                />

                <Tooltip
                  formatter={(value, name) => {
                    const numericValue = Number(value);

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
                  labelFormatter={(label) => `Period: ${label}`}
                />

                <ReferenceLine
                  y={product.target_price}
                  strokeDasharray="6 6"
                  label={{
                    value: `Target ${product.target_price.toFixed(0)} kr`,
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

          <div className="flex h-80 items-center justify-center">
            <p className="app-body">
              No price history available yet
            </p>
          </div>

        )}

      </div>


      {/* History Table */}

      <div className="app-card mt-6 overflow-hidden">

        <div className="border-b border-app-border px-5 py-4">

          <h2 className="app-section-title">
            Price History
          </h2>

        </div>


        <div className="divide-y divide-app-border">

          {[...chartData].reverse().map((item) => (
            <div
              key={item.period}
              className="flex items-center justify-between px-5 py-4"
            >
              <span className="app-body">
                {item.period}
              </span>

              <span className="font-semibold text-app-text">
                {item.price.toFixed(2)} kr
              </span>
            </div>
          ))}

        </div>

      </div>

    </>
  );
}


// =============================================================
// Stat Card
// =============================================================

function StatCard({
  label,
  value,
  green = false,
}: StatCardProps) {

  return (
    <div className="app-card p-5">

      <p className="app-card-title">
        {label}
      </p>

      <p className={`mt-2 text-xl font-bold ${green ? "text-success-text" : "text-app-text"}`}>
        {value}
      </p>

    </div>
  );
}
