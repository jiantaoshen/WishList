import { useMemo, useState } from "react";
import type { DataFile, HistoryIndex, Product } from "../types/product";


type ProductFilter = "all" | "belowTarget" | "priceDrops";
type ProductSort = "name" | "priceLow" | "priceHigh" | "biggestDrop";

interface ProductListProps {
  data: DataFile;
  history: HistoryIndex | null;
  onManageProducts: () => void;
  onSelectProduct: (product: Product) => void;
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}


// =============================================================
// Product List
// =============================================================

export function ProductList({
  data,
  history,
  onManageProducts,
  onSelectProduct,
}: ProductListProps) {

  // =========================================================
  // Dashboard Summary
  // =========================================================

  const totalProducts = data.data.length;
  const hasProducts = totalProducts > 0;

  const belowTarget = data.data.filter((product) => product.below_target).length;

  const priceDrops = data.data.filter(
    (product) =>
      product.previous_price !== null &&
      product.previous_price !== undefined &&
      product.current_price < product.previous_price,
  ).length;


  // =========================================================
  // Search / Filter / Sort
  // =========================================================

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<ProductFilter>("all");
  const [sort, setSort] = useState<ProductSort>("name");


  // =========================================================
  // Visible Products
  // =========================================================

  const visibleProducts = useMemo(() => {

    const query = searchQuery.trim().toLowerCase();

    const filtered = data.data.filter((product) => {

      const matchesSearch =
        query.length === 0 ||
        product.name.toLowerCase().includes(query);

      if (!matchesSearch) { return false; }

      if (filter === "belowTarget") { return product.below_target; }

      if (filter === "priceDrops") {
        return (
          product.previous_price !== null &&
          product.previous_price !== undefined &&
          product.current_price < product.previous_price
        );
      }

      return true;
    });


    return [...filtered].sort((a, b) => {

      if (sort === "name") { return a.name.localeCompare(b.name); }

      if (sort === "priceLow") { return a.current_price - b.current_price; }

      if (sort === "priceHigh") { return b.current_price - a.current_price; }

      if (sort === "biggestDrop") {

        const aDrop =
          a.previous_price !== null &&
          a.previous_price !== undefined
            ? a.previous_price - a.current_price
            : 0;

        const bDrop =
          b.previous_price !== null &&
          b.previous_price !== undefined
            ? b.previous_price - b.current_price
            : 0;

        return bDrop - aDrop;
      }

      return 0;
    });

  }, [data.data, searchQuery, filter, sort]);


  // =========================================================
  // UI
  // =========================================================

  return (
    <>

      {/* Summary */}

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard title="Products" value={totalProducts} />
        <SummaryCard title="Below Target" value={belowTarget} />
        <SummaryCard title="Price Drops" value={priceDrops} />
      </div>


      {/* Empty State */}

      {!hasProducts && (
        <div className="app-card-dashed px-6 py-14 text-center">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-xl text-app-text-secondary">
            $
          </div>

          <h2 className="app-section-title mt-4">
            No products tracked yet
          </h2>

          <p className="app-body mt-1">
            Add a product to start tracking prices.
          </p>

          <button
            type="button"
            onClick={onManageProducts}
            className="app-btn app-btn-primary mt-5 px-4 py-2.5 text-sm"
          >
            Add Product
          </button>

        </div>
      )}


      {hasProducts && (
        <>

          {/* Product Title */}

          <div className="mb-4 flex items-end justify-between">

            <div>
              <h2 className="app-section-title">
                Products
              </h2>

              <p className="app-body mt-1">
                Click a product to view price history.
              </p>
            </div>

            {history && (
              <span className="app-muted">
                {history.periods.length} weeks of history
              </span>
            )}

          </div>


          {/* Search */}

          <div className="mb-4">
            <input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="app-input"
            />
          </div>


          {/* Filters + Sort */}

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex flex-wrap gap-2">

              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`app-btn rounded-full px-4 py-2 text-sm ${filter === "all" ? "app-btn-primary" : "app-btn-secondary"}`}
              >
                All
              </button>

              <button
                type="button"
                onClick={() => setFilter("belowTarget")}
                className={`app-btn rounded-full px-4 py-2 text-sm ${filter === "belowTarget" ? "status-success border" : "app-btn-secondary"}`}
              >
                Below Target
              </button>

              <button
                type="button"
                onClick={() => setFilter("priceDrops")}
                className={`app-btn rounded-full px-4 py-2 text-sm ${filter === "priceDrops" ? "app-btn-primary" : "app-btn-secondary"}`}
              >
                Price Drops
              </button>

            </div>


            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as ProductSort)}
              className="app-select"
            >
              <option value="name">
                Name
              </option>

              <option value="priceLow">
                Price: Low to High
              </option>

              <option value="priceHigh">
                Price: High to Low
              </option>

              <option value="biggestDrop">
                Biggest Price Drop
              </option>
            </select>

          </div>


          {/* Results Count */}

          <p className="app-muted mb-3">
            Showing{" "}
            {visibleProducts.length}{" "}
            of{" "}
            {data.data.length}{" "}
            products
          </p>


          {/* Products */}

          {visibleProducts.length > 0 ? (

            <div className="space-y-3">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.product_id}
                  product={product}
                  onClick={() => onSelectProduct(product)}
                />
              ))}
            </div>

          ) : (

            <div className="app-card px-6 py-12 text-center">
              <p className="font-medium text-app-text-secondary">
                No products found
              </p>

              <p className="app-muted mt-1">
                Try changing your search or filter.
              </p>
            </div>

          )}

        </>
      )}

    </>
  );
}


// =============================================================
// Summary Card
// =============================================================

function SummaryCard({
  title,
  value,
  subtitle,
}: SummaryCardProps) {

  return (
    <div className="app-card p-5">

      <p className="app-card-title">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-app-text">
        {value}
      </p>

      {subtitle && (
        <p className="app-body mt-1">
          {subtitle}
        </p>
      )}

    </div>
  );
}

// =============================================================
// Product Card
// =============================================================

function ProductCard({
  product,
  onClick,
}: ProductCardProps) {

  return (
    <button
      type="button"
      onClick={onClick}
      className="app-card-interactive group w-full p-5 text-left sm:p-6"
    >

      <div className="flex items-center gap-5">

        {/* Product Info */}

        <div className="min-w-0 flex-1">

          <h3 className="line-clamp-2 font-semibold text-app-text transition-colors group-hover:text-app-text-secondary">
            {product.name}
          </h3>


          <div className="mt-3 flex flex-wrap items-center gap-2">

            {product.below_target ? (
              <span className="status-success inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium">
                Target reached
              </span>
            ) : (
              <span className="status-unknown inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium">
                Above target
              </span>
            )}

            <span className="app-muted">
              Target {product.target_price.toFixed(0)} kr
            </span>

          </div>

        </div>


        {/* Price */}

        <div className="shrink-0 text-right">

          <p className="text-xl font-bold text-app-text sm:text-2xl">
            {product.current_price.toFixed(2)}
            <span className="ml-1 text-sm font-normal text-app-text-secondary">
              kr
            </span>
          </p>


          {product.below_target ? (
            <p className="mt-1 text-xs text-success-text">
              Below target by{" "}
              {Math.abs(product.difference).toFixed(0)}{" "}
              kr
            </p>
          ) : (
            <p className="app-muted mt-1">
              Above target by{" "}
              {product.difference.toFixed(0)}{" "}
              kr
            </p>
          )}

        </div>


        {/* Arrow */}

        <div className="text-app-text-muted transition-colors group-hover:text-app-text-secondary">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>

      </div>

    </button>
  );
}