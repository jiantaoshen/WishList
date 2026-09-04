import {
  useEffect,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  createProductConfig,
  deleteProductConfig,
  fetchProductConfigs,
  updateProductConfig,
} from "../../services/productConfigApi";

import type {
  ProductConfig,
  ProductConfigInput,
  ProductSource,
} from "../../services/productConfigApi";


// =============================================================
// Empty Product
// =============================================================

function createEmptyProduct():
ProductConfigInput {

  return {

    name: "",

    sources: [
      {
        store: "",
        url: "",
        unit_quantity: null,
        note: "",
      },
    ],

    target_price: 100,

    target_unit_price: null,

    unit: null,

    currency: "SEK",
  };
}


// =============================================================
// Product Management
// =============================================================

export function ProductManagement() {

  const [
    products,
    setProducts,
  ] = useState<ProductConfig[]>([]);


  const [
    form,
    setForm,
  ] = useState<ProductConfigInput>(
    createEmptyProduct()
  );


  const [
    editingId,
    setEditingId,
  ] = useState<string | null>(
    null
  );


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );


  const [
    success,
    setSuccess,
  ] = useState<string | null>(
    null
  );


  // =========================================================
  // Load
  // =========================================================

  async function loadProducts() {

    try {

      const data =
        await fetchProductConfigs();

      setProducts(data);

    } catch (error) {

      if (error instanceof Error) {
        setError(error.message);
      }

    } finally {

      setLoading(false);

    }
  }


  useEffect(() => {
    loadProducts();
  }, []);


  // =========================================================
  // Reset
  // =========================================================

  function resetForm() {

    setForm(
      createEmptyProduct()
    );

    setEditingId(null);
  }


  // =========================================================
  // Source Helpers
  // =========================================================

  function updateSource<
    K extends keyof ProductSource
  >(
    index: number,
    field: K,
    value: ProductSource[K],
  ) {

    setForm((current) => {

      const sources = [
        ...current.sources,
      ];


      sources[index] = {
        ...sources[index],
        [field]: value,
      };


      return {
        ...current,
        sources,
      };

    });
  }


  function addSource() {

    setForm((current) => ({

      ...current,

      sources: [
        ...current.sources,

        {
          store: "",
          url: "",
          unit_quantity: null,
          note: "",
        },
      ],

    }));
  }


  function removeSource(
    index: number
  ) {

    setForm((current) => {

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
              sourceIndex !== index
          ),

      };

    });
  }


  // =========================================================
  // Edit
  // =========================================================

  function startEdit(
    product: ProductConfig
  ) {

    let sources:
      ProductSource[];


    if (
      product.sources &&
      product.sources.length > 0
    ) {

      sources =
        product.sources.map(
          (source) => ({

            store:
              source.store,

            url:
              source.url,

            unit_quantity:
              source.unit_quantity ??
              null,

            note:
              source.note ??
              "",

          })
        );

    } else if (product.url) {

      sources = [
        {
          store: "",
          url: product.url,
          unit_quantity: null,
          note: "",
        },
      ];

    } else {

      sources = [
        {
          store: "",
          url: "",
          unit_quantity: null,
          note: "",
        },
      ];

    }


    setForm({

      name:
        product.name,

      sources,

      target_price:
        product.target_price,

      target_unit_price:
        product.target_unit_price ??
        null,

      unit:
        product.unit ??
        null,

      currency:
        product.currency,

    });


    setEditingId(
      product.id
    );

    setError(null);

    setSuccess(null);
  }


  // =========================================================
  // Save
  // =========================================================

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {

    event.preventDefault();


    setSaving(true);

    setError(null);

    setSuccess(null);


    try {

      const cleanedForm:
        ProductConfigInput = {

        name:
          form.name.trim(),

        sources:
          form.sources.map(
            (source) => ({

              store:
                source.store.trim(),

              url:
                source.url.trim(),

              unit_quantity:
                source.unit_quantity,

              note:
                source.note?.trim()
                  || null,

            })
          ),

        target_price:
          form.target_price,

        target_unit_price:
          form.target_unit_price,

        unit:
          form.unit?.trim()
            || null,

        currency:
          form.currency
            .trim()
            .toUpperCase(),

      };


      if (editingId) {

        await updateProductConfig(
          editingId,
          cleanedForm
        );

        setSuccess(
          "Product updated."
        );

      } else {

        await createProductConfig(
          cleanedForm
        );

        setSuccess(
          "Product added."
        );
      }


      resetForm();

      await loadProducts();


    } catch (error) {

      if (error instanceof Error) {

        setError(
          error.message
        );

      } else {

        setError(
          "Failed to save product."
        );

      }

    } finally {

      setSaving(false);

    }
  }


  // =========================================================
  // Delete
  // =========================================================

  async function handleDelete(
    product: ProductConfig
  ) {

    const confirmed =
      window.confirm(
        `Delete "${product.name}"?`
      );


    if (!confirmed) {
      return;
    }


    setError(null);

    setSuccess(null);


    try {

      await deleteProductConfig(
        product.id
      );


      setSuccess(
        "Product deleted."
      );


      if (
        editingId === product.id
      ) {
        resetForm();
      }


      await loadProducts();


    } catch (error) {

      if (error instanceof Error) {

        setError(
          error.message
        );

      }

    }
  }


  // =========================================================
  // UI
  // =========================================================

  return (

    <section className="app-card p-6">

      {/* Header */}

      <div>

        <h2 className="app-page-title">
          Products
        </h2>

        <p className="app-body mt-1">
          Manage products, stores,
          total prices and unit prices.
        </p>

      </div>


      {/* =====================================================
          Form
      ===================================================== */}

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid gap-4 md:grid-cols-2"
      >

        {/* Name */}

        <div className="md:col-span-2">

          <label
            htmlFor="product-name"
            className="app-body font-medium"
          >
            Name
          </label>

          <input
            id="product-name"
            type="text"
            required
            value={form.name}

            onChange={(event) =>
              setForm({
                ...form,
                name:
                  event.target.value,
              })
            }

            placeholder="Product name"
            className="app-input mt-2"
          />

        </div>


        {/* Target Total */}

        <div>

          <label
            htmlFor="target-price"
            className="app-body font-medium"
          >
            Target Total Price
          </label>

          <input
            id="target-price"
            type="number"
            min="0.01"
            step="0.01"
            required

            value={
              form.target_price
            }

            onChange={(event) =>
              setForm({
                ...form,

                target_price:
                  Number(
                    event.target.value
                  ),
              })
            }

            className="app-input mt-2"
          />

        </div>


        {/* Currency */}

        <div>

          <label
            htmlFor="currency"
            className="app-body font-medium"
          >
            Currency
          </label>

          <select
            id="currency"

            value={
              form.currency
            }

            onChange={(event) =>
              setForm({
                ...form,

                currency:
                  event.target.value,
              })
            }

            className="app-select mt-2 w-full"
          >

            <option value="SEK">
              SEK
            </option>

            <option value="EUR">
              EUR
            </option>

            <option value="USD">
              USD
            </option>

            <option value="GBP">
              GBP
            </option>

          </select>

        </div>


        {/* Unit */}

        <div>

          <label
            htmlFor="unit"
            className="app-body font-medium"
          >
            Unit
          </label>

          <input
            id="unit"
            type="text"

            value={
              form.unit ?? ""
            }

            onChange={(event) =>
              setForm({
                ...form,

                unit:
                  event.target.value ||
                  null,
              })
            }

            placeholder="pcs, kg, L, m..."
            className="app-input mt-2"
          />

        </div>


        {/* Unit Target */}

        <div>

          <label
            htmlFor="target-unit-price"
            className="app-body font-medium"
          >
            Target Unit Price
          </label>

          <input
            id="target-unit-price"
            type="number"
            min="0.0001"
            step="0.0001"

            value={
              form.target_unit_price ??
              ""
            }

            onChange={(event) =>
              setForm({
                ...form,

                target_unit_price:
                  event.target.value === ""
                    ? null
                    : Number(
                        event.target.value
                      ),
              })
            }

            placeholder="Optional"
            className="app-input mt-2"
          />

        </div>


        {/* =================================================
            Sources
        ================================================= */}

        <div className="md:col-span-2">

          <div className="flex items-center justify-between gap-4">

            <div>

              <p className="app-body font-medium">
                Product Sources
              </p>

              <p className="app-muted mt-1">
                Add stores, package quantities
                and optional notes.
              </p>

            </div>


            <button
              type="button"
              onClick={addSource}
              className="app-btn app-btn-secondary px-3 py-2 text-sm"
            >
              + Add Source
            </button>

          </div>


          <div className="mt-4 space-y-4">

            {form.sources.map(
              (source, index) => (

                <div
                  key={index}
                  className="rounded-xl border border-app-border p-4"
                >

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[180px_1fr_180px_auto]">

                    {/* Store */}

                    <div>

                      <label
                        htmlFor={`source-store-${index}`}
                        className="app-body font-medium"
                      >
                        Store
                      </label>

                      <input
                        id={`source-store-${index}`}
                        type="text"
                        required

                        value={
                          source.store
                        }

                        onChange={(event) =>
                          updateSource(
                            index,
                            "store",
                            event.target.value
                          )
                        }

                        placeholder="Inet"

                        className="app-input mt-2"
                      />

                    </div>


                    {/* URL */}

                    <div>

                      <label
                        htmlFor={`source-url-${index}`}
                        className="app-body font-medium"
                      >
                        Product URL
                      </label>

                      <input
                        id={`source-url-${index}`}
                        type="url"
                        required

                        value={
                          source.url
                        }

                        onChange={(event) =>
                          updateSource(
                            index,
                            "url",
                            event.target.value
                          )
                        }

                        placeholder="https://..."

                        className="app-input mt-2"
                      />

                    </div>


                    {/* Quantity */}

                    <div>

                      <label
                        htmlFor={`source-quantity-${index}`}
                        className="app-body font-medium"
                      >
                        Unit Quantity
                      </label>

                      <input
                        id={`source-quantity-${index}`}
                        type="number"
                        min="0.0001"
                        step="0.0001"

                        value={
                          source.unit_quantity ??
                          ""
                        }

                        onChange={(event) =>
                          updateSource(
                            index,

                            "unit_quantity",

                            event.target.value === ""
                              ? null
                              : Number(
                                  event.target.value
                                )
                          )
                        }

                        placeholder="12"

                        className="app-input mt-2"
                      />

                    </div>


                    {/* Remove */}

                    <div className="flex items-end">

                      <button
                        type="button"

                        disabled={
                          form.sources.length <= 1
                        }

                        onClick={() =>
                          removeSource(index)
                        }

                        className="app-btn app-btn-danger px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Remove
                      </button>

                    </div>


                    {/* Note */}

                    <div className="md:col-span-2 xl:col-span-4">

                      <label
                        htmlFor={`source-note-${index}`}
                        className="app-body font-medium"
                      >
                        Note
                      </label>

                      <textarea
                        id={`source-note-${index}`}

                        value={
                          source.note ?? ""
                        }

                        onChange={(event) =>
                          updateSource(
                            index,
                            "note",
                            event.target.value
                          )
                        }

                        placeholder="Free keyboard + mouse, coupon, bundled accessory..."

                        className="app-input mt-2 min-h-20 resize-y"
                      />

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        </div>


        {/* Actions */}

        <div className="flex flex-wrap gap-3 md:col-span-2">

          <button
            type="submit"
            disabled={saving}
            className="app-btn app-btn-primary px-5 py-2.5 text-sm"
          >

            {
              saving
                ? "Saving..."
                : editingId
                  ? "Update Product"
                  : "Add Product"
            }

          </button>


          {editingId && (

            <button
              type="button"
              onClick={resetForm}
              className="app-btn app-btn-secondary px-5 py-2.5 text-sm"
            >
              Cancel
            </button>

          )}

        </div>

      </form>


      {/* Messages */}

      {error && (

        <div className="status-danger mt-5 rounded-xl border px-4 py-3">
          <p className="text-sm">
            {error}
          </p>
        </div>

      )}


      {success && (

        <div className="status-success mt-5 rounded-xl border px-4 py-3">
          <p className="text-sm">
            {success}
          </p>
        </div>

      )}


      {/* =====================================================
          Config List
      ===================================================== */}

      <div className="mt-8">

        <div className="flex items-center justify-between border-b border-app-border pb-3">

          <h3 className="app-section-title">
            Tracked Products
          </h3>

          <span className="app-muted">
            {products.length} products
          </span>

        </div>


        {loading ? (

          <p className="app-body py-6">
            Loading products...
          </p>

        ) : products.length === 0 ? (

          <div className="py-10 text-center">

            <p className="font-medium text-app-text-secondary">
              No products configured
            </p>

          </div>

        ) : (

          <div className="divide-y divide-app-border">

            {products.map(
              (product) => (

                <div
                  key={product.id}
                  className="flex flex-col gap-4 py-5 sm:flex-row sm:items-start sm:justify-between"
                >

                  <div className="min-w-0 flex-1">

                    <p className="font-medium text-app-text">
                      {product.name}
                    </p>


                    <p className="app-body mt-1">

                      Total target:{" "}

                      {product.target_price.toFixed(2)}{" "}

                      {product.currency}

                    </p>


                    {product.target_unit_price !== null &&
                     product.target_unit_price !== undefined && (

                      <p className="app-body mt-1">

                        Unit target:{" "}

                        {product.target_unit_price.toFixed(4)}{" "}

                        {product.currency}

                        {product.unit
                          ? `/${product.unit}`
                          : ""}

                      </p>

                    )}


                    <div className="mt-3 space-y-3">

                      {(product.sources ?? []).map(
                        (source, index) => (

                          <div
                            key={`${source.url}-${index}`}
                          >

                            <p className="text-sm font-medium text-app-text-secondary">
                              {source.store}
                            </p>


                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="app-muted block truncate hover:underline"
                            >
                              {source.url}
                            </a>


                            {source.unit_quantity !== null && (

                              <p className="app-muted mt-1 text-xs">

                                Quantity:{" "}

                                {source.unit_quantity}

                                {product.unit
                                  ? ` ${product.unit}`
                                  : ""}

                              </p>

                            )}


                            {source.note && (

                              <p className="app-muted mt-1 text-xs">
                                🎁 {source.note}
                              </p>

                            )}

                          </div>

                        )
                      )}

                    </div>

                  </div>


                  <div className="flex shrink-0 gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        startEdit(product)
                      }
                      className="app-btn app-btn-secondary px-3 py-2 text-sm"
                    >
                      Edit
                    </button>


                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(product)
                      }
                      className="app-btn app-btn-danger px-3 py-2 text-sm"
                    >
                      Delete
                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </section>
  );
}