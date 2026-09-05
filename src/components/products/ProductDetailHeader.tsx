import {
  ArrowLeft,
  ExternalLink,
  Store,
} from "lucide-react";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Button,
  buttonVariants,
} from "@/components/ui/button";

import {
  ProductDetailActions,
} from "@/components/products/ProductDetailActions";

import type {
  Product,
} from "@/types/product";


// =============================================================
// Props
// =============================================================

interface ProductDetailHeaderProps {
  product: Product;

  onBack:
    () => void;

  onRefresh:
    () => void | Promise<void>;
}


// =============================================================
// Product Detail Header
// =============================================================

export function ProductDetailHeader({
  product,
  onBack,
  onRefresh,
}: ProductDetailHeaderProps) {
  const offers =
    product.offers ?? [];

  const totalStore =
    product.store ?? null;

  const unitStore =
    product.unit_store ?? null;

  const unit =
    product.unit ?? null;

  const isNotRun =
    product.status === "not_run";


  // ===========================================================
  // Delete Complete
  // ===========================================================

  async function handleDeleted() {
    await onRefresh();

    onBack();
  }


  // ===========================================================
  // Render
  // ===========================================================

  return (
    <div className="space-y-5">
      {/* =====================================================
          Back
      ===================================================== */}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="-ml-2"
      >
        <ArrowLeft />

        Dashboard
      </Button>


      {/* =====================================================
          Main Header
      ===================================================== */}

      <div
        className="
          flex flex-col
          gap-5
          lg:flex-row
          lg:items-start
          lg:justify-between
        "
      >
        {/* ===================================================
            Product
        =================================================== */}

        <div className="min-w-0 flex-1">
          {/* Title + Status */}

          <div
            className="
              flex flex-wrap
              items-center gap-2
            "
          >
            <h1
              className="
                text-2xl
                font-semibold
                tracking-tight
              "
            >
              {product.name}
            </h1>


            {/* Not run */}

            {product.status ===
              "not_run" && (
              <Badge
                variant="outline"
                className="text-muted-foreground"
              >
                Not run yet
              </Badge>
            )}


            {/* Failed */}

            {product.status ===
              "failed" && (
              <Badge variant="destructive">
                Failed
              </Badge>
            )}


            {/* Suspicious */}

            {product.status ===
              "suspicious" && (
              <Badge variant="outline">
                Check price
              </Badge>
            )}
          </div>


          {/* =================================================
              Metadata
          ================================================= */}

          <div
            className="
              mt-3 flex
              flex-wrap gap-x-5
              gap-y-2
              text-sm
              text-muted-foreground
            "
          >
            <span
              className="
                flex items-center gap-1.5
              "
            >
              <Store className="size-4" />

              {isNotRun
                ? "Waiting for first run"
                : (
                    <>
                      {offers.length}{" "}

                      {offers.length === 1
                        ? "store"
                        : "stores"}
                    </>
                  )}
            </span>


            {totalStore && (
              <span>
                Lowest total:{" "}

                <strong className="text-foreground">
                  {totalStore}
                </strong>
              </span>
            )}


            {unitStore && (
              <span>
                Lowest unit:{" "}

                <strong className="text-foreground">
                  {unitStore}
                </strong>
              </span>
            )}
          </div>


          {/* =================================================
              Edit / Delete
          ================================================= */}

          <div className="mt-4">
            <ProductDetailActions
              productId={
                product.product_id
              }

              productName={
                product.name
              }

              onUpdated={
                onRefresh
              }

              onDeleted={
                handleDeleted
              }
            />
          </div>
        </div>


        {/* ===================================================
            Price
        =================================================== */}

        <div
          className="
            shrink-0
            lg:text-right
          "
        >
          <p
            className="
              text-xs
              font-medium
              uppercase
              tracking-wider
              text-muted-foreground
            "
          >
            Lowest total
          </p>


          {/* Total Price */}

          <p
            className="
              mt-1
              text-3xl
              font-semibold
              tracking-tight
              tabular-nums
            "
          >
            {product.current_price !==
            null
              ? formatNumber(
                  product.current_price,
                  2,
                )
              : "—"}


            {product.current_price !==
              null && (
              <span
                className="
                  ml-1
                  text-sm
                  font-normal
                  text-muted-foreground
                "
              >
                {product.currency}
              </span>
            )}
          </p>


          {/* Not Run */}

          {isNotRun && (
            <p
              className="
                mt-2
                text-sm
                text-muted-foreground
              "
            >
              No price data yet
            </p>
          )}


          {/* Unit Price */}

          {!isNotRun &&
            product.current_unit_price !==
              null &&
            product.current_unit_price !==
              undefined && (
              <p
                className="
                  mt-2
                  text-sm
                  font-medium
                  text-muted-foreground
                "
              >
                {formatNumber(
                  product.current_unit_price,
                  4,
                )}{" "}

                {product.currency}

                {unit
                  ? `/${unit}`
                  : ""}
              </p>
            )}


          {/* Open Offer */}

          {!isNotRun &&
            product.url && (
              <a
                href={
                  product.url
                }
                target="_blank"
                rel="noopener noreferrer"
                className={
                  buttonVariants({
                    variant: "link",

                    size: "sm",

                    className:
                      "mt-1 px-0",
                  })
                }
              >
                Open offer

                <ExternalLink
                  data-icon="inline-end"
                />
              </a>
            )}
        </div>
      </div>
    </div>
  );
}


// =============================================================
// Format
// =============================================================

function formatNumber(
  value: number,
  decimals: number,
) {
  return value.toLocaleString(
    "sv-SE",
    {
      minimumFractionDigits:
        decimals,

      maximumFractionDigits:
        decimals,
    },
  );
}