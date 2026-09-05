import {
  AlertTriangle,
  Check,
  Minus,
  Store,
  TrendingDown,
} from "lucide-react";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type {
  Product,
} from "@/types/product";


interface ProductCardProps {
  product: Product;
  onClick: () => void;
}


// =============================================================
// Product Card
// =============================================================

export function ProductCard({
  product,
  onClick,
}: ProductCardProps) {
  const currentPrice =
    product.current_price;

  const previousPrice =
    product.previous_price;

  const currentUnitPrice =
    product.current_unit_price ??
    null;

  const totalStore =
    product.store ?? null;

  const unitStore =
    product.unit_store ?? null;

  const unit =
    product.unit ?? null;

  const offers =
    product.offers ?? [];

  const unitTarget =
    product.target_unit_price ??
    null;

  const isNotRun =
    product.status === "not_run";


  const priceDrop =
    !isNotRun &&
    currentPrice !== null &&
    previousPrice !== null &&
    currentPrice < previousPrice
      ? previousPrice - currentPrice
      : null;


  return (
    <button
      type="button"
      onClick={onClick}
      className="h-full w-full text-left"
      aria-label={`View ${product.name}`}
    >
      <Card
        className="
          h-full min-h-[320px]
          gap-0 overflow-hidden py-0
          transition-all
          hover:-translate-y-0.5
          hover:border-foreground/20
          hover:shadow-md
        "
      >
        {/* ===================================================
            Header
        =================================================== */}

        <CardHeader
          className="
            min-h-[92px]
            border-b
            px-5 py-4
          "
        >
          <div
            className="
              flex items-start
              justify-between
              gap-3
            "
          >
            <div className="min-w-0 flex-1">
              <CardTitle
                className="
                  line-clamp-2
                  text-[15px]
                  leading-5
                "
              >
                {product.name}
              </CardTitle>


              <div
                className="
                  mt-2 flex
                  items-center gap-1.5
                  text-xs
                  text-muted-foreground
                "
              >
                <Store className="size-3.5" />


                {isNotRun ? (
                  <span>
                    Waiting for first run
                  </span>
                ) : (
                  <span>
                    {offers.length}{" "}

                    {offers.length === 1
                      ? "store"
                      : "stores"}
                  </span>
                )}
              </div>
            </div>


            <ProductStatus
              status={
                product.status
              }
            />
          </div>
        </CardHeader>


        {/* ===================================================
            Prices
        =================================================== */}

        <CardContent
          className="
            grid flex-1
            grid-cols-2
            p-0
          "
        >
          {/* Total */}

          <PriceBlock
            label="Lowest Total"
            price={
              currentPrice
            }
            currency={
              product.currency
            }
            store={
              totalStore
            }
            target={
              product.target_price
            }
          />


          {/* Unit */}

          <PriceBlock
            label="Lowest Unit"
            price={
              currentUnitPrice
            }
            currency={
              product.currency
            }
            unit={
              unit
            }
            store={
              unitStore
            }
            target={
              unitTarget
            }
            borderLeft
          />
        </CardContent>


        {/* ===================================================
            Price Drop
        =================================================== */}

        <div
          className="
            min-h-8
            border-t
            px-5 py-2
          "
        >
          {isNotRun ? (
            <span
              className="
                text-xs
                text-muted-foreground
              "
            >
              Run scraper to get
              the first price
            </span>
          ) : priceDrop !== null ? (
            <div
              className="
                flex items-center
                gap-1.5
                text-xs
                font-medium
                text-emerald-600
                dark:text-emerald-400
              "
            >
              <TrendingDown className="size-3.5" />

              <span>
                {priceDrop.toFixed(2)}{" "}
                {product.currency} since last check
              </span>
            </div>
          ) : (
            <span
              className="
                text-xs
                text-muted-foreground/60
              "
            >
              No recent price drop
            </span>
          )}
        </div>


        {/* ===================================================
            Target Status
        =================================================== */}

        <CardFooter
          className="
            min-h-15
            gap-2
            border-t
            px-5 py-3
          "
        >
          {isNotRun ? (
            <Badge
              variant="outline"
              className="
                gap-1
                text-muted-foreground
              "
            >
              <Minus className="size-3" />

              Waiting for first run
            </Badge>
          ) : (
            <>
              <TotalTargetBadge
                currentPrice={
                  currentPrice
                }
                belowTarget={
                  product.below_target
                }
              />


              <UnitTargetBadge
                currentUnitPrice={
                  currentUnitPrice
                }
                targetUnitPrice={
                  unitTarget
                }
                belowTarget={
                  product.unit_below_target
                }
              />
            </>
          )}
        </CardFooter>
      </Card>
    </button>
  );
}


// =============================================================
// Price Block
// =============================================================

