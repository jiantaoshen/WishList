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


interface HistoryPoint {
  period: string;
  price: number | null;
  unitPrice: number | null;
}


interface ChartPoint {
  period: string;
  value: number;
}


interface PriceChartProps {
  title: string;
  subtitle: string;

  data: ChartPoint[];

  currency: string;

  target: number | null;
  targetLabel: string | null;
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

  const currency =
    product.currency;


  const currentPrice =
    product.current_price ?? null;


  const previousPrice =
    product.previous_price ?? null;


  const currentUnitPrice =
    product.current_unit_price ?? null;


  const previousUnitPrice =
    product.previous_unit_price ?? null;


  const targetUnitPrice =
    product.target_unit_price ?? null;


  const bestStore =
    product.store ?? null;


  const bestUnitStore =
    product.unit_store ?? null;


  const bestTotalUrl =
    product.url ?? null;


  const bestUnitUrl =
    product.unit_url ?? null;


  const unit =
    product.unit ?? null;


  const offers =
    product.offers ?? [];


  // =========================================================
  // Base History Data
  // =========================================================

  const historyPoints =
    useMemo<HistoryPoint[]>(() => {

      const points: HistoryPoint[] = [];


      const sortedHistory =
        [...history].sort(
          (a, b) =>
            a.period.localeCompare(
              b.period
            )
        );


      for (
        const historyData
        of sortedHistory
      ) {

        const item =
          historyData.data.find(
            (candidate) =>
              candidate.product_id ===
              product.product_id
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
          period:
            historyData.period,

          price,

          unitPrice,
        });
      }


      return points;

    }, [
      history,
      product.product_id,
    ]);


  // =========================================================
  // Total Price Chart Data
  //
  // Important:
  // ChartPoint.value is ALWAYS number.
  // No "as number" is needed.
  // =========================================================

  const totalPriceChartData =
    useMemo<ChartPoint[]>(() => {

      const points: ChartPoint[] = [];


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


  // =========================================================
  // Unit Price Chart Data
  // =========================================================

  const unitPriceChartData =
    useMemo<ChartPoint[]>(() => {

      const points: ChartPoint[] = [];


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


  // =========================================================
  // Total Price Statistics
  // =========================================================

  const totalPrices =
    totalPriceChartData.map(
      (item) => item.value
    );


  const historicalLow =
    totalPrices.length > 0

      ? Math.min(
          ...totalPrices
        )

      : currentPrice;


  const historicalHigh =
    totalPrices.length > 0

      ? Math.max(
          ...totalPrices
        )

      : currentPrice;


  const historicalAverage =
    totalPrices.length > 0

      ? (
          totalPrices.reduce(
            (sum, price) =>
              sum + price,
            0
          )
          /
          totalPrices.length
        )

      : currentPrice;


  // =========================================================
  // Unit Price Statistics
  // =========================================================

  const unitPrices =
    unitPriceChartData.map(
      (item) => item.value
    );


  const historicalUnitLow =
    unitPrices.length > 0

      ? Math.min(
          ...unitPrices
        )

      : currentUnitPrice;


  const historicalUnitHigh =
    unitPrices.length > 0

      ? Math.max(
          ...unitPrices
        )

      : currentUnitPrice;


  const historicalUnitAverage =
    unitPrices.length > 0

      ? (
          unitPrices.reduce(
            (sum, price) =>
              sum + price,
            0
          )
          /
          unitPrices.length
        )

      : currentUnitPrice;


  // =========================================================
  // Changes
  // =========================================================

  const priceChangePercent =
    currentPrice !== null &&
    previousPrice !== null &&
    previousPrice !== 0

      ? (
          (
            currentPrice -
            previousPrice
          )
          /
          previousPrice
        ) * 100

      : null;


  const unitPriceChangePercent =
    currentUnitPrice !== null &&
    previousUnitPrice !== null &&
    previousUnitPrice !== 0

      ? (
          (
            currentUnitPrice -
            previousUnitPrice
          )
          /
          previousUnitPrice
        ) * 100

      : null;


  const targetDifference =
    currentPrice !== null

      ? (
          currentPrice -
          product.target_price
        )

      : null;


  const unitTargetDifference =
    currentUnitPrice !== null &&
    targetUnitPrice !== null

      ? (
          currentUnitPrice -
          targetUnitPrice
        )

      : null;


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
          Product Header
      ===================================================== */}

      <div className="mb-8">

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

          {/* Product */}

          <div className="min-w-0 flex-1">

            <h1 className="app-page-title leading-tight">
              {product.name}
            </h1>


            {/* Best total store */}

            {bestStore && (

              <p className="app-body mt-2">

                Lowest total at{" "}

                <span className="font-medium text-app-text">
                  {bestStore}
                </span>

              </p>

            )}


            {/* Best unit store */}

            {bestUnitStore && (

              <p className="app-body mt-1">

                Lowest unit price at{" "}

                <span className="font-medium text-app-text">
                  {bestUnitStore}
                </span>

              </p>

            )}


            {/* Total link */}

            {bestTotalUrl && (

              <a
                href={bestTotalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="app-body mt-3 inline-block transition hover:text-app-text"
              >
                Open lowest total offer ↗
              </a>

            )}


            {/* Unit link */}

            {bestUnitUrl &&
             bestUnitUrl !==
               bestTotalUrl && (

              <a
                href={bestUnitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="app-body ml-4 mt-3 inline-block transition hover:text-app-text"
              >
                Open lowest unit offer ↗
              </a>

            )}

          </div>


          {/* Current Prices */}

          <div className="shrink-0 sm:text-right">

            <p className="app-body">
              Lowest Total
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


            {currentUnitPrice !== null && (

              <div className="mt-3">

                <p className="app-muted text-xs">
                  Lowest Unit Price
                </p>

                <p className="font-semibold text-app-text">

                  {currentUnitPrice.toFixed(4)}{" "}

                  {currency}

                  {unit
                    ? `/${unit}`
                    : ""}

                </p>

              </div>

            )}

          </div>

        </div>

      </div>


      {/* =====================================================
          Total Price Statistics
      ===================================================== */}

      <div className="mb-4">

        <h2 className="app-section-title">
          Total Price
        </h2>

      </div>


      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">

        <StatCard
          label="Current"
          value={
            formatPrice(
              currentPrice,
              currency
            )
          }
        />


        <StatCard
          label="Target"
          value={
            formatPrice(
              product.target_price,
              currency
            )
          }
        />


        <StatCard
          label="Previous"
          value={
            formatPrice(
              previousPrice,
              currency
            )
          }
        />


        <StatCard
          label="Change"
          value={
            formatPercent(
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
          value={
            formatPrice(
              historicalLow,
              currency
            )
          }
          green={
            historicalLow !== null
          }
        />


        <StatCard
          label="Historical Average"
          value={
            formatPrice(
              historicalAverage,
              currency
            )
          }
        />

      </div>


      {/* =====================================================
          Total Target Status
      ===================================================== */}

      <div className="mb-8">

        {currentPrice === null ? (

          <div className="status-unknown rounded-xl border px-4 py-3">

            <p className="text-sm font-medium">
              Total price unavailable
            </p>

            <p className="mt-1 text-sm">
              No valid current total price was collected.
            </p>

          </div>

        ) : (
          product.below_target === true &&
          targetDifference !== null
        ) ? (

          <div className="status-success rounded-xl border px-4 py-3">

            <p className="text-sm font-medium">
              Total target reached
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
              Total price above target
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
          Unit Price Statistics
      ===================================================== */}

      {(
        currentUnitPrice !== null ||
        targetUnitPrice !== null ||
        unitPrices.length > 0
      ) && (
        <>

          <div className="mb-4">

            <h2 className="app-section-title">
              Unit Price
            </h2>

          </div>


          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">

            <StatCard
              label="Current Unit"
              value={
                formatUnitPrice(
                  currentUnitPrice,
                  currency,
                  unit
                )
              }
            />


            <StatCard
              label="Unit Target"
              value={
                formatUnitPrice(
                  targetUnitPrice,
                  currency,
                  unit
                )
              }
            />


            <StatCard
              label="Previous Unit"
              value={
                formatUnitPrice(
                  previousUnitPrice,
                  currency,
                  unit
                )
              }
            />


            <StatCard
              label="Change"
              value={
                formatPercent(
                  unitPriceChangePercent
                )
              }
              green={
                unitPriceChangePercent !==
                  null &&
                unitPriceChangePercent < 0
              }
            />


            <StatCard
              label="Historical Unit Low"
              value={
                formatUnitPrice(
                  historicalUnitLow,
                  currency,
                  unit
                )
              }
              green={
                historicalUnitLow !== null
              }
            />


            <StatCard
              label="Historical Unit Average"
              value={
                formatUnitPrice(
                  historicalUnitAverage,
                  currency,
                  unit
                )
              }
            />

          </div>


          {/* Unit target status */}

          {targetUnitPrice !== null && (

            <div className="mb-8">

              {currentUnitPrice === null ? (

                <div className="status-unknown rounded-xl border px-4 py-3">

                  <p className="text-sm font-medium">
                    Unit price unavailable
                  </p>

                  <p className="mt-1 text-sm">
                    No valid unit price was collected.
                  </p>

                </div>

              ) : (
                product.unit_below_target ===
                  true &&
                unitTargetDifference !==
                  null
              ) ? (

                <div className="status-success rounded-xl border px-4 py-3">

                  <p className="text-sm font-medium">
                    Unit price target reached
                  </p>

                  <p className="mt-1 text-sm">

                    {Math.abs(
                      unitTargetDifference
                    ).toFixed(4)}{" "}

                    {currency}

                    {unit
                      ? `/${unit}`
                      : ""}{" "}

                    below target

                  </p>

                </div>

              ) : unitTargetDifference !==
                null ? (

                <div className="status-unknown rounded-xl border px-4 py-3">

                  <p className="text-sm font-medium">
                    Unit price above target
                  </p>

                  <p className="mt-1 text-sm">

                    Needs to drop by{" "}

                    {Math.abs(
                      unitTargetDifference
                    ).toFixed(4)}{" "}

                    {currency}

                    {unit
                      ? `/${unit}`
                      : ""}

                  </p>

                </div>

              ) : null}

            </div>

          )}

        </>
      )}


      {/* =====================================================
          Store Offers
      ===================================================== */}

      <div className="app-card mb-8 overflow-hidden">

        <div className="border-b border-app-border px-5 py-4">

          <div className="flex items-center justify-between gap-4">

            <div>

              <h2 className="app-section-title">
                Store Offers
              </h2>

              <p className="app-body mt-1">
                Compare total price, unit price and extras.
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

                const offerUnitPrice =
                  offer.unit_price ??
                  null;


                const offerQuantity =
                  offer.unit_quantity ??
                  null;


                const note =
                  offer.note ?? null;


                const isCheapestTotal =
                  currentPrice !== null &&
                  offer.price ===
                    currentPrice;


                const isCheapestUnit =
                  currentUnitPrice !== null &&
                  offerUnitPrice !== null &&
                  offerUnitPrice ===
                    currentUnitPrice;


                return (

                  <div
                    key={
                      `${offer.store}-${offer.url}`
                    }
                    className="px-5 py-4"
                  >

                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                      {/* Store Info */}

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <p className="font-semibold text-app-text">
                            {offer.store}
                          </p>


                          {isCheapestTotal && (

                            <span className="status-success rounded-full border px-2 py-0.5 text-[11px] font-medium">
                              Lowest Total
                            </span>

                          )}


                          {isCheapestUnit && (

                            <span className="status-success rounded-full border px-2 py-0.5 text-[11px] font-medium">
                              Lowest Unit
                            </span>

                          )}

                        </div>


                        {/* Quantity */}

                        {offerQuantity !== null && (

                          <p className="app-muted mt-2 text-xs">

                            Quantity:{" "}

                            {offerQuantity}

                            {unit
                              ? ` ${unit}`
                              : ""}

                          </p>

                        )}


                        {/* URL */}

                        <a
                          href={offer.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="app-muted mt-1 block max-w-xl truncate text-xs transition hover:text-app-text"
                        >
                          {offer.url}
                        </a>


                        {/* Note */}

                        {note && (

                          <div className="mt-3 rounded-lg bg-surface-muted px-3 py-2">

                            <p className="text-sm text-app-text-secondary">
                              🎁 {note}
                            </p>

                          </div>

                        )}

                      </div>


                      {/* Price */}

                      <div className="shrink-0 md:text-right">

                        <p className="text-lg font-bold text-app-text">

                          {offer.price.toFixed(2)}{" "}

                          <span className="text-sm font-normal">
                            {currency}
                          </span>

                        </p>


                        {offerUnitPrice !== null && (

                          <p className="app-muted mt-1 text-sm">

                            {offerUnitPrice.toFixed(4)}{" "}

                            {currency}

                            {unit
                              ? `/${unit}`
                              : ""}

                          </p>

                        )}


                        <a
                          href={offer.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="app-btn app-btn-secondary mt-3 inline-flex px-3 py-2 text-sm"
                        >
                          Open ↗
                        </a>

                      </div>

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
          Total Price Chart
      ===================================================== */}

      <PriceChart
        title="Total Price History"
        subtitle="Weekly lowest total price"

        data={
          totalPriceChartData
        }

        currency={
          currency
        }

        target={
          product.target_price
        }

        targetLabel={
          `Target ${product.target_price.toFixed(2)} ${currency}`
        }
      />


      {/* =====================================================
          Unit Price Chart
      ===================================================== */}

      {unitPriceChartData.length > 0 && (

        <div className="mt-6">

          <PriceChart
            title="Unit Price History"
            subtitle="Weekly lowest unit price"

            data={
              unitPriceChartData
            }

            currency={
              unit
                ? `${currency}/${unit}`
                : currency
            }

            target={
              targetUnitPrice
            }

            targetLabel={
              targetUnitPrice !== null

                ? (
                    `Target ${targetUnitPrice.toFixed(4)} ${currency}`
                    +
                    (
                      unit
                        ? `/${unit}`
                        : ""
                    )
                  )

                : null
            }
          />

        </div>

      )}


      {/* =====================================================
          History Table
      ===================================================== */}

      <div className="app-card mt-6 overflow-hidden">

        <div className="border-b border-app-border px-5 py-4">

          <h2 className="app-section-title">
            Price History
          </h2>

        </div>


        {historyPoints.length > 0 ? (

          <div className="divide-y divide-app-border">

            {[...historyPoints]

              .reverse()

              .map((item) => (

                <div
                  key={item.period}
                  className="grid gap-3 px-5 py-4 md:grid-cols-3 md:items-center"
                >

                  {/* Period */}

                  <span className="app-body">
                    {item.period}
                  </span>


                  {/* Total */}

                  <div>

                    <p className="app-muted text-xs">
                      Total
                    </p>

                    <p className="font-semibold text-app-text">

                      {item.price !== null

                        ? (
                            `${item.price.toFixed(2)} ${currency}`
                          )

                        : "N/A"}

                    </p>

                  </div>


                  {/* Unit */}

                  <div>

                    <p className="app-muted text-xs">
                      Unit
                    </p>

                    <p className="font-semibold text-app-text">

                      {item.unitPrice !== null

                        ? (
                            `${item.unitPrice.toFixed(4)} ${currency}`
                            +
                            (
                              unit
                                ? `/${unit}`
                                : ""
                            )
                          )

                        : "N/A"}

                    </p>

                  </div>

                </div>

              ))}

          </div>

        ) : (

          <div className="px-5 py-10 text-center">

            <p className="app-body">
              No price history available.
            </p>

          </div>

        )}

      </div>


      {/* =====================================================
          Extra Statistics
      ===================================================== */}

      {(historicalHigh !== null ||
        historicalUnitHigh !== null) && (

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">

          <StatCard
            label="Historical Total High"
            value={
              formatPrice(
                historicalHigh,
                currency
              )
            }
          />


          <StatCard
            label="Historical Unit High"
            value={
              formatUnitPrice(
                historicalUnitHigh,
                currency,
                unit
              )
            }
          />

        </div>

      )}

    </>
  );
}


// =============================================================
// Price Chart
// =============================================================

function PriceChart({
  title,
  subtitle,
  data,
  currency,
  target,
  targetLabel,
}: PriceChartProps) {

  return (

    <div className="app-card p-5 sm:p-6">

      {/* Header */}

      <div className="mb-6">

        <h2 className="app-section-title">
          {title}
        </h2>

        <p className="app-body mt-1">
          {subtitle}
        </p>

      </div>


      {/* Chart */}

      {data.length > 0 ? (

        <div className="h-80">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <LineChart
              data={data}
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
                  value
                ) => {

                  const numericValue =
                    Number(value);


                  return [
                    `${numericValue.toFixed(4)} ${currency}`,
                    "Price",
                  ];

                }}

                labelFormatter={(
                  label
                ) =>
                  `Period: ${label}`
                }
              />


              {target !== null && (

                <ReferenceLine
                  y={target}
                  strokeDasharray="6 6"

                  label={
                    targetLabel
                      ? {
                          value:
                            targetLabel,

                          position:
                            "insideTopRight",

                          fontSize: 12,
                        }
                      : undefined
                  }
                />

              )}


              <Line
                type="monotone"
                dataKey="value"
                strokeWidth={3}

                dot={{
                  r: 5,
                }}

                activeDot={{
                  r: 7,
                }}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

      ) : (

        <div className="flex h-80 items-center justify-center">

          <p className="app-body">
            No price history available.
          </p>

        </div>

      )}

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


// =============================================================
// Format Total Price
// =============================================================

function formatPrice(
  price: number | null,
  currency: string,
): string {

  if (price === null) {
    return "N/A";
  }


  return (
    `${price.toFixed(2)} ${currency}`
  );
}


// =============================================================
// Format Unit Price
// =============================================================

function formatUnitPrice(
  price: number | null,
  currency: string,
  unit?: string | null,
): string {

  if (price === null) {
    return "N/A";
  }


  return (
    `${price.toFixed(4)} ${currency}`
    +
    (
      unit
        ? `/${unit}`
        : ""
    )
  );
}


// =============================================================
// Format Percentage
// =============================================================

function formatPercent(
  value: number | null,
): string {

  if (value === null) {
    return "N/A";
  }


  if (value > 0) {
    return `+${value.toFixed(1)}%`;
  }


  return `${value.toFixed(1)}%`;
}