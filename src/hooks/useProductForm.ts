import { useState } from "react";

import type {
  ProductConfig,
  ProductConfigInput,
  ProductSource,
  ProductSourceInput,
} from "@/services/productConfigApi";

import {
  isHttpUrl,
  parseOptionalPositiveNumber,
  parseRequiredPositiveNumber,
} from "@/utils/validation";


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
  sources: ProductSourceFormState[];
}

type ProductField = Exclude<keyof ProductFormState, "sources">;


export function createEmptySource(): ProductSourceFormState {
  return {
    store: "",
    url: "",
    scrapingEnabled: true,
    manualPrice: "",
    unitQuantity: "",
    note: "",
  };
}


export function createEmptyProductForm(): ProductFormState {
  return {
    name: "",
    scrapingEnabled: true,
    comparisonQuantity: "",
    targetPrice: "",
    targetUnitPrice: "",
    unit: "",
    currency: "SEK",
    sources: [createEmptySource()],
  };
}


export function useProductForm() {
  const [form, setForm] = useState<ProductFormState>(createEmptyProductForm());


  function reset() {
    setForm(createEmptyProductForm());
  }


  function loadProduct(product: ProductConfig) {
    const sources: ProductSource[] = product.sources?.length
      ? product.sources
      : product.url
        ? [{
            store: "Source",
            url: product.url,
            scraping_enabled: true,
            manual_price: null,
            unit_quantity: null,
            note: null,
          }]
        : [];

    setForm({
      name: product.name,
      scrapingEnabled: product.scraping_enabled ?? true,
      comparisonQuantity: toText(product.comparison_quantity),
      targetPrice: String(product.target_price),
      targetUnitPrice: toText(product.target_unit_price),
      unit: product.unit ?? "",
      currency: product.currency,
      sources: sources.length ? sources.map(sourceToForm) : [createEmptySource()],
    });
  }


  function setField<K extends ProductField>(field: K, value: ProductFormState[K]) {
    setForm(current => ({
      ...current,
      [field]: value,
    }));
  }


  function addSource() {
    setForm(current => ({
      ...current,
      sources: [...current.sources, createEmptySource()],
    }));
  }


  function removeSource(index: number) {
    setForm(current => {
      if (current.sources.length <= 1) return current;

      return {
        ...current,
        sources: current.sources.filter((_, i) => i !== index),
      };
    });
  }


  function updateSource<K extends keyof ProductSourceFormState>(
    index: number,
    field: K,
    value: ProductSourceFormState[K],
  ) {
    setForm(current => ({
      ...current,
      sources: current.sources.map((source, i) =>
        i === index ? { ...source, [field]: value } : source,
      ),
    }));
  }


  function buildInput(): ProductConfigInput {
    const name = form.name.trim();
    const unit = form.unit.trim();
    const currency = form.currency.trim().toUpperCase();

    if (!name) throw new Error("Product name is required.");
    if (!currency) throw new Error("Currency is required.");

    const comparisonQuantity = parseOptionalPositiveNumber(
      form.comparisonQuantity,
      "Comparison quantity",
    );

    const targetPrice = parseRequiredPositiveNumber(
      form.targetPrice,
      "Target price",
    );

    const targetUnitPrice = parseOptionalPositiveNumber(
      form.targetUnitPrice,
      "Target unit price",
    );

    const sources = form.sources.map((source, index) =>
      buildSource(source, index, form.scrapingEnabled),
    );

    const urls = sources.map(source => source.url.toLowerCase());

    if (new Set(urls).size !== urls.length) {
      throw new Error("Store URLs must be unique.");
    }

    const needsUnit =
      comparisonQuantity !== null ||
      targetUnitPrice !== null ||
      sources.some(source => source.unit_quantity !== null);

    if (needsUnit && !unit) {
      throw new Error(
        "Unit is required when comparison or unit price tracking is enabled.",
      );
    }

    return {
      name,
      scraping_enabled: form.scrapingEnabled,
      comparison_quantity: comparisonQuantity,
      sources,
      target_price: targetPrice,
      target_unit_price: targetUnitPrice,
      unit: unit || null,
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


function sourceToForm(source: ProductSource): ProductSourceFormState {
  return {
    store: source.store,
    url: source.url,
    scrapingEnabled: source.scraping_enabled ?? true,
    manualPrice: toText(source.manual_price),
    unitQuantity: toText(source.unit_quantity),
    note: source.note ?? "",
  };
}


function buildSource(
  source: ProductSourceFormState,
  index: number,
  productScrapingEnabled: boolean,
): ProductSourceInput {
  const number = index + 1;
  const store = source.store.trim();
  const url = source.url.trim();

  if (!store) throw new Error(`Store ${number}: name is required.`);
  if (!url) throw new Error(`Store ${number}: URL is required.`);
  if (!isHttpUrl(url)) {
    throw new Error(`Store ${number}: URL must use http:// or https://.`);
  }

  const manualPrice = parseOptionalPositiveNumber(
    source.manualPrice,
    `Store ${number}: manual price`,
  );

  const unitQuantity = parseOptionalPositiveNumber(
    source.unitQuantity,
    `Store ${number}: unit quantity`,
  );

  const shouldScrape = productScrapingEnabled && source.scrapingEnabled;

  if (!shouldScrape && manualPrice === null) {
    throw new Error(
      `Store ${number}: manual price is required when scraping is disabled.`,
    );
  }

  return {
    store,
    url,
    scraping_enabled: source.scrapingEnabled,
    manual_price: manualPrice,
    unit_quantity: unitQuantity,
    note: source.note.trim() || null,
  };
}


function toText(value: number | null | undefined): string {
  return value == null ? "" : String(value);
}