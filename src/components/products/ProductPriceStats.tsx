import {
  CheckCircle2,
  Minus,
} from "lucide-react";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import type {
  Product,
} from "@/types/product";


interface ProductPriceStatsProps {
  product: Product;

  totalLow: number | null;
  totalHigh: number | null;
  totalAverage: number | null;

  unitLow: number | null;
  unitHigh: number | null;
  unitAverage: number | null;
}


export function ProductPriceStats({
  product,
  totalLow,
  totalHigh,
  totalAverage,
  unitLow,
  unitHigh,
  unitAverage,
}: ProductPriceStatsProps) {
  const unit =
    product.unit ?? null;

  const currentUnit =
    product.current_unit_price ??
    null;

  const unitTarget =
    product.target_unit_price ??
    null;


  return (
    <div className="space-y-6">
      {/* Total */}

      <section className="space-y-3">
        <div
          className="
            flex items-center
            justify-between
          "
        >
          <h2 className="font-semibold">
            Total price
          </h2>

          <TargetBadge
            hasPrice={
              product.current_price !==
              null
            }
            below={
              product.below_target
            }
            label="total"
          />
        </div>


        <div
          className="
            grid grid-cols-2
            gap-3
            md:grid-cols-3
            xl:grid-cols-6
          "
        >
          <Stat
            label="Current"
            value={formatPrice(
              product.current_price,
              product.currency,
            )}
          />

          <Stat
            label="Target"
            value={formatPrice(
              product.target_price,
              product.currency,
            )}
          />

          <Stat
            label="Previous"
            value={formatPrice(
              product.previous_price,
              product.currency,
            )}
          />

          <Stat
            label="Historical low"
            value={formatPrice(
              totalLow,
              product.currency,
            )}
          />

          <Stat
            label="Historical high"
            value={formatPrice(
              totalHigh,
              product.currency,
            )}
          />

          <Stat
            label="Average"
            value={formatPrice(
              totalAverage,
              product.currency,
            )}
          />
        </div>
      </section>


      {/* Unit */}

      {(
        currentUnit !== null ||
        unitTarget !== null ||
        unitLow !== null
      ) && (
        <section className="space-y-3">
          <div
            className="
              flex items-center
              justify-between
            "
          >
            <h2 className="font-semibold">
              Unit price
            </h2>

            {unitTarget !== null ? (
              <TargetBadge
                hasPrice={
                  currentUnit !== null
                }
                below={
                  product.unit_below_target
                }
                label="unit"
              />
            ) : (
              <Badge variant="outline">
                Unit target off
              </Badge>
            )}
          </div>


          <div
            className="
              grid grid-cols-2
              gap-3
              md:grid-cols-3
              xl:grid-cols-6
            "
          >
            <Stat
              label="Current"
              value={formatUnitPrice(
                currentUnit,
                product.currency,
                unit,
              )}
            />

            <Stat
              label="Target"
              value={formatUnitPrice(
                unitTarget,
                product.currency,
                unit,
              )}
            />

            <Stat
              label="Previous"
              value={formatUnitPrice(
                product.previous_unit_price ??
                  null,
                product.currency,
                unit,
              )}
            />

            <Stat
              label="Historical low"
              value={formatUnitPrice(
                unitLow,
                product.currency,
                unit,
              )}
            />

            <Stat
              label="Historical high"
              value={formatUnitPrice(
                unitHigh,
                product.currency,
                unit,
              )}
            />

            <Stat
              label="Average"
              value={formatUnitPrice(
                unitAverage,
                product.currency,
                unit,
              )}
            />
          </div>
        </section>
      )}
    </div>
  );
}


function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p
          className="
            text-xs
            text-muted-foreground
          "
        >
          {label}
        </p>

        <p
          className="
            mt-2 truncate
            font-semibold
            tabular-nums
          "
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}


function TargetBadge({
  hasPrice,
  below,
  label,
}: {
  hasPrice: boolean;

  below:
    boolean | null | undefined;

  label: string;
}) {
  if (!hasPrice) {
    return (
      <Badge
        variant="outline"
        className="gap-1"
      >
        <Minus className="size-3" />
        No price
      </Badge>
    );
  }


  if (below === true) {
    return (
      <Badge className="gap-1">
        <CheckCircle2 className="size-3" />

        Below {label} target
      </Badge>
    );
  }


  return (
    <Badge variant="outline">
      Above {label} target
    </Badge>
  );
}


function formatPrice(
  value: number | null,
  currency: string,
) {
  if (value === null) {
    return "—";
  }

  return `${value.toLocaleString(
    "sv-SE",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )} ${currency}`;
}


function formatUnitPrice(
  value: number | null,
  currency: string,
  unit: string | null,
) {
  if (value === null) {
    return "—";
  }

  return (
    `${value.toLocaleString(
      "sv-SE",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      },
    )} ${currency}`
    +
    (
      unit
        ? `/${unit}`
        : ""
    )
  );
}