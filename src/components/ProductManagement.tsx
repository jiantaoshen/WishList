import {
  useEffect,
  useState,
} from "react";

import {
  createProductConfig,
  deleteProductConfig,
  fetchProductConfigs,
  updateProductConfig,
} from "../services/productConfigApi";

import type {
  ProductConfig,
} from "../services/productConfigApi";


const EMPTY_PRODUCT: ProductConfig = {
  id: "",
  name: "",
  url: "",
  target_price: 100,
  currency: "SEK",
};


export function ProductManagement() {

  const [
    products,
    setProducts,
  ] = useState<ProductConfig[]>([]);

  const [
    form,
    setForm,
  ] = useState<ProductConfig>(
    EMPTY_PRODUCT
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
  // Load products
  // =========================================================

  async function loadProducts() {

    try {

      const data =
        await fetchProductConfigs();

      setProducts(
        data
      );

    } catch (error) {

      if (error instanceof Error) {
        setError(
          error.message
        );
      }

    } finally {

      setLoading(false);
    }
  }


  useEffect(() => {

    loadProducts();

  }, []);


  // =========================================================
  // Form helpers
  // =========================================================

  function resetForm() {

    setForm(
      EMPTY_PRODUCT
    );

    setEditingId(
      null
    );
  }


  function startEdit(
    product: ProductConfig
  ) {

    setForm(
      product
    );

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
      React.FormEvent<HTMLFormElement>
  ) {

    event.preventDefault();

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {

      if (editingId) {

        await updateProductConfig(
          editingId,
          form
        );

        setSuccess(
          "Product updated."
        );

      } else {

        await createProductConfig(
          form
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
        editingId ===
        product.id
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
    <section
      className="
        rounded-2xl
        border
        bg-white
        p-6
      "
    >

      <div>

        <h2
          className="
            text-lg
            font-semibold
            text-gray-900
          "
        >
          Products
        </h2>

        <p
          className="
            mt-1
            text-sm
            text-gray-500
          "
        >
          Manage the products monitored by Price Watch.
        </p>

      </div>


      {/* =====================================================
          Form
      ===================================================== */}

      <form
        onSubmit={handleSubmit}
        className="
          mt-6
          grid
          gap-4
          md:grid-cols-2
        "
      >

        {/* ID */}

        <div>

          <label
            htmlFor="product-id"
            className="
              text-sm
              font-medium
              text-gray-700
            "
          >
            Product ID
          </label>

          <input
            id="product-id"
            type="text"
            required
            disabled={
              editingId !== null
            }
            value={form.id}
            onChange={(event) =>
              setForm({
                ...form,
                id:
                  event.target.value,
              })
            }
            placeholder="aco-cleanser"
            className="
              mt-2
              w-full
              rounded-xl
              border
              px-4
              py-3
              text-sm
              disabled:bg-gray-100
            "
          />

        </div>


        {/* Name */}

        <div>

          <label
            htmlFor="product-name"
            className="
              text-sm
              font-medium
              text-gray-700
            "
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
            className="
              mt-2
              w-full
              rounded-xl
              border
              px-4
              py-3
              text-sm
            "
          />

        </div>


        {/* URL */}

        <div className="md:col-span-2">

          <label
            htmlFor="product-url"
            className="
              text-sm
              font-medium
              text-gray-700
            "
          >
            Product URL
          </label>

          <input
            id="product-url"
            type="url"
            required
            value={form.url}
            onChange={(event) =>
              setForm({
                ...form,
                url:
                  event.target.value,
              })
            }
            placeholder="https://example.com/product"
            className="
              mt-2
              w-full
              rounded-xl
              border
              px-4
              py-3
              text-sm
            "
          />

        </div>


        {/* Target */}

        <div>

          <label
            htmlFor="target-price"
            className="
              text-sm
              font-medium
              text-gray-700
            "
          >
            Target Price
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
            className="
              mt-2
              w-full
              rounded-xl
              border
              px-4
              py-3
              text-sm
            "
          />

        </div>


        {/* Currency */}

        <div>

          <label
            htmlFor="currency"
            className="
              text-sm
              font-medium
              text-gray-700
            "
          >
            Currency
          </label>

          <select
            id="currency"
            value={form.currency}
            onChange={(event) =>
              setForm({
                ...form,
                currency:
                  event.target.value,
              })
            }
            className="
              mt-2
              w-full
              rounded-xl
              border
              bg-white
              px-4
              py-3
              text-sm
            "
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

        <div
          className="
            flex
            flex-wrap
            gap-3
            md:col-span-2
          "
        >

          <button
            type="submit"
            disabled={saving}
            className="
              rounded-xl
              bg-gray-900
              px-5
              py-2.5
              text-sm
              font-medium
              text-white
              disabled:bg-gray-300
            "
          >

            {saving
              ? "Saving..."
              : editingId
                ? "Update Product"
                : "Add Product"}

          </button>


          {editingId && (

            <button
              type="button"
              onClick={resetForm}
              className="
                rounded-xl
                border
                px-5
                py-2.5
                text-sm
                font-medium
                text-gray-600
              "
            >
              Cancel
            </button>

          )}

        </div>

      </form>


      {/* Messages */}

      {error && (

        <div
          className="
            mt-5
            rounded-xl
            bg-red-50
            px-4
            py-3
          "
        >

          <p
            className="
              text-sm
              text-red-600
            "
          >
            {error}
          </p>

        </div>

      )}


      {success && (

        <div
          className="
            mt-5
            rounded-xl
            bg-green-50
            px-4
            py-3
          "
        >

          <p
            className="
              text-sm
              text-green-700
            "
          >
            {success}
          </p>

        </div>

      )}


      {/* =====================================================
          Product configuration list
      ===================================================== */}

      <div className="mt-8">

        <div
          className="
            flex
            items-center
            justify-between
            border-b
            pb-3
          "
        >

          <h3
            className="
              font-medium
              text-gray-900
            "
          >
            Tracked Products
          </h3>

          <span
            className="
              text-xs
              text-gray-400
            "
          >
            {products.length} products
          </span>

        </div>


        {loading ? (

          <p
            className="
              py-6
              text-sm
              text-gray-500
            "
          >
            Loading products...
          </p>

        ) : products.length === 0 ? (

          <div
            className="
              py-10
              text-center
            "
          >

            <p
              className="
                font-medium
                text-gray-700
              "
            >
              No products configured
            </p>

            <p
              className="
                mt-1
                text-sm
                text-gray-400
              "
            >
              Add your first product above.
            </p>

          </div>

        ) : (

          <div className="divide-y">

            {products.map(
              (product) => (

                <div
                  key={product.id}
                  className="
                    flex
                    flex-col
                    gap-4
                    py-4
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >

                  <div className="min-w-0">

                    <p
                      className="
                        font-medium
                        text-gray-900
                      "
                    >
                      {product.name}
                    </p>

                    <p
                      className="
                        mt-1
                        text-sm
                        text-gray-500
                      "
                    >
                      Target:{" "}
                      {product.target_price.toFixed(
                        2
                      )}{" "}
                      {product.currency}
                    </p>

                    <p
                      className="
                        mt-1
                        truncate
                        text-xs
                        text-gray-400
                      "
                    >
                      {product.url}
                    </p>

                  </div>


                  <div
                    className="
                      flex
                      shrink-0
                      gap-2
                    "
                  >

                    <button
                      type="button"
                      onClick={() =>
                        startEdit(
                          product
                        )
                      }
                      className="
                        rounded-lg
                        border
                        px-3
                        py-2
                        text-sm
                        text-gray-600
                        hover:bg-gray-50
                      "
                    >
                      Edit
                    </button>


                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          product
                        )
                      }
                      className="
                        rounded-lg
                        border
                        border-red-200
                        px-3
                        py-2
                        text-sm
                        text-red-600
                        hover:bg-red-50
                      "
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