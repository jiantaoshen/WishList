import {
  useState,
} from "react";

import type {
  ProductConfig,
  ProductConfigInput,
  ProductSource,
} from "@/services/productConfigApi";


export interface ProductSourceFormState {
  store: string;
  url: string;
  unitQuantity: string;
  note: string;
}


export interface ProductFormState {
  name: string;
  targetPrice: string;
  targetUnitPrice: string;
  unit: string;
  currency: string;
  sources: ProductSourceFormState[];
}


export function createEmptySource():
  ProductSourceFormState {
  return {
    store: "",
    url: "",
    unitQuantity: "",
    note: "",
  };
}


export function createEmptyProductForm():
  ProductFormState {
  return {
    name: "",
    targetPrice: "",
    targetUnitPrice: "",
    unit: "",
    currency: "SEK",
    sources: [
      createEmptySource(),
    ],
  };
}


export function useProductForm() {
  const [
    form,
    setForm,
  ] = useState<ProductFormState>(
    createEmptyProductForm(),
  );


  function reset() {
    setForm(
      createEmptyProductForm(),
    );
  }


  function loadProduct(
    product: ProductConfig,
  ) {
    let sources =
      product.sources ?? [];


    // Old JSON compatibility.
    if (
      sources.length === 0 &&
      product.url
    ) {
      sources = [
        {
          store: "Source",
          url: product.url,
          unit_quantity: null,
          note: null,
        },
      ];
    }


    setForm({
      name: product.name,

      targetPrice:
        String(
          product.target_price,
        ),

      targetUnitPrice:
        product.target_unit_price !==
        null
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


  function setField<
    K extends keyof Omit<
      ProductFormState,
      "sources"
    >,
  >(
    field: K,
    value: ProductFormState[K],
  ) {
    setForm(
      current => ({
        ...current,
        [field]: value,
      }),
    );
  }


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


  function buildInput():
    ProductConfigInput {
    const name =
      form.name.trim();

    if (!name) {
      throw new Error(
        "Product name is required.",
      );
    }


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


    const sources =
      form.sources.map(
        (
          source,
          index,
        ) =>
          buildSource(
            source,
            index,
          ),
      );


    const hasUnitQuantity =
      sources.some(
        source =>
          source.unit_quantity !==
          null,
      );


    const unit =
      form.unit.trim();


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


    const currency =
      form.currency
        .trim()
        .toUpperCase();


    if (!currency) {
      throw new Error(
        "Currency is required.",
      );
    }


    return {
      name,
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


function sourceToForm(
  source: ProductSource,
): ProductSourceFormState {
  return {
    store: source.store,
    url: source.url,

    unitQuantity:
      source.unit_quantity !==
      null
        ? String(
            source.unit_quantity,
          )
        : "",

    note:
      source.note ?? "",
  };
}


function buildSource(
  source:
    ProductSourceFormState,
  index: number,
): ProductSource {
  const store =
    source.store.trim();

  const url =
    source.url.trim();


  if (!store) {
    throw new Error(
      `Store ${index + 1}: name is required.`,
    );
  }


  if (!url) {
    throw new Error(
      `Store ${index + 1}: URL is required.`,
    );
  }


  if (
    !isHttpUrl(url)
  ) {
    throw new Error(
      `Store ${index + 1}: URL must use http:// or https://.`,
    );
  }


  const unitQuantity =
    parseOptionalPositiveNumber(
      source.unitQuantity,
      `Store ${index + 1}: unit quantity`,
    );


  return {
    store,
    url,
    unit_quantity:
      unitQuantity,
    note:
      source.note.trim() ||
      null,
  };
}


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