import {
  GripVertical,
  Trash2,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
  CardContent,
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
  Textarea,
} from "@/components/ui/textarea";

import type {
  ProductSourceFormState,
} from "@/hooks/useProductForm";


interface ProductSourceFormProps {
  source:
    ProductSourceFormState;

  index: number;

  canRemove: boolean;

  onChange: <
    K extends
      keyof ProductSourceFormState,
  >(
    field: K,
    value:
      ProductSourceFormState[K],
  ) => void;

  onRemove: () => void;
}


export function ProductSourceForm({
  source,
  index,
  canRemove,
  onChange,
  onRemove,
}: ProductSourceFormProps) {
  const prefix =
    `source-${index}`;


  return (
    <Card
      className="
        border-border/70
        shadow-none
      "
    >
      <CardHeader
        className="
          flex-row
          items-center
          justify-between
          border-b
        "
      >
        <div
          className="
            flex items-center
            gap-2
          "
        >
          <GripVertical
            className="
              size-4
              text-muted-foreground
            "
          />

          <CardTitle className="text-sm">
            Store {index + 1}
          </CardTitle>
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


      <CardContent
        className="
          grid gap-4
          pt-5
          lg:grid-cols-2
        "
      >
        {/* Store */}

        <div className="space-y-2">
          <Label
            htmlFor={`${prefix}-store`}
          >
            Store
          </Label>

          <Input
            id={`${prefix}-store`}
            value={source.store}
            placeholder="Inet"
            onChange={event =>
              onChange(
                "store",
                event.target.value,
              )
            }
          />
        </div>


        {/* Quantity */}

        <div className="space-y-2">
          <Label
            htmlFor={`${prefix}-quantity`}
          >
            Unit quantity
          </Label>

          <Input
            id={`${prefix}-quantity`}
            type="number"
            min="0"
            step="any"
            value={
              source.unitQuantity
            }
            placeholder="Optional"
            onChange={event =>
              onChange(
                "unitQuantity",
                event.target.value,
              )
            }
          />

          <p
            className="
              text-xs
              text-muted-foreground
            "
          >
            Example: 24 bottles,
            0.5 L or 2 kg.
          </p>
        </div>


        {/* URL */}

        <div
          className="
            space-y-2
            lg:col-span-2
          "
        >
          <Label
            htmlFor={`${prefix}-url`}
          >
            Product URL
          </Label>

          <Input
            id={`${prefix}-url`}
            type="url"
            value={source.url}
            placeholder="https://..."
            onChange={event =>
              onChange(
                "url",
                event.target.value,
              )
            }
          />
        </div>


        {/* Note */}

        <div
          className="
            space-y-2
            lg:col-span-2
          "
        >
          <Label
            htmlFor={`${prefix}-note`}
          >
            Note / extras
          </Label>

          <Textarea
            id={`${prefix}-note`}
            value={source.note}
            placeholder="Free keyboard, bonus points, shipping included..."
            rows={2}
            onChange={event =>
              onChange(
                "note",
                event.target.value,
              )
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}