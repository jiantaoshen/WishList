import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  createProductConfig,
  deleteProductConfig,
  fetchProductConfigs,
  updateProductConfig,
} from "@/services/productConfigApi";

import {
  useProductForm,
} from "@/hooks/useProductForm";

import type {
  ProductConfig,
} from "@/services/productConfigApi";


export function useProductManagement() {
  const form =
    useProductForm();

  const [
    products,
    setProducts,
  ] = useState<ProductConfig[]>([]);

  const [
    editingId,
    setEditingId,
  ] = useState<string | null>(null);

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);

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
  ] = useState<string | null>(null);


  const load =
    useCallback(async () => {
      setLoading(true);
      setError(null);

      try {
        setProducts(
          await fetchProductConfigs(),
        );
      }
      catch (exception) {
        setError(
          getErrorMessage(
            exception,
            "Could not load products.",
          ),
        );
      }
      finally {
        setLoading(false);
      }
    }, []);


  useEffect(() => {
    void load();
  }, [load]);


  function add() {
    form.reset();
    setEditingId(null);
    setError(null);
    setFormOpen(true);
  }


  function edit(
    product: ProductConfig,
  ) {
    form.loadProduct(product);
    setEditingId(product.id);
    setError(null);
    setFormOpen(true);
  }


  function cancel() {
    form.reset();
    setEditingId(null);
    setError(null);
    setFormOpen(false);
  }


  async function save() {
    if (saving) return;

    setSaving(true);
    setError(null);

    try {
      const input =
        form.buildInput();

      if (editingId) {
        await updateProductConfig(
          editingId,
          input,
        );
      }
      else {
        await createProductConfig(
          input,
        );
      }

      cancel();

      await load();
    }
    catch (exception) {
      setError(
        getErrorMessage(
          exception,
          "Could not save product.",
        ),
      );
    }
    finally {
      setSaving(false);
    }
  }


  async function remove(
    product: ProductConfig,
  ) {
    if (
      !window.confirm(
        `Delete "${product.name}"?`,
      )
    ) {
      return;
    }

    setError(null);

    try {
      await deleteProductConfig(
        product.id,
      );

      if (
        editingId === product.id
      ) {
        cancel();
      }

      await load();
    }
    catch (exception) {
      setError(
        getErrorMessage(
          exception,
          "Could not delete product.",
        ),
      );
    }
  }


  return {
    products,
    editingId,
    formOpen,
    loading,
    saving,
    error,

    form,

    load,
    add,
    edit,
    cancel,
    save,
    remove,
  };
}


function getErrorMessage(
  exception: unknown,
  fallback: string,
) {
  return exception instanceof Error
    ? exception.message
    : fallback;
}