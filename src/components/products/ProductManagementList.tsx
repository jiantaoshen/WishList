import {
  Pencil,
  Store,
  Trash2,
} from "lucide-react";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import type {
  ProductConfig,
} from "@/services/productConfigApi";


export function ProductManagementList({
  products,
  onEdit,
  onDelete,
}: {
  products: ProductConfig[];
  onEdit:
    (product: ProductConfig) => void;
  onDelete:
    (product: ProductConfig) => void;
}) {
  return (
    <div className="space-y-3">
      {products.map(product => (
        <ProductConfigCard
          key={product.id}
          product={product}
          onEdit={() =>
            onEdit(product)
          }
          onDelete={() =>
            onDelete(product)
          }
        />
      ))}
    </div>
  );
}


function ProductConfigCard({
  product,
  onEdit,
  onDelete,
}: {
  product: ProductConfig;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const sourceCount =
    product.sources?.length ??
    (product.url ? 1 : 0);

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">
                {product.name}
              </h2>

              <Badge
                variant="secondary"
                className="gap-1"
              >
                <Store className="size-3" />

                {sourceCount}{" "}
                {sourceCount === 1
                  ? "store"
                  : "stores"}
              </Badge>
            </div>


            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <Target
                label="Total target"
                value={
                  `${formatPrice(
                    product.target_price,
                  )} ${product.currency}`
                }
              />

              <Target
                label="Unit target"
                value={
                  product.target_unit_price !== null
                    ? `${formatPrice(
                        product.target_unit_price,
                      )} ${product.currency}${
                        product.unit
                          ? `/${product.unit}`
                          : ""
                      }`
                    : "Off"
                }
              />
            </div>


            {product.sources?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {product.sources.map(
                  source => (
                    <Badge
                      key={source.url}
                      variant="outline"
                    >
                      {source.store}
                    </Badge>
                  ),
                )}
              </div>
            )}
          </div>


          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onEdit}
            >
              <Pencil />
              Edit
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


function Target({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-muted-foreground">
        {label}
      </p>

      <p className="font-medium tabular-nums">
        {value}
      </p>
    </div>
  );
}


function formatPrice(
  value: number,
) {
  return value.toLocaleString(
    "sv-SE",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    },
  );
}