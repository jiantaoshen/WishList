import { useEffect, useState } from "react";

import {
  createProductConfig,
  deleteProductConfig,
  fetchProductConfigs,
  updateProductConfig,
} from "../services/productConfigApi";

import type {
  ProductConfig,
  ProductConfigInput,
} from "../services/productConfigApi";


const EMPTY_PRODUCT: ProductConfigInput = {
  name: "",
  url: "",
  target_price: 100,
  currency: "SEK",
};

// =============================================================
// Product Management
// =============================================================

export function ProductManagement() {

  const [products, setProducts] = useState<ProductConfig[]>([]);
  const [form, setForm] = useState<ProductConfigInput>(EMPTY_PRODUCT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);


  // =========================================================
  // Load Products
  // =========================================================

  async function loadProducts() {

    try {

      const data = await fetchProductConfigs();
      setProducts(data);

    } catch (error) {

      if (error instanceof Error) { setError(error.message); }

    } finally {

      setLoading(false);

    }
  }


  useEffect(() => {
    loadProducts();
  }, []);


  // =========================================================
  // Form Helpers
  // =========================================================

  function resetForm() {
    setForm(EMPTY_PRODUCT);
    setEditingId(null);
  }


  function startEdit(product: ProductConfig) {

    setForm({
      name: product.name,
      url: product.url,
      target_price: product.target_price,
      currency: product.currency,
    });

    setEditingId(product.id);
    setError(null);
    setSuccess(null);
  }


  // =========================================================
  // Save
  // =========================================================

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {

    event.preventDefault();

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {

      if (editingId) {
        await updateProductConfig(editingId, form);
        setSuccess("Product updated.");
      } else {
        await createProductConfig(form);
        setSuccess("Product added.");
      }

      resetForm();
      await loadProducts();

    } catch (error) {

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to save product.");
      }

    } finally {

      setSaving(false);

    }
  }


  // =========================================================
  // Delete
  // =========================================================

  async function handleDelete(product: ProductConfig) {

    const confirmed = window.confirm(`Delete "${product.name}"?`);

    if (!confirmed) { return; }

    setError(null);
    setSuccess(null);

    try {

      await deleteProductConfig(product.id);
      setSuccess("Product deleted.");

      if (editingId === product.id) { resetForm(); }

      await loadProducts();

    } catch (error) {

      if (error instanceof Error) { setError(error.message); }

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
          Manage the products monitored by Price Watch.
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

        <div>
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
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Product name"
            className="app-input mt-2"
          />
        </div>


        {/* URL */}

        <div className="md:col-span-2">
          <label
            htmlFor="product-url"
            className="app-body font-medium"
          >
            Product URL
          </label>

          <input
            id="product-url"
            type="url"
            required
            value={form.url}
            onChange={(event) => setForm({ ...form, url: event.target.value })}
            placeholder="https://example.com/product"
            className="app-input mt-2"
          />
        </div>


        {/* Target */}
        <div>
          <label
            htmlFor="target-price"
            className="app-body font-medium"
          >
            Target Price
          </label>

          <input
            id="target-price"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={form.target_price}
            onChange={(event) => setForm({ ...form, target_price: Number(event.target.value) })}
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
            value={form.currency}
            onChange={(event) => setForm({ ...form, currency: event.target.value })}
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


        {/* Actions */}

        <div className="flex flex-wrap gap-3 md:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="app-btn app-btn-primary px-5 py-2.5 text-sm"
          >
            {saving ? "Saving..." : editingId ? "Update Product" : "Add Product"}
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
          Product Configuration List
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

            <p className="app-muted mt-1">
              Add your first product above.
            </p>
          </div>

        ) : (

          <div className="divide-y divide-app-border">

            {products.map((product) => (

              <div
                key={product.id}
                className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >

                <div className="min-w-0">
                  <p className="font-medium text-app-text">
                    {product.name}
                  </p>

                  <p className="app-body mt-1">
                    Target:{" "}
                    {product.target_price.toFixed(2)}{" "}
                    {product.currency}
                  </p>

                  <p className="app-muted mt-1 truncate">
                    {product.url}
                  </p>
                </div>


                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(product)}
                    className="app-btn app-btn-secondary px-3 py-2 text-sm"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(product)}
                    className="app-btn app-btn-danger px-3 py-2 text-sm"
                  >
                    Delete
                  </button>
                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </section>
  );
}