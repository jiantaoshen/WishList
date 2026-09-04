import {
  Plus,
  Save,
  X,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  Separator,
} from "@/components/ui/separator";

import {
  ProductSourceForm,
} from "@/components/products/ProductSourceForm";

import type {
  ProductFormState,
  ProductSourceFormState,
} from "@/hooks/useProductForm";


interface ProductFormProps {
  form: ProductFormState;

  editing: boolean;

  saving: boolean;

  error: string | null;

  onFieldChange: <
    K extends keyof Omit<
      ProductFormState,
      "sources"
    >,
  >(
    field: K,
    value: ProductFormState[K],
  ) => void;

  onSourceChange: <
    K extends
      keyof ProductSourceFormState,
  >(
    index: number,
    field: K,
    value:
      ProductSourceFormState[K],
  ) => void;

  onAddSource: () => void;

  onRemoveSource:
    (index: number) => void;

  onSubmit: () => void;

  onCancel: () => void;
}


export function ProductForm({
  form,
  editing,
  saving,
  error,
  onFieldChange,
  onSourceChange,
  onAddSource,
  onRemoveSource,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {editing
            ? "Edit product"
            : "Add product"}
        </CardTitle>

        <CardDescription>
          Track one product across
          multiple stores and compare
          total and unit prices.
        </CardDescription>
      </CardHeader>


      <CardContent>
        <form
          className="space-y-8"
          onSubmit={event => {
            event.preventDefault();
            onSubmit();
          }}
        >
          {/* Product */}

          <section className="space-y-4">
            <div>
              <h3 className="font-medium">
                Product
              </h3>

              <p
                className="
                  mt-1 text-sm
                  text-muted-foreground
                "
              >
                Basic tracking
                information.
              </p>
            </div>


            <div
              className="
                grid gap-4
                md:grid-cols-2
              "
            >
              <div
                className="
                  space-y-2
                  md:col-span-2
                "
              >
                <Label htmlFor="product-name">
                  Name
                </Label>

                <Input
                  id="product-name"
                  value={form.name}
                  placeholder="Product name"
                  onChange={event =>
                    onFieldChange(
                      "name",
                      event.target.value,
                    )
                  }
                />
              </div>


              <div className="space-y-2">
                <Label htmlFor="target-price">
                  Target total price
                </Label>

                <Input
                  id="target-price"
                  type="number"
                  min="0"
                  step="any"
                  value={
                    form.targetPrice
                  }
                  placeholder="17990"
                  onChange={event =>
                    onFieldChange(
                      "targetPrice",
                      event.target.value,
                    )
                  }
                />
              </div>


              <div className="space-y-2">
                <Label htmlFor="currency">
                  Currency
                </Label>

                <Input
                  id="currency"
                  value={
                    form.currency
                  }
                  placeholder="SEK"
                  maxLength={8}
                  onChange={event =>
                    onFieldChange(
                      "currency",
                      event.target.value,
                    )
                  }
                />
              </div>


              <div className="space-y-2">
                <Label htmlFor="unit">
                  Unit
                </Label>

                <Input
                  id="unit"
                  value={form.unit}
                  placeholder="pcs, L, kg..."
                  onChange={event =>
                    onFieldChange(
                      "unit",
                      event.target.value,
                    )
                  }
                />
              </div>


              <div className="space-y-2">
                <Label htmlFor="target-unit-price">
                  Target unit price
                </Label>

                <Input
                  id="target-unit-price"
                  type="number"
                  min="0"
                  step="any"
                  value={
                    form.targetUnitPrice
                  }
                  placeholder="Optional"
                  onChange={event =>
                    onFieldChange(
                      "targetUnitPrice",
                      event.target.value,
                    )
                  }
                />
              </div>
            </div>
          </section>


          <Separator />


          {/* Stores */}

          <section className="space-y-4">
            <div
              className="
                flex flex-col gap-3
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div>
                <h3 className="font-medium">
                  Store sources
                </h3>

                <p
                  className="
                    mt-1 text-sm
                    text-muted-foreground
                  "
                >
                  Add every store you
                  want to compare.
                </p>
              </div>


              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={
                  onAddSource
                }
              >
                <Plus />

                Add store
              </Button>
            </div>


            <div className="space-y-4">
              {form.sources.map(
                (
                  source,
                  index,
                ) => (
                  <ProductSourceForm
                    key={index}
                    source={source}
                    index={index}
                    canRemove={
                      form.sources
                        .length > 1
                    }
                    onChange={(
                      field,
                      value,
                    ) =>
                      onSourceChange(
                        index,
                        field,
                        value,
                      )
                    }
                    onRemove={() =>
                      onRemoveSource(
                        index,
                      )
                    }
                  />
                ),
              )}
            </div>
          </section>


          {/* Error */}

          {error && (
            <div
              className="
                rounded-lg
                border
                border-destructive/30
                bg-destructive/5
                px-4 py-3
                text-sm
                text-destructive
              "
            >
              {error}
            </div>
          )}


          {/* Actions */}

          <div
            className="
              flex flex-col-reverse
              gap-2
              border-t
              pt-5
              sm:flex-row
              sm:justify-end
            "
          >
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={onCancel}
            >
              <X />

              Cancel
            </Button>


            <Button
              type="submit"
              disabled={saving}
            >
              <Save />

              {saving
                ? "Saving..."
                : editing
                  ? "Save changes"
                  : "Add product"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}