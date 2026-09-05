import {
  useState,
} from "react";

import type {
  ProductConfig,
  ProductConfigInput,
  ProductSource,
  ProductSourceInput,
} from "@/services/productConfigApi";


// =============================================================
// State
// =============================================================

export interface ProductSourceFormState {
  store: string;
  url: string;

  scrapingEnabled: boolean;
  manualPrice: string;

  unitQuantity: string;
  note: string;
}


export interface ProductFormState {
  name: string;

  scrapingEnabled: boolean;

  comparisonQuantity: string;

  targetPrice: string;

  targetUnitPrice: string;

  unit: string;

  currency: string;

  sources:
    ProductSourceFormState[];
}


// =============================================================
// Empty
// =============================================================

export function createEmptySource():
  ProductSourceFormState {
  return {
    store: "",
    url: "",

    scrapingEnabled: true,
    manualPrice: "",

    unitQuantity: "",
    note: "",
  };
}


export function createEmptyProductForm():
  ProductFormState {
  return {
    name: "",

    scrapingEnabled: true,

    comparisonQuantity: "",

    targetPrice: "",
    targetUnitPrice: "",

    unit: "",
    currency: "SEK",

    sources: [
      createEmptySource(),
    ],
  };
}


// =============================================================
// Hook
// =============================================================

export function useProductForm() {
  const [
    form,
    setForm,
  ] = useState<ProductFormState>(
    createEmptyProductForm(),
  );


  // ===========================================================
  // Reset
  // ===========================================================

  function reset() {
    setForm(
      createEmptyProductForm(),
    );
  }


  // ===========================================================
  // Load
  // ===========================================================

  function loadProduct(
    product: ProductConfig,
  ) {
    let sources =
      product.sources ?? [];


    // Old single URL compatibility.
    if (
      sources.length === 0 &&
      product.url
    ) {
      sources = [
        {
          store: "Source",

          url: product.url,

          scraping_enabled: true,

          manual_price: null,

          unit_quantity: null,

          note: null,
        },
      ];
    }


    setForm({
      name:
        product.name,

      // Old products default to scraping.
      scrapingEnabled:
        product.scraping_enabled ??
        true,

      // Old products may not have
      // comparison_quantity.
      comparisonQuantity:
        product.comparison_quantity !==
          null &&
        product.comparison_quantity !==
          undefined
          ? String(
              product.comparison_quantity,
            )
          : "",

      targetPrice:
        String(
          product.target_price,
        ),

      targetUnitPrice:
        product.target_unit_price !==
          null &&
        product.target_unit_price !==
          undefined
          ? String(
              product.target_unit_price,
            )
          : "",

      unit:
        product.unit ?? "",

      currency:
        product.currency,

      sources:
        sources.length > 0
          ? sources.map(
              sourceToForm,
            )
          : [
              createEmptySource(),
            ],
    });
  }


  // ===========================================================
  // Product Fields
  // ===========================================================

  function setField<
    K extends keyof Omit<
      ProductFormState,
      "sources"
    >,
  >(
    field: K,
    value:
      ProductFormState[K],
  ) {
    setForm(
      current => ({
        ...current,
        [field]: value,
      }),
    );
  }


  // ===========================================================
  // Sources
  // ===========================================================

  function addSource() {
    setForm(
      current => ({
        ...current,

        sources: [
          ...current.sources,
          createEmptySource(),
        ],
      }),
    );
  }


  function removeSource(
    index: number,
  ) {
    setForm(
      current => {
        if (
          current.sources.length <= 1
        ) {
          return current;
        }


        return {
          ...current,

          sources:
            current.sources.filter(
              (_, sourceIndex) =>
                sourceIndex !== index,
            ),
        };
      },
    );
  }


  function updateSource<
    K extends keyof ProductSourceFormState,
  >(
    index: number,
    field: K,
    value:
      ProductSourceFormState[K],
  ) {
    setForm(
      current => ({
        ...current,

        sources:
          current.sources.map(
            (
              source,
              sourceIndex,
            ) =>
              sourceIndex === index
                ? {
                    ...source,
                    [field]: value,
                  }
                : source,
          ),
      }),
    );
  }


  // ===========================================================
  // Build API Input
  // ===========================================================

  function buildInput():
    ProductConfigInput {
    const name =
      form.name.trim();


    if (!name) {
      throw new Error(
        "Product name is required.",
      );
    }


    // ---------------------------------------------------------
    // Comparison quantity
    // ---------------------------------------------------------

    const comparisonQuantity =
      parseOptionalPositiveNumber(
        form.comparisonQuantity,
        "Comparison quantity",
      );


    // ---------------------------------------------------------
    // Target prices
    // ---------------------------------------------------------

    const targetPrice =
      parseRequiredPositiveNumber(
        form.targetPrice,
        "Target price",
      );


    const targetUnitPrice =
      parseOptionalPositiveNumber(
        form.targetUnitPrice,
        "Target unit price",
      );


    // ---------------------------------------------------------
    // Sources
    // ---------------------------------------------------------

    const sources =
      form.sources.map(
        (
          source,
          index,
        ) =>
          buildSource(
            source,
            index,
            form.scrapingEnabled,
          ),
      );


    // ---------------------------------------------------------
    // Duplicate URLs
    // ---------------------------------------------------------

    const urls =
      sources.map(
        source =>
          source.url.toLowerCase(),
      );


    if (
      new Set(urls).size !==
      urls.length
    ) {
      throw new Error(
        "Store URLs must be unique.",
      );
    }


    // ---------------------------------------------------------
    // Unit
    // ---------------------------------------------------------

    const hasUnitQuantity =
      sources.some(
        source =>
          source.unit_quantity !==
          null,
      );


    const unit =
      form.unit.trim();


    // Comparison quantity has a meaning
    // only when a unit is defined.
    if (
      comparisonQuantity !== null &&
      !unit
    ) {
      throw new Error(
        "Unit is required when comparison quantity is set.",
      );
    }


    // Existing unit price tracking rule.
    if (
      (
        hasUnitQuantity ||
        targetUnitPrice !== null
      ) &&
      !unit
    ) {
      throw new Error(
        "Unit is required when unit price tracking is enabled.",
      );
    }


    // ---------------------------------------------------------
    // Currency
    // ---------------------------------------------------------

    const currency =
      form.currency
        .trim()
        .toUpperCase();


    if (!currency) {
      throw new Error(
        "Currency is required.",
      );
    }


    // ---------------------------------------------------------
    // API input
    // ---------------------------------------------------------

    return {
      name,

      scraping_enabled:
        form.scrapingEnabled,

      comparison_quantity:
        comparisonQuantity,

      sources,

      target_price:
        targetPrice,

      target_unit_price:
        targetUnitPrice,

      unit:
        unit || null,

      currency,
    };
  }


  return {
    form,

    reset,
    loadProduct,

    setField,

    addSource,
    removeSource,
    updateSource,

    buildInput,
  };
}


