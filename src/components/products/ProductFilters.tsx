import type {
  ReactNode,
} from "react";

import {
  Search,
  SlidersHorizontal,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  ProductFilter,
  ProductSort,
} from "@/hooks/useProductList";


interface ProductFiltersProps {
  searchQuery: string;

  filter: ProductFilter;

  sort: ProductSort;

  onSearchChange:
    (value: string) => void;

  onFilterChange:
    (value: ProductFilter) => void;

  onSortChange:
    (value: ProductSort) => void;
}


// =============================================================
// Sort Options
// =============================================================

const SORT_OPTIONS: {
  label: string;
  value: ProductSort;
}[] = [
  {
    label: "Name",
    value: "name",
  },
  {
    label: "Total: Low → High",
    value: "priceLow",
  },
  {
    label: "Total: High → Low",
    value: "priceHigh",
  },
  {
    label: "Unit: Low → High",
    value: "unitPriceLow",
  },
  {
    label: "Unit: High → Low",
    value: "unitPriceHigh",
  },
  {
    label: "Biggest Drop",
    value: "biggestDrop",
  },
];


// =============================================================
// Product Filters
// =============================================================

export function ProductFilters({
  searchQuery,
  filter,
  sort,
  onSearchChange,
  onFilterChange,
  onSortChange,
}: ProductFiltersProps) {
  return (
    <div
      className="
        rounded-xl
        border
        bg-card
        p-3
        shadow-sm
      "
    >
      <div
        className="
          flex flex-col
          gap-3
          xl:flex-row
          xl:items-center
        "
      >
        {/* =================================================
            Search
        ================================================= */}

        <div
          className="
            relative
            min-w-0
            flex-1
          "
        >
          <Search
            className="
              pointer-events-none
              absolute
              left-3 top-1/2
              size-4
              -translate-y-1/2
              text-muted-foreground
            "
          />

          <Input
            type="search"
            placeholder="Search products, stores or notes..."
            value={searchQuery}
            onChange={(event) =>
              onSearchChange(
                event.target.value,
              )
            }
            className="pl-9"
          />
        </div>


        {/* =================================================
            Filter Buttons
        ================================================= */}

        <div
          className="
            flex flex-wrap
            items-center
            gap-1.5
          "
        >
          <FilterButton
            active={
              filter === "all"
            }
            onClick={() =>
              onFilterChange("all")
            }
          >
            All
          </FilterButton>


          <FilterButton
            active={
              filter ===
              "belowTarget"
            }
            onClick={() =>
              onFilterChange(
                "belowTarget",
              )
            }
          >
            Below Total
          </FilterButton>


          <FilterButton
            active={
              filter ===
              "unitBelowTarget"
            }
            onClick={() =>
              onFilterChange(
                "unitBelowTarget",
              )
            }
          >
            Below Unit
          </FilterButton>


          <FilterButton
            active={
              filter ===
              "priceDrops"
            }
            onClick={() =>
              onFilterChange(
                "priceDrops",
              )
            }
          >
            Price Drops
          </FilterButton>
        </div>


        {/* =================================================
            Sort
        ================================================= */}

        <div
          className="
            flex items-center
            gap-2
          "
        >
          <SlidersHorizontal
            className="
              hidden size-4
              text-muted-foreground
              sm:block
            "
          />

          <Select
            items={SORT_OPTIONS}
            value={sort}
            onValueChange={(value) => {
              if (
                value &&
                isProductSort(value)
              ) {
                onSortChange(value);
              }
            }}
          >
            <SelectTrigger
              className="
                w-full
                sm:w-52
              "
            >
              <SelectValue
                placeholder="Sort"
              />
            </SelectTrigger>


            <SelectContent>
              <SelectGroup>
                {SORT_OPTIONS.map(
                  (option) => (
                    <SelectItem
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {option.label}
                    </SelectItem>
                  ),
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}


// =============================================================
// Filter Button
// =============================================================

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;

  onClick: () => void;

  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={
        active
          ? "secondary"
          : "ghost"
      }
      onClick={onClick}
      className={
        active
          ? "font-medium"
          : "text-muted-foreground"
      }
    >
      {children}
    </Button>
  );
}


// =============================================================
// Sort Guard
// =============================================================

function isProductSort(
  value: string,
): value is ProductSort {
  return (
    value === "name" ||
    value === "priceLow" ||
    value === "priceHigh" ||
    value === "unitPriceLow" ||
    value === "unitPriceHigh" ||
    value === "biggestDrop"
  );
}