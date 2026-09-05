import {
  ExternalLink,
  Gift,
} from "lucide-react";

import {
  Badge,
} from "@/components/ui/badge";

import {
  buttonVariants,
} from "@/components/ui/button";

import {
  cn,
} from "@/lib/utils";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type {
  Product,
} from "@/types/product";


interface ProductOffersProps {
  product: Product;
}


export function ProductOffers({
  product,
}: ProductOffersProps) {
  const offers =
    [...(product.offers ?? [])]
      .sort(
        (a, b) =>
          a.price - b.price,
      );


  return (
    <Card>
      <CardHeader
        className="
          flex-row
          items-center
          justify-between
        "
      >
        <div>
          <CardTitle>
            Store offers
          </CardTitle>

          <p
            className="
              mt-1 text-sm
              text-muted-foreground
            "
          >
            Compare prices and extras
          </p>
        </div>

        <Badge variant="secondary">
          {offers.length} stores
        </Badge>
      </CardHeader>


      <CardContent className="p-0">
        {offers.length === 0 ? (
          <div
            className="
              px-6 py-12
              text-center
              text-sm
              text-muted-foreground
            "
          >
            No store offers available.
          </div>
        ) : (
          <div className="divide-y">
            {offers.map((offer) => {
              const unitPrice =
                offer.unit_price ??
                null;

              const quantity =
                offer.unit_quantity ??
                null;

              const lowestTotal =
                product.current_price !==
                  null &&
                offer.price ===
                  product.current_price;

              const lowestUnit =
                product.current_unit_price !==
                  null &&
                product.current_unit_price !==
                  undefined &&
                unitPrice !== null &&
                unitPrice ===
                  product.current_unit_price;


              return (
                <div
                  key={
                    `${offer.store}-${offer.url}`
                  }
                  className="
                    grid gap-4
                    px-6 py-5
                    lg:grid-cols-[1fr_auto]
                  "
                >
                  <div className="min-w-0">
                    <div
                      className="
                        flex flex-wrap
                        items-center gap-2
                      "
                    >
                      <p className="font-semibold">
                        {offer.store}
                      </p>

                      {lowestTotal && (
                        <Badge>
                          Lowest total
                        </Badge>
                      )}

                      {lowestUnit && (
                        <Badge variant="secondary">
                          Lowest unit
                        </Badge>
                      )}
                    </div>


                    {quantity !== null && (
                      <p
                        className="
                          mt-2 text-sm
                          text-muted-foreground
                        "
                      >
                        Quantity:{" "}
                        {quantity}

                        {product.unit
                          ? ` ${product.unit}`
                          : ""}
                      </p>
                    )}


                    {offer.note && (
                      <div
                        className="
                          mt-3 flex
                          max-w-xl gap-2
                          rounded-lg
                          border
                          bg-muted/40
                          px-3 py-2
                        "
                      >
                        <Gift
                          className="
                            mt-0.5
                            size-4
                            shrink-0
                            text-muted-foreground
                          "
                        />

                        <p className="text-sm">
                          {offer.note}
                        </p>
                      </div>
                    )}
                  </div>


                  <div
                    className="
                      flex items-center
                      justify-between gap-6
                      lg:justify-end
                    "
                  >
                    <div className="lg:text-right">
                      <p
                        className="
                          font-semibold
                          tabular-nums
                        "
                      >
                        {offer.price.toLocaleString(
                          "sv-SE",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}{" "}
                        {product.currency}
                      </p>

                      {unitPrice !== null && (
                        <p
                          className="
                            mt-1 text-sm
                            text-muted-foreground
                            tabular-nums
                          "
                        >
                          {unitPrice.toLocaleString(
                            "sv-SE",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 4,
                            },
                          )}{" "}
                          {product.currency}

                          {product.unit
                            ? `/${product.unit}`
                            : ""}
                        </p>
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

                        <ExternalLink
                            data-icon="inline-end"
                        />
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