import {
  useMemo,
  useState,
} from "react";

import type {
  DataFile,
  HistoryIndex,
  Product,
} from "../../types/product";


type ProductFilter =
  | "all"
  | "belowTarget"
  | "unitBelowTarget"
  | "priceDrops";


type ProductSort =
  | "name"
  | "priceLow"
  | "priceHigh"
  | "unitPriceLow"
  | "unitPriceHigh"
  | "biggestDrop";


interface ProductListProps {
  data: DataFile;
  history: HistoryIndex | null;
  onManageProducts: () => void;
  onSelectProduct:
    (product: Product) => void;
}


interface ProductCardProps {
  product: Product;
  onClick: () => void;
}


const PRODUCTS_PER_PAGE = 12;


// =============================================================
// Product List
// =============================================================

export function ProductList({
  data,
  history,
  onManageProducts,
  onSelectProduct,
}: ProductListProps) {

  const totalProducts =
    data.data.length;


  const belowTarget =
    data.data.filter(
      (product) =>
        product.below_target === true
    ).length;


  const unitBelowTarget =
    data.data.filter(
      (product) =>
        product.unit_below_target ===
        true
    ).length;


  const priceDrops =
    data.data.filter(
      (product) => {

        const current =
          product.current_price;

        const previous =
          product.previous_price;


        return (
          current !== null &&
          previous !== null &&
          current < previous
        );
      }
    ).length;


  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");


  const [
    filter,
    setFilter,
  ] = useState<ProductFilter>(
    "all"
  );


  const [
    sort,
    setSort,
  ] = useState<ProductSort>(
    "name"
  );


  const [
    page,
    setPage,
  ] = useState(1);


  // =========================================================
  // Filter / Sort
  // =========================================================

  const visibleProducts =
    useMemo(() => {

      const query =
        searchQuery
          .trim()
          .toLowerCase();


      const filtered =
        data.data.filter(
          (product) => {

            const matchesName =
              product.name
                .toLowerCase()
                .includes(query);


            const matchesStore =
              product.store
                ?.toLowerCase()
                .includes(query)
              ?? false;


            const matchesUnitStore =
              product.unit_store
                ?.toLowerCase()
                .includes(query)
              ?? false;


            const matchesOffers =
              product.offers
                ?.some(
                  (offer) =>
                    offer.store
                      ?.toLowerCase()
                      .includes(query)
                    ||
                    offer.note
                      ?.toLowerCase()
                      .includes(query)
                )
              ?? false;


            if (
              query &&
              !matchesName &&
              !matchesStore &&
              !matchesUnitStore &&
              !matchesOffers
            ) {
              return false;
            }


            if (
              filter ===
              "belowTarget"
            ) {
              return (
                product.below_target ===
                true
              );
            }


            if (
              filter ===
              "unitBelowTarget"
            ) {
              return (
                product.unit_below_target ===
                true
              );
            }


            if (
              filter ===
              "priceDrops"
            ) {

              const current =
                product.current_price;

              const previous =
                product.previous_price;


              return (
                current !== null &&
                previous !== null &&
                current < previous
              );
            }


            return true;
          }
        );


      return [...filtered].sort(
        (a, b) => {

          if (sort === "name") {

            return a.name.localeCompare(
              b.name
            );
          }


          if (
            sort === "priceLow"
          ) {

            return (
              (
                a.current_price ??
                Infinity
              )
              -
              (
                b.current_price ??
                Infinity
              )
            );
          }


          if (
            sort === "priceHigh"
          ) {

            return (
              (
                b.current_price ??
                -Infinity
              )
              -
              (
                a.current_price ??
                -Infinity
              )
            );
          }


          if (
            sort ===
            "unitPriceLow"
          ) {

            return (
              (
                a.current_unit_price ??
                Infinity
              )
              -
              (
                b.current_unit_price ??
                Infinity
              )
            );
          }


          if (
            sort ===
            "unitPriceHigh"
          ) {

            return (
              (
                b.current_unit_price ??
                -Infinity
              )
              -
              (
                a.current_unit_price ??
                -Infinity
              )
            );
          }


          if (
            sort ===
            "biggestDrop"
          ) {

            const aDrop =
              a.current_price !== null &&
              a.previous_price !== null

                ? (
                    a.previous_price -
                    a.current_price
                  )

                : 0;


            const bDrop =
              b.current_price !== null &&
              b.previous_price !== null

                ? (
                    b.previous_price -
                    b.current_price
                  )

                : 0;


            return bDrop - aDrop;
          }


          return 0;
        }
      );

    }, [
      data.data,
      searchQuery,
      filter,
      sort,
    ]);


  // =========================================================
  // Pagination
  // =========================================================

  const totalPages =
    Math.max(
      1,

      Math.ceil(
        visibleProducts.length /
        PRODUCTS_PER_PAGE
      )
    );


  const currentPage =
    Math.min(
      page,
      totalPages
    );


  const pageStart =
    (
      currentPage - 1
    ) * PRODUCTS_PER_PAGE;


  const paginatedProducts =
    visibleProducts.slice(
      pageStart,
      pageStart +
        PRODUCTS_PER_PAGE
    );


  // =========================================================
  // UI
  // =========================================================

  return (
    <>

      {/* Summary */}

      <div className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-4">

        <Summary
          label="Products"
          value={totalProducts}
        />

        <Summary
          label="Below Total Target"
          value={belowTarget}
        />

        <Summary
          label="Below Unit Target"
          value={unitBelowTarget}
        />

        <Summary
          label="Price Drops"
          value={priceDrops}
        />

      </div>


      {totalProducts === 0 ? (

        <div className="app-card-dashed px-6 py-14 text-center">

          <h2 className="app-section-title">
            No products tracked yet
          </h2>

          <button
            type="button"
            onClick={onManageProducts}
            className="app-btn app-btn-primary mt-5"
          >
            Add Product
          </button>

        </div>

      ) : (
        <>

          <div className="mb-4 flex items-end justify-between">

            <div>

              <h2 className="app-section-title">
                Products
              </h2>

              <p className="app-body mt-1">
                Total and unit price tracking
              </p>

            </div>


            {history && (

              <span className="app-muted">
                {history.periods.length}
                {" weeks of history"}
              </span>

            )}

          </div>


          {/* Search */}

          <input
            type="search"
            placeholder="Search products, stores or notes..."
            value={searchQuery}

            onChange={(event) => {

              setSearchQuery(
                event.target.value
              );

              setPage(1);
            }}

            className="app-input mb-4"
          />


          {/* Filters */}

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:justify-between">

            <div className="flex flex-wrap gap-2">

              <FilterButton
                active={
                  filter === "all"
                }
                onClick={() => {
                  setFilter("all");
                  setPage(1);
                }}
              >
                All
              </FilterButton>


              <FilterButton
                active={
                  filter ===
                  "belowTarget"
                }
                onClick={() => {
                  setFilter(
                    "belowTarget"
                  );
                  setPage(1);
                }}
              >
                Total Target
              </FilterButton>


              <FilterButton
                active={
                  filter ===
                  "unitBelowTarget"
                }
                onClick={() => {
                  setFilter(
                    "unitBelowTarget"
                  );
                  setPage(1);
                }}
              >
                Unit Target
              </FilterButton>


              <FilterButton
                active={
                  filter ===
                  "priceDrops"
                }
                onClick={() => {
                  setFilter(
                    "priceDrops"
                  );
                  setPage(1);
                }}
              >
                Price Drops
              </FilterButton>

            </div>


            <select
              value={sort}

              onChange={(event) => {

                const value =
                  event.target.value;


                if (
                  value === "name" ||
                  value === "priceLow" ||
                  value === "priceHigh" ||
                  value === "unitPriceLow" ||
                  value === "unitPriceHigh" ||
                  value === "biggestDrop"
                ) {

                  setSort(value);

                  setPage(1);
                }
              }}

              className="app-select"
            >

              <option value="name">
                Name
              </option>

              <option value="priceLow">
                Total: Low to High
              </option>

              <option value="priceHigh">
                Total: High to Low
              </option>

              <option value="unitPriceLow">
                Unit: Low to High
              </option>

              <option value="unitPriceHigh">
                Unit: High to Low
              </option>

              <option value="biggestDrop">
                Biggest Price Drop
              </option>

            </select>

          </div>


          {/* Cards */}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">

            {paginatedProducts.map(
              (product) => (

                <ProductCard
                  key={
                    product.product_id
                  }
                  product={product}

                  onClick={() =>
                    onSelectProduct(
                      product
                    )
                  }
                />

              )
            )}

          </div>


          {/* Pagination */}

          {totalPages > 1 && (

            <div className="mt-6 flex justify-center gap-2">

              <button
                type="button"

                disabled={
                  currentPage === 1
                }

                onClick={() =>
                  setPage(
                    currentPage - 1
                  )
                }

                className="app-btn app-btn-secondary px-3 py-2"
              >
                Previous
              </button>


              <span className="app-muted flex items-center">
                {currentPage} / {totalPages}
              </span>


              <button
                type="button"

                disabled={
                  currentPage ===
                  totalPages
                }

                onClick={() =>
                  setPage(
                    currentPage + 1
                  )
                }

                className="app-btn app-btn-secondary px-3 py-2"
              >
                Next
              </button>

            </div>

          )}

        </>
      )}

    </>
  );
}


