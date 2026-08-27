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


const PRODUCTS_PER_PAGE = 12;


// =============================================================
// Product List
// =============================================================

export function ProductList({ data, history, onManageProducts, onSelectProduct }: ProductListProps) {

  // =========================================================
  // Dashboard Summary
  // =========================================================

  const totalProducts = data.data.length;
  const hasProducts = totalProducts > 0;
  const belowTarget = data.data.filter((product) => product.below_target).length;

  const priceDrops = data.data.filter(
    (product) => product.previous_price !== null && product.previous_price !== undefined && product.current_price < product.previous_price,
  ).length;


  // =========================================================
  // Search / Filter / Sort / Pagination
  // =========================================================

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<ProductFilter>("all");
  const [sort, setSort] = useState<ProductSort>("name");
  const [page, setPage] = useState(1);


  // =========================================================
  // Visible Products
  // =========================================================

  const visibleProducts = useMemo(() => {

    const query = searchQuery.trim().toLowerCase();

    const filtered = data.data.filter((product) => {

      const matchesSearch = query.length === 0 || product.name.toLowerCase().includes(query);

      if (!matchesSearch) return false;
      if (filter === "belowTarget") return product.below_target;

      if (filter === "priceDrops") {
        return product.previous_price !== null && product.previous_price !== undefined && product.current_price < product.previous_price;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {

      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "priceLow") return a.current_price - b.current_price;
      if (sort === "priceHigh") return b.current_price - a.current_price;

      if (sort === "biggestDrop") {
        const aDrop = a.previous_price !== null && a.previous_price !== undefined ? a.previous_price - a.current_price : 0;
        const bDrop = b.previous_price !== null && b.previous_price !== undefined ? b.previous_price - b.current_price : 0;
        return bDrop - aDrop;
      }

      return 0;
    });

  }, [data.data, searchQuery, filter, sort]);


  // =========================================================
  // Pagination
  // =========================================================

  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / PRODUCTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const pageEnd = Math.min(pageStart + PRODUCTS_PER_PAGE, visibleProducts.length);
  const paginatedProducts = visibleProducts.slice(pageStart, pageEnd);


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
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-xl text-app-text-secondary">$</div>

          <h2 className="app-section-title mt-4">No products tracked yet</h2>
          <p className="app-body mt-1">Add a product to start tracking prices.</p>

          <button type="button" onClick={onManageProducts} className="app-btn app-btn-primary mt-5 px-4 py-2.5 text-sm">Add Product</button>
        </div>
      )}


      {hasProducts && (
        <>

          {/* Product Title */}

          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="app-section-title">Products</h2>
              <p className="app-body mt-1">Click a product to view price history.</p>
            </div>

            {history && <span className="app-muted">{history.periods.length} weeks of history</span>}
          </div>


          {/* Search */}

          <div className="mb-4">
            <input type="search" placeholder="Search products..." value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); setPage(1); }} className="app-input" />
          </div>


          {/* Filters + Sort */}

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => { setFilter("all"); setPage(1); }} className={`app-btn rounded-full px-4 py-2 text-sm ${filter === "all" ? "app-btn-primary" : "app-btn-secondary"}`}>All</button>

              <button type="button" onClick={() => { setFilter("belowTarget"); setPage(1); }} className={`app-btn rounded-full px-4 py-2 text-sm ${filter === "belowTarget" ? "status-success border" : "app-btn-secondary"}`}>Below Target</button>

              <button type="button" onClick={() => { setFilter("priceDrops"); setPage(1); }} className={`app-btn rounded-full px-4 py-2 text-sm ${filter === "priceDrops" ? "app-btn-primary" : "app-btn-secondary"}`}>Price Drops</button>
            </div>

            <select value={sort} onChange={(event) => { setSort(event.target.value as ProductSort); setPage(1); }} className="app-select">
              <option value="name">Name</option>
              <option value="priceLow">Price: Low to High</option>
              <option value="priceHigh">Price: High to Low</option>
              <option value="biggestDrop">Biggest Price Drop</option>
            </select>
          </div>


          {/* Results Count */}

          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="app-muted">
              {visibleProducts.length > 0 ? `Showing ${pageStart + 1}-${pageEnd} of ${visibleProducts.length} products` : "No matching products"}
            </p>

            {totalPages > 1 && <span className="app-muted">Page {currentPage} of {totalPages}</span>}
          </div>


          {/* Products */}

          {paginatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.product_id} product={product} onClick={() => onSelectProduct(product)} />
              ))}
            </div>
          ) : (
            <div className="app-card px-6 py-12 text-center">
              <p className="font-medium text-app-text-secondary">No products found</p>
              <p className="app-muted mt-1">Try changing your search or filter.</p>
            </div>
          )}


          {/* Pagination */}

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="app-btn app-btn-secondary px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40">Previous</button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button type="button" key={pageNumber} onClick={() => setPage(pageNumber)} className={`app-btn h-9 min-w-9 px-3 text-sm ${pageNumber === currentPage ? "app-btn-primary" : "app-btn-secondary"}`}>{pageNumber}</button>
              ))}

              <button type="button" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} className="app-btn app-btn-secondary px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40">Next</button>
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

function SummaryCard({ title, value, subtitle }: SummaryCardProps) {
  return (
    <div className="app-card p-5">
      <p className="app-card-title">{title}</p>
      <p className="mt-2 text-2xl font-bold text-app-text">{value}</p>
      {subtitle && <p className="app-body mt-1">{subtitle}</p>}
    </div>
  );
}


// =============================================================
// Product Card
// =============================================================

function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <button type="button" onClick={onClick} className="app-card-interactive group flex h-44 w-full flex-col p-4 text-left">

      {/* Product Name */}

      <h3 title={product.name} className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-app-text transition-colors group-hover:text-app-text-secondary">
        {product.name}
      </h3>


      {/* Price */}

      <div className="mt-3">
        <p className="text-xl font-bold text-app-text">
          {product.current_price.toFixed(2)}
          <span className="ml-1 text-xs font-normal text-app-text-secondary">kr</span>
        </p>

        <p className="app-muted mt-1 text-xs">Target {product.target_price.toFixed(0)} kr</p>
      </div>


      {/* Status */}

      <div className="mt-auto flex items-end justify-between gap-3 pt-3">

        <div className="min-w-0">
          {product.below_target ? (
            <p className="truncate text-xs font-medium text-success-text">↓ {Math.abs(product.difference).toFixed(0)} kr below target</p>
          ) : (
            <p className="app-muted truncate text-xs">↑ {product.difference.toFixed(0)} kr above target</p>
          )}
        </div>

        {product.below_target ? (
          <span className="status-success shrink-0 rounded-full border px-2 py-1 text-[11px] font-medium">Target</span>
        ) : (
          <span className="status-unknown shrink-0 rounded-full border px-2 py-1 text-[11px] font-medium">Above</span>
        )}

      </div>

    </button>
  );
}
