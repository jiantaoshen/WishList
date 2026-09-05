import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { ProductSourceFormState } from "@/hooks/useProductForm";


interface ProductSourceFormProps {
  source: ProductSourceFormState;
  index: number;
  currency: string;
  productScrapingEnabled: boolean;
  canRemove: boolean;

  onChange: <K extends keyof ProductSourceFormState>(
    field: K,
    value: ProductSourceFormState[K],
  ) => void;

  onRemove: () => void;
}


export function ProductSourceForm({
  source,
  index,
  currency,
  productScrapingEnabled,
  canRemove,
  onChange,
  onRemove,
}: ProductSourceFormProps) {
  const prefix = `source-${index}`;
  const manualMode = !productScrapingEnabled || !source.scrapingEnabled;


  return (
    <Card className="border-border/70 shadow-none">
      <CardHeader className="flex-row items-center justify-between border-b">
        <div>
          <CardTitle className="text-sm">Store {index + 1}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {manualMode ? "Manual price" : "Automatic scraping"}
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={!canRemove}
          onClick={onRemove}
          aria-label={`Remove store ${index + 1}`}
        >
          <Trash2 />
        </Button>
      </CardHeader>


      <CardContent className="grid gap-4 pt-5 lg:grid-cols-2">
        <Field label="Store" htmlFor={`${prefix}-store`}>
          <Input
            id={`${prefix}-store`}
            value={source.store}
            placeholder="Inet"
            onChange={event => onChange("store", event.target.value)}
          />
        </Field>


        <Field
          label="Unit quantity"
          htmlFor={`${prefix}-quantity`}
          help="Example: 24 pcs, 0.5 L or 2 kg."
        >
          <Input
            id={`${prefix}-quantity`}
            type="number"
            min="0"
            step="any"
            value={source.unitQuantity}
            placeholder="Optional"
            onChange={event => onChange("unitQuantity", event.target.value)}
          />
        </Field>


        <Field
          label="Product URL"
          htmlFor={`${prefix}-url`}
          className="lg:col-span-2"
          help={
            manualMode
              ? "The URL is kept so you can open the store manually. Python will not visit it."
              : undefined
          }
        >
          <Input
            id={`${prefix}-url`}
            type="url"
            value={source.url}
            placeholder="https://..."
            onChange={event => onChange("url", event.target.value)}
          />
        </Field>


        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4 lg:col-span-2">
          <div>
            <p className="text-sm font-medium">Scrape this store</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {productScrapingEnabled
                ? "Automatically read the price from this website."
                : "Product scraping is disabled. Manual price will be used."}
            </p>
          </div>

          <input
            type="checkbox"
            checked={source.scrapingEnabled}
            disabled={!productScrapingEnabled}
            onChange={event => onChange("scrapingEnabled", event.target.checked)}
            className="size-4 shrink-0 accent-primary"
          />
        </label>


        {manualMode && (
          <Field
            label="Manual price"
            htmlFor={`${prefix}-manual-price`}
            className="lg:col-span-2"
            help="This value will be used instead of running the scraper for this store."
          >
            <div className="relative">
              <Input
                id={`${prefix}-manual-price`}
                type="number"
                min="0"
                step="any"
                value={source.manualPrice}
                placeholder="269.00"
                className="pr-16"
                onChange={event => onChange("manualPrice", event.target.value)}
              />

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {currency}
              </span>
            </div>
          </Field>
        )}


        <Field
          label="Note / extras"
          htmlFor={`${prefix}-note`}
          className="lg:col-span-2"
        >
          <Textarea
            id={`${prefix}-note`}
            value={source.note}
            placeholder="Free keyboard, bonus points, shipping included..."
            rows={2}
            onChange={event => onChange("note", event.target.value)}
          />
        </Field>
      </CardContent>
    </Card>
  );
}


function Field({
  label,
  htmlFor,
  help,
  className = "",
  children,
}: {
  label: string;
  htmlFor: string;
  help?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}