import { useMemo, useState } from "react";

import type { Product } from "@/types/product";


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


export function useProductList(products: Product[]) {
  const [searchQuery, setSearchQueryState] = useState("");
  const [filter, setFilterState] = useState<ProductFilter>("all");
  const [sort, setSortState] = useState<ProductSort>("name");
  const [page, setPage] = useState(1);


  const visibleProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products
      .filter(product => matchesSearch(product, query) && matchesFilter(product, filter))
      .sort((a, b) => compareProducts(a, b, sort));
  }, [products, searchQuery, filter, sort]);


  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / PRODUCTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const pageEnd = Math.min(pageStart + PRODUCTS_PER_PAGE, visibleProducts.length);
  const paginatedProducts = visibleProducts.slice(pageStart, pageEnd);


  function setSearchQuery(value: string) {
    setSearchQueryState(value);
    setPage(1);
  }

  function setFilter(value: ProductFilter) {
    setFilterState(value);
    setPage(1);
  }

  function setSort(value: ProductSort) {
    setSortState(value);
    setPage(1);
  }


  return {
    products: paginatedProducts,
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    sort,
    setSort,
    page: currentPage,
    setPage,
    totalPages,
    totalResults: visibleProducts.length,
    pageStart,
    pageEnd,
  };
}


function matchesSearch(product: Product, query: string): boolean {
  if (!query) return true;

  return (
    product.name.toLowerCase().includes(query) ||
    product.store?.toLowerCase().includes(query) === true ||
    product.unit_store?.toLowerCase().includes(query) === true ||
    (product.offers ?? []).some(
      offer =>
        offer.store?.toLowerCase().includes(query) === true ||
        offer.note?.toLowerCase().includes(query) === true,
    )
  );
}


function matchesFilter(product: Product, filter: ProductFilter): boolean {
  if (filter === "belowTarget") return product.below_target === true;
  if (filter === "unitBelowTarget") return product.unit_below_target === true;

  if (filter === "priceDrops") {
    return (
      product.current_price !== null &&
      product.previous_price !== null &&
      product.current_price < product.previous_price
    );
  }

  return true;
}


function compareProducts(a: Product, b: Product, sort: ProductSort): number {
  if (sort === "name") return a.name.localeCompare(b.name);

  if (sort === "priceLow") {
    return nullablePrice(a.current_price, Infinity) - nullablePrice(b.current_price, Infinity);
  }

  if (sort === "priceHigh") {
    return nullablePrice(b.current_price, -Infinity) - nullablePrice(a.current_price, -Infinity);
  }

  if (sort === "unitPriceLow") {
    return nullablePrice(a.current_unit_price, Infinity) - nullablePrice(b.current_unit_price, Infinity);
  }

  if (sort === "unitPriceHigh") {
    return nullablePrice(b.current_unit_price, -Infinity) - nullablePrice(a.current_unit_price, -Infinity);
  }

  return getPriceDrop(b) - getPriceDrop(a);
}


function nullablePrice(value: number | null | undefined, fallback: number): number {
  return value ?? fallback;
}


function getPriceDrop(product: Product): number {
  const current = product.current_price;
  const previous = product.previous_price;

  if (current === null || previous === null) return 0;

  return Math.max(previous - current, 0);
}