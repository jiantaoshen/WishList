import { ExternalLink, Gift } from "lucide-react";

import {
  formatPrice,
  formatQuantity,
  numbersEqual,
} from "@/utils/price";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { cn } from "@/lib/utils";

import type { Product } from "@/types/product";


interface ProductOffersProps {
  product: Product;
}


export function ProductOffers({ product }: ProductOffersProps) {
  const comparisonQuantity = product.comparison_quantity ?? null;
  const hasComparison = comparisonQuantity !== null;

  const offers = [...(product.offers ?? [])].sort((a, b) => {
    if (hasComparison) {
      const aPrice = a.comparison_price ?? Number.POSITIVE_INFINITY;
      const bPrice = b.comparison_price ?? Number.POSITIVE_INFINITY;

      return aPrice - bPrice;
    }

    return a.price - b.price;
  });


  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Store offers</CardTitle>

            {hasComparison && (
              <Badge variant="outline">
                Comparing {comparisonQuantity} {product.unit || "units"}
              </Badge>
            )}
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            {hasComparison
              ? "Compare actual prices, unit prices and normalized totals."
              : "Compare prices and extras."}
          </p>
        </div>

        <Badge variant="secondary">
          {offers.length} {offers.length === 1 ? "store" : "stores"}
        </Badge>
      </CardHeader>


      <CardContent className="p-0">
        {offers.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            No store offers available.
          </div>
        ) : (
          <div className="divide-y">
            {offers.map(offer => {
              const unitPrice = offer.unit_price ?? null;
              const quantity = offer.unit_quantity ?? null;
              const comparisonPrice = offer.comparison_price ?? null;

              const lowestTotal =
                product.current_price !== null &&
                (hasComparison
                  ? comparisonPrice !== null &&
                    numbersEqual(comparisonPrice, product.current_price)
                  : numbersEqual(offer.price, product.current_price));

              const lowestUnit =
                product.current_unit_price !== null &&
                product.current_unit_price !== undefined &&
                unitPrice !== null &&
                numbersEqual(unitPrice, product.current_unit_price);


              return (
                <div
                  key={`${offer.store}-${offer.url}`}
                  className="grid gap-5 px-6 py-5 lg:grid-cols-[minmax(0,1fr)_auto]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{offer.store}</p>

                      {offer.price_source === "manual" && (
                        <Badge variant="outline">Manual</Badge>
                      )}

                      {lowestTotal && (
                        <Badge>Lowest total</Badge>
                      )}

                      {lowestUnit && (
                        <Badge variant="secondary">Lowest unit</Badge>
                      )}
                    </div>


                    {quantity !== null && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Package quantity:{" "}
                        <span className="font-medium text-foreground">
                          {formatQuantity(quantity)}
                          {product.unit ? ` ${product.unit}` : ""}
                        </span>
                      </p>
                    )}


                    {offer.note && (
                      <div className="mt-3 flex max-w-xl gap-2 rounded-lg border bg-muted/40 px-3 py-2">
                        <Gift className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                        <p className="text-sm">
                          {offer.note}
                        </p>
                      </div>
                    )}
                  </div>


                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
                    <div className="grid gap-4 sm:grid-cols-3 lg:text-right">
                      <PriceColumn
                        label="Actual price"
                        value={offer.price}
                        currency={product.currency}
                      />

                      <PriceColumn
                        label="Unit price"
                        value={unitPrice}
                        currency={product.currency}
                        unit={product.unit}
                        decimals={4}
                      />

                      {hasComparison && (
                        <div className="min-w-32.5">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            Comparable total
                          </p>

                          {comparisonPrice !== null ? (
                            <>
                              <p className="mt-1 font-semibold tabular-nums">
                                {formatPrice(comparisonPrice, 2)} {product.currency}
                              </p>

                              <p className="mt-1 text-xs text-muted-foreground">
                                for {formatQuantity(comparisonQuantity)} {product.unit || "units"}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="mt-1 font-medium text-muted-foreground">
                                —
                              </p>

                              <p className="mt-1 text-xs text-muted-foreground">
                                Missing unit quantity
                              </p>
                            </>
                          )}
                        </div>
                      )}
                    </div>


                    <a
                      href={offer.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({
                          variant: "outline",
                          size: "sm",
                        }),
                      )}
                    >
                      Open
                      <ExternalLink data-icon="inline-end" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


function PriceColumn({
  label,
  value,
  currency,
  unit,
  decimals = 2,
}: {
  label: string;
  value: number | null;
  currency: string;
  unit?: string | null;
  decimals?: number;
}) {
  return (
    <div className="min-w-27.5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      {value !== null ? (
        <p className="mt-1 font-semibold tabular-nums">
          {formatPrice(value, decimals)} {currency}
          {unit ? `/${unit}` : ""}
        </p>
      ) : (
        <p className="mt-1 font-medium text-muted-foreground">
          —
        </p>
      )}
    </div>
  );
}