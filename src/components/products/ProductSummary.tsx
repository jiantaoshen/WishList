import {
  Package,
  Target,
  TrendingDown,
  Weight,
} from "lucide-react";

import type {
  LucideIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import type {
  Product,
} from "@/types/product";


interface ProductSummaryProps {
  products: Product[];
}


export function ProductSummary({
  products,
}: ProductSummaryProps) {
  const totalProducts =
    products.length;


  const belowTotal =
    products.filter(
      (product) =>
        product.below_target === true,
    ).length;


  const belowUnit =
    products.filter(
      (product) =>
        product.unit_below_target ===
        true,
    ).length;


  const priceDrops =
    products.filter(
      (product) => {
        const current =
          product.current_price;

        const previous =
          product.previous_price;


        return (
          current !== null &&
          previous !== null &&
          current < previous
        );
      },
    ).length;


  return (
    <div
      className="
        grid
        grid-cols-2
        gap-3
        xl:grid-cols-4
      "
    >
      <SummaryCard
        title="Products"
        value={totalProducts}
        subtitle="Tracked products"
        icon={Package}
      />


      <SummaryCard
        title="Total Target"
        value={belowTotal}
        subtitle="Below target"
        icon={Target}
      />


      <SummaryCard
        title="Unit Target"
        value={belowUnit}
        subtitle="Below unit target"
        icon={Weight}
      />


      <SummaryCard
        title="Price Drops"
        value={priceDrops}
        subtitle="Since last check"
        icon={TrendingDown}
      />
    </div>
  );
}


// =============================================================
// Summary Card
// =============================================================

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: LucideIcon;
}) {
  return (
    <Card
      className="
        border-border/70
        shadow-sm
      "
    >
      <CardContent className="p-5">
        <div
          className="
            flex items-start
            justify-between
            gap-4
          "
        >
          <div>
            <p
              className="
                text-xs
                font-medium
                text-muted-foreground
              "
            >
              {title}
            </p>


            <p
              className="
                mt-2
                text-3xl
                font-semibold
                tracking-tight
                tabular-nums
              "
            >
              {value}
            </p>


            <p
              className="
                mt-1
                text-xs
                text-muted-foreground
              "
            >
              {subtitle}
            </p>
          </div>


          <div
            className="
              flex size-9
              shrink-0
              items-center
              justify-center
              rounded-lg
              border
              bg-muted/40
            "
          >
            <Icon
              className="
                size-4
                text-muted-foreground
              "
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}