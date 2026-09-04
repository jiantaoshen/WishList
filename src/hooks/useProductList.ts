import {
  useMemo,
  useState,
} from "react";

import type {
  Product,
} from "@/types/product";


export type ProductFilter =
  | "all"
  | "belowTarget"
  | "unitBelowTarget"
  | "priceDrops";


export type ProductSort =
  | "name"
  | "priceLow"
  | "priceHigh"
  | "unitPriceLow"
  | "unitPriceHigh"
  | "biggestDrop";


const PRODUCTS_PER_PAGE = 12;


export function useProductList(
  products: Product[],
) {

  const [
    searchQuery,
    setSearchQueryState,
  ] = useState("");


  const [
    filter,
    setFilterState,
  ] = useState<ProductFilter>(
    "all"
  );


  const [
    sort,
    setSortState,
  ] = useState<ProductSort>(
    "name"
  );


  const [
    page,
    setPage,
  ] = useState(1);


  // =========================================================
  // Filter + Sort
  // =========================================================

  const visibleProducts =
    useMemo(() => {

      const query =
        searchQuery
          .trim()
          .toLowerCase();


      const filtered =
        products.filter(
          (product) => {

            // ===============================================
            // Search
            // ===============================================

            const matchesName =
              product.name
                .toLowerCase()
                .includes(query);


            const matchesTotalStore =
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
              (
                product.offers ?? []
              ).some(
                (offer) => {

                  const matchesStore =
                    offer.store
                      ?.toLowerCase()
                      .includes(query)
                    ?? false;


                  const matchesNote =
                    offer.note
                      ?.toLowerCase()
                      .includes(query)
                    ?? false;


                  return (
                    matchesStore ||
                    matchesNote
                  );
                }
              );


            const matchesSearch =
              query.length === 0 ||
              matchesName ||
              matchesTotalStore ||
              matchesUnitStore ||
              matchesOffers;


            if (!matchesSearch) {
              return false;
            }


            // ===============================================
            // Filter
            // ===============================================

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


      // =====================================================
      // Sort
      // =====================================================

      return [...filtered].sort(
        (a, b) => {

          // Name

          if (sort === "name") {

            return a.name.localeCompare(
              b.name
            );
          }


          // Total low -> high

          if (
            sort === "priceLow"
          ) {

            return (
              (
                a.current_price ??
                Number.POSITIVE_INFINITY
              )
              -
              (
                b.current_price ??
                Number.POSITIVE_INFINITY
              )
            );
          }


          // Total high -> low

          if (
            sort === "priceHigh"
          ) {

            return (
              (
                b.current_price ??
                Number.NEGATIVE_INFINITY
              )
              -
              (
                a.current_price ??
                Number.NEGATIVE_INFINITY
              )
            );
          }


          // Unit low -> high

          if (
            sort ===
            "unitPriceLow"
          ) {

            return (
              (
                a.current_unit_price ??
                Number.POSITIVE_INFINITY
              )
              -
              (
                b.current_unit_price ??
                Number.POSITIVE_INFINITY
              )
            );
          }


          // Unit high -> low

          if (
            sort ===
            "unitPriceHigh"
          ) {

            return (
              (
                b.current_unit_price ??
                Number.NEGATIVE_INFINITY
              )
              -
              (
                a.current_unit_price ??
                Number.NEGATIVE_INFINITY
              )
            );
          }


          // Biggest total-price drop

          if (
            sort ===
            "biggestDrop"
          ) {

            const aDrop =
              getPriceDrop(a);


            const bDrop =
              getPriceDrop(b);


            return (
              bDrop - aDrop
            );
          }


          return 0;
        }
      );

    }, [
      products,
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


  const pageEnd =
    Math.min(
      pageStart +
        PRODUCTS_PER_PAGE,
      visibleProducts.length
    );


  const paginatedProducts =
    visibleProducts.slice(
      pageStart,
      pageEnd
    );


  // =========================================================
  // State setters
  //
  // Reset page when filtering changes.
  // =========================================================

  function setSearchQuery(
    value: string,
  ) {

    setSearchQueryState(value);
    setPage(1);
  }


  function setFilter(
    value: ProductFilter,
  ) {

    setFilterState(value);
    setPage(1);
  }


  function setSort(
    value: ProductSort,
  ) {

    setSortState(value);
    setPage(1);
  }


  return {

    products:
      paginatedProducts,

    searchQuery,
    setSearchQuery,

    filter,
    setFilter,

    sort,
    setSort,

    page:
      currentPage,

    setPage,

    totalPages,

    totalResults:
      visibleProducts.length,

    pageStart,

    pageEnd,
  };
}


// =============================================================
// Helpers
// =============================================================

function getPriceDrop(
  product: Product,
): number {

  const current =
    product.current_price;


  const previous =
    product.previous_price;


  if (
    current === null ||
    previous === null
  ) {
    return 0;
  }


  return Math.max(
    previous - current,
    0
  );
}