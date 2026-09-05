import {
  Plus,
  Save,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { ProductSourceForm } from "@/components/products/ProductSourceForm";

import type {
  ProductFormState,
  ProductSourceFormState,
} from "@/hooks/useProductForm";


// =============================================================
// Props
// =============================================================

interface ProductFormProps {
  form: ProductFormState;

  isEditing: boolean;
  isSaving?: boolean;

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
    K extends keyof ProductSourceFormState,
  >(
    index: number,
    field: K,
    value: ProductSourceFormState[K],
  ) => void;

  onAddSource: () => void;

  onRemoveSource: (
    index: number,
  ) => void;

  onSubmit: () => void;

  onCancel: () => void;
}


// =============================================================
// Product Form
// =============================================================

export function ProductForm({
  form,

  isEditing,
  isSaving = false,

  onFieldChange,
  onSourceChange,

  onAddSource,
  onRemoveSource,

  onSubmit,
  onCancel,
}: ProductFormProps) {
  function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    onSubmit();
  }


  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* =====================================================
          Product
          ===================================================== */}

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">
            {isEditing
              ? "Edit product"
              : "Add product"}
          </h2>

          <p className="text-sm text-muted-foreground">
            Configure the product,
            comparison quantity and
            store sources.
          </p>
        </div>


        {/* -----------------------------------------------------
            Name
            ----------------------------------------------------- */}

        <div className="space-y-2">
          <Label htmlFor="product-name">
            Product name
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


        {/* -----------------------------------------------------
            Product scraper switch
            ----------------------------------------------------- */}

        <div className="flex items-start gap-3 rounded-lg border p-4">
          <input
            id="product-scraping-enabled"
            type="checkbox"
            checked={
              form.scrapingEnabled
            }
            onChange={event =>
              onFieldChange(
                "scrapingEnabled",
                event.target.checked,
              )
            }
            className="mt-1 size-4 shrink-0 accent-primary"
          />

          <div className="space-y-1">
            <Label
              htmlFor="product-scraping-enabled"
              className="cursor-pointer"
            >
              Enable scraper
            </Label>

            <p className="text-sm text-muted-foreground">
              When disabled, every
              store uses its manual
              price and no store page
              is opened by the scraper.
            </p>
          </div>
        </div>


        {/* =====================================================
            Price comparison
            ===================================================== */}

        <div className="rounded-lg border p-4">
          <div className="mb-4">
            <h3 className="font-medium">
              Price comparison
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Normalize different
              package sizes before
              comparing total prices.
            </p>
          </div>


          <div className="grid gap-4 md:grid-cols-2">
            {/* -----------------------------------------------
                Comparison quantity
                ----------------------------------------------- */}

            <div className="space-y-2">
              <Label
                htmlFor="comparison-quantity"
              >
                Comparison quantity
              </Label>

              <Input
                id="comparison-quantity"
                type="number"
                min="0"
                step="any"
                value={
                  form.comparisonQuantity
                }
                placeholder="2"
                onChange={event =>
                  onFieldChange(
                    "comparisonQuantity",
                    event.target.value,
                  )
                }
              />

              <p className="text-xs text-muted-foreground">
                Example: enter 2 to
                compare every store as
                the price for 2 units.
              </p>
            </div>


            {/* -----------------------------------------------
                Unit
                ----------------------------------------------- */}

            <div className="space-y-2">
              <Label htmlFor="unit">
                Unit
              </Label>

              <Input
                id="unit"
                value={form.unit}
                placeholder="pcs"
                onChange={event =>
                  onFieldChange(
                    "unit",
                    event.target.value,
                  )
                }
              />

              <p className="text-xs text-muted-foreground">
                Examples: pcs,
                bottles, kg, ml.
              </p>
            </div>
          </div>


          {/* -----------------------------------------------
              Explanation
              ----------------------------------------------- */}

          {form.comparisonQuantity.trim() && (
            <div className="mt-4 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              Store prices will be
              normalized to{" "}
              <span className="font-medium text-foreground">
                {
                  form.comparisonQuantity
                }{" "}
                {form.unit || "units"}
              </span>
              {" "}
              before selecting the
              lowest total price.
            </div>
          )}
        </div>


        {/* =====================================================
            Targets
            ===================================================== */}

        <div className="rounded-lg border p-4">
          <div className="mb-4">
            <h3 className="font-medium">
              Price targets
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Set the total and
              optional unit price
              targets.
            </p>
          </div>


          <div className="grid gap-4 md:grid-cols-3">
            {/* -----------------------------------------------
                Target total
                ----------------------------------------------- */}

            <div className="space-y-2">
              <Label
                htmlFor="target-price"
              >
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
                placeholder="50"
                onChange={event =>
                  onFieldChange(
                    "targetPrice",
                    event.target.value,
                  )
                }
              />

              {form.comparisonQuantity.trim() && (
                <p className="text-xs text-muted-foreground">
                  Target for{" "}
                  {
                    form.comparisonQuantity
                  }{" "}
                  {form.unit ||
                    "units"}.
                </p>
              )}
            </div>


            {/* -----------------------------------------------
                Target unit
                ----------------------------------------------- */}

            <div className="space-y-2">
              <Label
                htmlFor="target-unit-price"
              >
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
                placeholder="25"
                onChange={event =>
                  onFieldChange(
                    "targetUnitPrice",
                    event.target.value,
                  )
                }
              />

              <p className="text-xs text-muted-foreground">
                Optional.
              </p>
            </div>


            {/* -----------------------------------------------
                Currency
                ----------------------------------------------- */}

            <div className="space-y-2">
              <Label htmlFor="currency">
                Currency
              </Label>

              <Input
                id="currency"
                value={form.currency}
                placeholder="SEK"
                onChange={event =>
                  onFieldChange(
                    "currency",
                    event.target.value,
                  )
                }
              />
            </div>
          </div>
        </div>
      </div>


      {/* =====================================================
          Stores
          ===================================================== */}

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-medium">
              Stores
            </h3>

            <p className="text-sm text-muted-foreground">
              Configure the actual
              package quantity for
              each store.
            </p>
          </div>


          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddSource}
          >
            <Plus data-icon="inline-start" />

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

                currency={
                  form.currency ||
                  "SEK"
                }

                productScrapingEnabled={
                  form.scrapingEnabled
                }

                canRemove={
                  form.sources.length >
                  1
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
      </div>


      {/* =====================================================
          Actions
          ===================================================== */}

      <div className="flex flex-wrap justify-end gap-2 border-t pt-5">
        <Button
          type="button"
          variant="outline"
          disabled={isSaving}
          onClick={onCancel}
        >
          <X data-icon="inline-start" />

          Cancel
        </Button>


        <Button
          type="submit"
          disabled={isSaving}
        >
          <Save data-icon="inline-start" />

          {isSaving
            ? "Saving..."
            : isEditing
              ? "Save changes"
              : "Add product"}
        </Button>
      </div>
    </form>
  );
}