// =============================================================
// Product Card
// =============================================================

function ProductCard({
  product,
  onClick,
}: ProductCardProps) {

  const currentPrice =
    product.current_price;


  const unitPrice =
    product.current_unit_price ??
    null;


  const offers =
    product.offers ?? [];


  return (

    <button
      type="button"
      onClick={onClick}
      className="app-card-interactive flex min-h-60 w-full flex-col p-4 text-left"
    >

      <h3 className="line-clamp-2 font-semibold text-app-text">
        {product.name}
      </h3>


      {/* Total */}

      <div className="mt-4">

        <p className="app-muted text-xs">
          Lowest total
        </p>


        {currentPrice !== null ? (

          <p className="text-xl font-bold text-app-text">
            {currentPrice.toFixed(2)}
            {" "}
            {product.currency}
          </p>

        ) : (

          <p className="text-app-text-secondary">
            N/A
          </p>

        )}


        {product.store && (

          <p className="app-muted text-xs">
            {product.store}
          </p>

        )}

      </div>


      {/* Unit */}

      {unitPrice !== null && (

        <div className="mt-3">

          <p className="app-muted text-xs">
            Lowest unit price
          </p>


          <p className="font-semibold text-app-text">

            {unitPrice.toFixed(4)}
            {" "}
            {product.currency}

            {product.unit
              ? `/${product.unit}`
              : ""}

          </p>


          {product.unit_store && (

            <p className="app-muted text-xs">
              {product.unit_store}
            </p>

          )}

        </div>

      )}


      <div className="mt-auto pt-4">

        <p className="app-muted text-xs">
          {offers.length}{" "}
          {offers.length === 1
            ? "store"
            : "stores"}{" "}
          compared
        </p>


        {product.below_target && (

          <span className="status-success mt-2 inline-block rounded-full border px-2 py-1 text-[11px]">
            Total Target
          </span>

        )}


        {product.unit_below_target && (

          <span className="status-success ml-2 mt-2 inline-block rounded-full border px-2 py-1 text-[11px]">
            Unit Target
          </span>

        )}

      </div>

    </button>
  );
}


// =============================================================
// Helpers
// =============================================================

function Summary({
  label,
  value,
}: {
  label: string;
  value: number;
}) {

  return (
    <div className="app-card p-5">

      <p className="app-card-title">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>

    </div>
  );
}


function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {

  return (
    <button
      type="button"
      onClick={onClick}

      className={
        `app-btn rounded-full px-4 py-2 text-sm ${
          active
            ? "app-btn-primary"
            : "app-btn-secondary"
        }`
      }
    >
      {children}
    </button>
  );
}