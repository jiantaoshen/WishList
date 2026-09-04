import { useMemo } from "react";

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
  Product,
} from "../../types/product";


// =============================================================
// Types
// =============================================================

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
  // Local Values
  // =========================================================

  const currentPrice =
    product.current_price;

  const previousPrice =
    product.previous_price;

  const currency =
    product.currency;

  const bestStore =
    product.store ?? null;

  const offers =
    product.offers ?? [];


  // =========================================================
  // Chart Data
  // =========================================================

  const chartData = useMemo(() => {

    return [...history]

      .sort(
        (a, b) =>
          a.period.localeCompare(
            b.period
          )
      )

      .map((historyData) => {

        const item =
          historyData.data.find(
            (productItem) =>
              productItem.product_id ===
              product.product_id
          );


        if (
          !item ||
          item.current_price === null
        ) {
          return null;
        }


        return {
          period: historyData.period,
          price: item.current_price,
          target: item.target_price,
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

  }, [
    history,
    product.product_id,
  ]);


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
      : currentPrice;


  const highestPrice =
    prices.length > 0
      ? Math.max(...prices)
      : currentPrice;


  const averagePrice =
    prices.length > 0
      ? (
          prices.reduce(
            (sum, price) =>
              sum + price,
            0
          ) / prices.length
        )
      : currentPrice;


  const priceChangePercent =
    currentPrice !== null &&
    previousPrice !== null &&
    previousPrice !== 0
      ? (
          (
            currentPrice -
            previousPrice
          ) /
          previousPrice
        ) * 100
      : null;


  const targetDifference =
    currentPrice !== null
      ? currentPrice -
        product.target_price
      : null;


  // =========================================================
  // Helpers
  // =========================================================

  function formatPrice(
    value: number | null
  ) {

    if (value === null) {
      return "N/A";
    }

    return (
      `${value.toFixed(2)} ${currency}`
    );

  }


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


  // =========================================================
  // UI
  // =========================================================

  return (
    <>

      {/* =====================================================
          Back
      ===================================================== */}

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


      {/* =====================================================
          Header
      ===================================================== */}

      <div className="mb-8">

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

          <div className="min-w-0 flex-1">

            <h1 className="app-page-title leading-tight">
              {product.name}
            </h1>


            {bestStore && (

              <p className="app-body mt-2">

                Cheapest at{" "}

                <span className="font-medium text-app-text">
                  {bestStore}
                </span>

              </p>

            )}


            {product.url && (

              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="app-body mt-2 inline-block transition hover:text-app-text"
              >
                Open Cheapest Product Page ↗
              </a>

            )}

          </div>


          {/* Current Price */}

          <div className="shrink-0 sm:text-right">

            <p className="app-body">
              Current Price
            </p>


            {currentPrice !== null ? (

              <p className="mt-1 text-3xl font-bold text-app-text">

                {currentPrice.toFixed(2)}

                <span className="ml-1 text-base font-normal text-app-text-secondary">
                  {currency}
                </span>

              </p>

            ) : (

              <p className="mt-1 text-2xl font-bold text-app-text-secondary">
                N/A
              </p>

            )}

          </div>

        </div>

      </div>


      {/* =====================================================
          Statistics
      ===================================================== */}

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">

        <StatCard
          label="Target Price"
          value={formatPrice(
            product.target_price
          )}
        />


        <StatCard
          label="Previous Price"
          value={formatPrice(
            previousPrice
          )}
        />


        <StatCard
          label="Change"
          value={formatChange(
            priceChangePercent
          )}
          green={
            priceChangePercent !== null &&
            priceChangePercent < 0
          }
        />


        <StatCard
          label="Historical Low"
          value={formatPrice(
            lowestPrice
          )}
          green={
            lowestPrice !== null
          }
        />


        <StatCard
          label="Historical High"
          value={formatPrice(
            highestPrice
          )}
        />


        <StatCard
          label="Historical Average"
          value={formatPrice(
            averagePrice
          )}
        />

      </div>


      {/* =====================================================
          Target Status
      ===================================================== */}

      <div className="mb-8">

        {currentPrice === null ? (

          <div className="status-unknown rounded-xl border px-4 py-3">

            <p className="text-sm font-medium">
              Price unavailable
            </p>

            <p className="mt-1 text-sm">
              No valid current price was collected.
            </p>

          </div>

        ) : (
          product.below_target === true &&
          targetDifference !== null
        ) ? (

          <div className="status-success rounded-xl border px-4 py-3">

            <p className="text-sm font-medium">
              Target price reached
            </p>

            <p className="mt-1 text-sm">

              {Math.abs(
                targetDifference
              ).toFixed(2)}{" "}

              {currency} below target

            </p>

          </div>

        ) : targetDifference !== null ? (

          <div className="status-unknown rounded-xl border px-4 py-3">

            <p className="text-sm font-medium">
              Above target
            </p>

            <p className="mt-1 text-sm">

              Needs to drop by{" "}

              {Math.abs(
                targetDifference
              ).toFixed(2)}{" "}

              {currency}

            </p>

          </div>

        ) : null}

      </div>


      {/* =====================================================
          Store Offers
      ===================================================== */}

      <div className="app-card mb-6 overflow-hidden">

        <div className="border-b border-app-border px-5 py-4">

          <div className="flex items-center justify-between gap-4">

            <div>

              <h2 className="app-section-title">
                Store Offers
              </h2>

              <p className="app-body mt-1">
                Current prices from monitored stores
              </p>

            </div>


            <span className="app-muted">

              {offers.length}{" "}

              {offers.length === 1
                ? "store"
                : "stores"}

            </span>

          </div>

        </div>


        {offers.length > 0 ? (

          <div className="divide-y divide-app-border">

            {[...offers]

              .sort(
                (a, b) =>
                  a.price - b.price
              )

              .map((offer) => {

                const isCheapest =
                  currentPrice !== null &&
                  offer.price ===
                    currentPrice;


                return (

                  <div
                    key={`${offer.store}-${offer.url}`}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >

                    {/* Store */}

                    <div className="min-w-0">

                      <div className="flex items-center gap-2">

                        <p className="font-medium text-app-text">
                          {offer.store}
                        </p>


                        {isCheapest && (

                          <span className="status-success rounded-full border px-2 py-0.5 text-[11px] font-medium">
                            Cheapest
                          </span>

                        )}

                      </div>


                      <a
                        href={offer.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="app-muted mt-1 block max-w-xl truncate transition hover:text-app-text"
                      >
                        {offer.url}
                      </a>

                    </div>


                    {/* Price */}

                    <div className="flex shrink-0 items-center gap-4">

                      <p
                        className={
                          `text-lg font-bold ${
                            isCheapest
                              ? "text-success-text"
                              : "text-app-text"
                          }`
                        }
                      >

                        {offer.price.toFixed(2)}{" "}

                        <span className="text-sm font-normal">
                          {currency}
                        </span>

                      </p>


                      <a
                        href={offer.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="app-btn app-btn-secondary px-3 py-2 text-sm"
                      >
                        Open ↗
                      </a>

                    </div>

                  </div>

                );

              })}

          </div>

        ) : (

          <div className="px-5 py-10 text-center">

            <p className="app-body">
              No store offers available.
            </p>

          </div>

        )}

      </div>


      {/* =====================================================
          Chart
      ===================================================== */}

      <div className="app-card p-5 sm:p-6">

        <div className="mb-6">

          <h2 className="app-section-title">
            Price History
          </h2>

          <p className="app-body mt-1">
            Weekly lowest recorded price
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
                  tick={{
                    fontSize: 12,
                  }}
                />


                <YAxis
                  tick={{
                    fontSize: 12,
                  }}
                  tickFormatter={(
                    value
                  ) =>
                    `${value} ${currency}`
                  }
                />


                <Tooltip
                  formatter={(
                    value,
                    name
                  ) => {

                    const numericValue =
                      Number(value);


                    if (
                      name === "price"
                    ) {

                      return [
                        `${numericValue.toFixed(2)} ${currency}`,
                        "Price",
                      ];

                    }


                    return [
                      `${numericValue.toFixed(2)} ${currency}`,
                      "Target",
                    ];

                  }}

                  labelFormatter={(
                    label
                  ) =>
                    `Period: ${label}`
                  }
                />


                <ReferenceLine
                  y={
                    product.target_price
                  }

                  strokeDasharray="6 6"

                  label={{
                    value:
                      `Target ${product.target_price.toFixed(0)} ${currency}`,
                    position:
                      "insideTopRight",
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


      {/* =====================================================
          History Table
      ===================================================== */}

      <div className="app-card mt-6 overflow-hidden">

        <div className="border-b border-app-border px-5 py-4">

          <h2 className="app-section-title">
            Price History
          </h2>

        </div>


        {chartData.length > 0 ? (

          <div className="divide-y divide-app-border">

            {[...chartData]

              .reverse()

              .map((item) => (

                <div
                  key={item.period}
                  className="flex items-center justify-between px-5 py-4"
                >

                  <span className="app-body">
                    {item.period}
                  </span>


                  <span className="font-semibold text-app-text">

                    {item.price.toFixed(2)}{" "}

                    {currency}

                  </span>

                </div>

              ))}

          </div>

        ) : (

          <div className="px-5 py-8 text-center">

            <p className="app-body">
              No price history available.
            </p>

          </div>

        )}

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


      <p
        className={
          `mt-2 text-xl font-bold ${
            green
              ? "text-success-text"
              : "text-app-text"
          }`
        }
      >
        {value}
      </p>

    </div>

  );
}