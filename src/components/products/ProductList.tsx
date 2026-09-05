import { ProductCard } from "@/components/products/ProductCard";
import { ProductFilters } from "@/components/products/ProductFilters";
import { ProductFormDialog } from "@/components/products/ProductFormDialog";
import { ProductPagination } from "@/components/products/ProductPagination";
import { ProductSummary } from "@/components/products/ProductSummary";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Separator } from "@/components/ui/separator";

import { useProductList } from "@/hooks/useProductList";

import type { DataFile, HistoryIndex, Product } from "@/types/product";


interface ProductListProps {
  data: DataFile;
  history: HistoryIndex | null;
  onSelectProduct: (product: Product) => void;
  onRefresh: () => void | Promise<void>;
}


export function ProductList({
  data,
  history,
  onSelectProduct,
  onRefresh,
}: ProductListProps) {
  const list = useProductList(data.data);
  const hasProducts = data.data.length > 0;


  if (!hasProducts) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <CardTitle>No products tracked yet</CardTitle>

          <CardDescription>
            Add a product to start tracking prices.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex justify-center">
          <ProductFormDialog mode="create" onSaved={onRefresh} />
        </CardContent>
      </Card>
    );
  }


  return (
    <div className="space-y-8">
      <ProductSummary products={data.data} />


      <section className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Products
            </h2>

            <p className="text-sm text-muted-foreground">
              Track total prices, unit prices and store offers.
            </p>
          </div>

          {history && (
            <p className="text-sm text-muted-foreground">
              {history.periods.length}{" "}
              {history.periods.length === 1 ? "week" : "weeks"} of history
            </p>
          )}
        </div>


        <Separator />


        <ProductFilters
          searchQuery={list.searchQuery}
          filter={list.filter}
          sort={list.sort}
          onSearchChange={list.setSearchQuery}
          onFilterChange={list.setFilter}
          onSortChange={list.setSort}
        />


        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {list.totalResults > 0
              ? `Showing ${list.pageStart + 1}-${list.pageEnd} of ${list.totalResults} products`
              : "No matching products"}
          </p>

          <ProductFormDialog mode="create" onSaved={onRefresh} />
        </div>


        {list.products.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.products.map(product => (
              <ProductCard
                key={product.product_id}
                product={product}
                onClick={() => onSelectProduct(product)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="font-medium">No products found</p>

              <p className="mt-1 text-sm text-muted-foreground">
                Try changing your search or filters.
              </p>
            </CardContent>
          </Card>
        )}


        <ProductPagination
          page={list.page}
          totalPages={list.totalPages}
          onPageChange={list.setPage}
        />
      </section>
    </div>
  );
}