// =============================================================
// Source → Form
// =============================================================

function sourceToForm(
  source: ProductSource,
): ProductSourceFormState {
  return {
    store:
      source.store,

    url:
      source.url,

    scrapingEnabled:
      source.scraping_enabled ??
      true,

    manualPrice:
      source.manual_price !==
        null &&
      source.manual_price !==
        undefined
        ? String(
            source.manual_price,
          )
        : "",

    unitQuantity:
      source.unit_quantity !==
        null &&
      source.unit_quantity !==
        undefined
        ? String(
            source.unit_quantity,
          )
        : "",

    note:
      source.note ?? "",
  };
}


// =============================================================
// Build Source
// =============================================================

function buildSource(
  source:
    ProductSourceFormState,

  index: number,

  productScrapingEnabled: boolean,
): ProductSourceInput {
  const store =
    source.store.trim();

  const url =
    source.url.trim();

  const number =
    index + 1;


  // -----------------------------------------------------------
  // Store
  // -----------------------------------------------------------

  if (!store) {
    throw new Error(
      `Store ${number}: name is required.`,
    );
  }


  // -----------------------------------------------------------
  // URL
  // -----------------------------------------------------------

  if (!url) {
    throw new Error(
      `Store ${number}: URL is required.`,
    );
  }


  if (
    !isHttpUrl(url)
  ) {
    throw new Error(
      `Store ${number}: URL must use http:// or https://.`,
    );
  }


  // -----------------------------------------------------------
  // Manual price
  // -----------------------------------------------------------

  const manualPrice =
    parseOptionalPositiveNumber(
      source.manualPrice,
      `Store ${number}: manual price`,
    );


  // -----------------------------------------------------------
  // Unit quantity
  // -----------------------------------------------------------

  const unitQuantity =
    parseOptionalPositiveNumber(
      source.unitQuantity,
      `Store ${number}: unit quantity`,
    );


  // -----------------------------------------------------------
  // Scraping / Manual mode
  // -----------------------------------------------------------

  const shouldScrape =
    productScrapingEnabled &&
    source.scrapingEnabled;


  if (
    !shouldScrape &&
    manualPrice === null
  ) {
    throw new Error(
      `Store ${number}: manual price is required when scraping is disabled.`,
    );
  }


  // -----------------------------------------------------------
  // API source
  // -----------------------------------------------------------

  return {
    store,
    url,

    scraping_enabled:
      source.scrapingEnabled,

    manual_price:
      manualPrice,

    unit_quantity:
      unitQuantity,

    note:
      source.note.trim() ||
      null,
  };
}


// =============================================================
// Numbers
// =============================================================

function parseRequiredPositiveNumber(
  value: string,
  label: string,
): number {
  const parsed =
    Number(value);


  if (
    !Number.isFinite(parsed) ||
    parsed <= 0
  ) {
    throw new Error(
      `${label} must be greater than 0.`,
    );
  }


  return parsed;
}


function parseOptionalPositiveNumber(
  value: string,
  label: string,
): number | null {
  const trimmed =
    value.trim();


  if (!trimmed) {
    return null;
  }


  return parseRequiredPositiveNumber(
    trimmed,
    label,
  );
}


// =============================================================
// URL
// =============================================================

function isHttpUrl(
  value: string,
): boolean {
  try {
    const url =
      new URL(value);


    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  }
  catch {
    return false;
  }
}