function PriceBlock({
  label,
  price,
  currency,
  unit,
  store,
  target,
  borderLeft = false,
}: {
  label: string;

  price: number | null;

  currency: string;

  unit?: string | null;

  store: string | null;

  target: number | null;

  borderLeft?: boolean;
}) {
  return (
    <div
      className={
        `
          min-w-0
          px-5 py-5
          ${
            borderLeft
              ? "border-l"
              : ""
          }
        `
      }
    >
      <p
        className="
          text-[11px]
          font-medium
          uppercase
          tracking-wider
          text-muted-foreground
        "
      >
        {label}
      </p>


      {/* Price */}

      <div className="mt-2 min-h-[34px]">
        {price !== null ? (
          <p
            className="
              truncate
              text-xl
              font-bold
              tracking-tight
              tabular-nums
            "
          >
            {formatPriceValue(
              price,
            )}

            <span
              className="
                ml-1
                text-xs
                font-medium
                text-muted-foreground
              "
            >
              {currency}

              {unit
                ? `/${unit}`
                : ""}
            </span>
          </p>
        ) : (
          <p
            className="
              text-xl
              font-medium
              text-muted-foreground
            "
          >
            —
          </p>
        )}
      </div>


      {/* Store */}

      <div className="mt-2 min-h-5">
        {store ? (
          <p
            className="
              truncate
              text-xs
              font-medium
            "
          >
            {store}
          </p>
        ) : (
          <p
            className="
              text-xs
              text-muted-foreground
            "
          >
            —
          </p>
        )}
      </div>


      {/* Target */}

      <div className="mt-2 min-h-5">
        {target !== null ? (
          <p
            className="
              text-[11px]
              text-muted-foreground
            "
          >
            Target{" "}

            {formatPriceValue(
              target,
            )}{" "}

            {currency}

            {unit
              ? `/${unit}`
              : ""}
          </p>
        ) : (
          <p
            className="
              text-[11px]
              text-muted-foreground/60
            "
          >
            No target
          </p>
        )}
      </div>
    </div>
  );
}


// =============================================================
// Product Status
// =============================================================

function ProductStatus({
  status,
}: {
  status:
    Product["status"];
}) {
  // -----------------------------------------------------------
  // Never run
  // -----------------------------------------------------------

  if (
    status === "not_run"
  ) {
    return (
      <Badge
        variant="outline"
        className="
          shrink-0
          text-muted-foreground
        "
      >
        Not run yet
      </Badge>
    );
  }


  // -----------------------------------------------------------
  // Failed
  // -----------------------------------------------------------

  if (
    status === "failed"
  ) {
    return (
      <Badge
        variant="destructive"
        className="shrink-0"
      >
        Failed
      </Badge>
    );
  }


  // -----------------------------------------------------------
  // Suspicious
  // -----------------------------------------------------------

  if (
    status === "suspicious"
  ) {
    return (
      <Badge
        variant="outline"
        className="
          shrink-0
          gap-1
        "
      >
        <AlertTriangle className="size-3" />

        Check
      </Badge>
    );
  }


  // Success does not need a badge.
  return null;
}


// =============================================================
// Total Target Badge
// =============================================================

function TotalTargetBadge({
  currentPrice,
  belowTarget,
}: {
  currentPrice:
    number | null;

  belowTarget:
    boolean | null;
}) {
  if (
    currentPrice === null
  ) {
    return (
      <Badge
        variant="outline"
        className="
          gap-1
          text-muted-foreground
        "
      >
        <Minus className="size-3" />

        No total price
      </Badge>
    );
  }


  if (
    belowTarget === true
  ) {
    return (
      <Badge
        variant="default"
        className="gap-1"
      >
        <Check className="size-3" />

        Below total
      </Badge>
    );
  }


  return (
    <Badge variant="outline">
      Above total
    </Badge>
  );
}


// =============================================================
// Unit Target Badge
// =============================================================

function UnitTargetBadge({
  currentUnitPrice,
  targetUnitPrice,
  belowTarget,
}: {
  currentUnitPrice:
    number | null;

  targetUnitPrice:
    number | null;

  belowTarget:
    boolean |
    null |
    undefined;
}) {
  if (
    targetUnitPrice === null
  ) {
    return (
      <Badge
        variant="outline"
        className="
          text-muted-foreground
        "
      >
        Unit target off
      </Badge>
    );
  }


  if (
    currentUnitPrice === null
  ) {
    return (
      <Badge
        variant="outline"
        className="
          gap-1
          text-muted-foreground
        "
      >
        <Minus className="size-3" />

        No unit price
      </Badge>
    );
  }


  if (
    belowTarget === true
  ) {
    return (
      <Badge
        variant="secondary"
        className="gap-1"
      >
        <Check className="size-3" />

        Below unit
      </Badge>
    );
  }


  return (
    <Badge variant="outline">
      Above unit
    </Badge>
  );
}


// =============================================================
// Format
// =============================================================

function formatPriceValue(
  value: number,
): string {
  return value.toLocaleString(
    "sv-SE",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );
}