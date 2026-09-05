import { Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { ProductFilter, ProductSort } from "@/hooks/useProductList";


interface ProductFiltersProps {
  searchQuery: string;
  filter: ProductFilter;
  sort: ProductSort;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: ProductFilter) => void;
  onSortChange: (value: ProductSort) => void;
}


const FILTER_OPTIONS: { label: string; value: ProductFilter }[] = [
  { label: "All", value: "all" },
  { label: "Below Total", value: "belowTarget" },
  { label: "Below Unit", value: "unitBelowTarget" },
  { label: "Price Drops", value: "priceDrops" },
];

const SORT_OPTIONS: { label: string; value: ProductSort }[] = [
  { label: "Name", value: "name" },
  { label: "Total: Low → High", value: "priceLow" },
  { label: "Total: High → Low", value: "priceHigh" },
  { label: "Unit: Low → High", value: "unitPriceLow" },
  { label: "Unit: High → Low", value: "unitPriceHigh" },
  { label: "Biggest Drop", value: "biggestDrop" },
];


export function ProductFilters({
  searchQuery,
  filter,
  sort,
  onSearchChange,
  onFilterChange,
  onSortChange,
}: ProductFiltersProps) {
  return (
    <div className="rounded-xl border bg-card p-3 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            type="search"
            placeholder="Search products, stores or notes..."
            value={searchQuery}
            onChange={event => onSearchChange(event.target.value)}
            className="pl-9"
          />
        </div>


        <div className="flex flex-wrap items-center gap-1.5">
          {FILTER_OPTIONS.map(option => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={filter === option.value ? "secondary" : "ghost"}
              className={
                filter === option.value
                  ? "font-medium"
                  : "text-muted-foreground"
              }
              onClick={() => onFilterChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>


        <div className="flex items-center gap-2">
          <SlidersHorizontal className="hidden size-4 text-muted-foreground sm:block" />

          <Select
            items={SORT_OPTIONS}
            value={sort}
            onValueChange={value => {
              const option = SORT_OPTIONS.find(item => item.value === value);
              if (option) onSortChange(option.value);
            }}
          >
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                {SORT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}