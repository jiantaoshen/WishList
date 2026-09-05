import {
  useState,
} from "react";

import {
  Pencil,
  Trash2,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  ProductForm,
} from "@/components/products/ProductForm";

import {
  useProductForm,
} from "@/hooks/useProductForm";

import {
  deleteProductConfig,
  fetchProductConfigs,
  updateProductConfig,
} from "@/services/productConfigApi";


// =============================================================
// Props
// =============================================================

interface ProductDetailActionsProps {
  productId: string;

  productName: string;

  onUpdated?:
    () => void | Promise<void>;

  onDeleted?:
    () => void | Promise<void>;
}


// =============================================================
// Product Detail Actions
// =============================================================

export function ProductDetailActions({
  productId,
  productName,
  onUpdated,
  onDeleted,
}: ProductDetailActionsProps) {
  const [
    editOpen,
    setEditOpen,
  ] = useState(false);

  const [
    deleteOpen,
    setDeleteOpen,
  ] = useState(false);

  const [
    loadingConfig,
    setLoadingConfig,
  ] = useState(false);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );


  const {
    form,

    reset,
    loadProduct,

    setField,

    addSource,
    removeSource,
    updateSource,

    buildInput,
  } = useProductForm();


  // ===========================================================
  // Open Edit
  // ===========================================================

  async function handleOpenEdit() {
    if (
      loadingConfig ||
      isSaving
    ) {
      return;
    }


    try {
      setError(
        null,
      );

      setLoadingConfig(
        true,
      );


      const products =
        await fetchProductConfigs();


      const config =
        products.find(
          product =>
            product.id ===
            productId,
        );


      if (!config) {
        throw new Error(
          "Product configuration not found.",
        );
      }


      loadProduct(
        config,
      );


      setEditOpen(
        true,
      );
    }
    catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load product.",
      );
    }
    finally {
      setLoadingConfig(
        false,
      );
    }
  }


  // ===========================================================
  // Save Edit
  // ===========================================================

  async function handleSave() {
    if (isSaving) {
      return;
    }


    try {
      setError(
        null,
      );


      const input =
        buildInput();


      setIsSaving(
        true,
      );


      await updateProductConfig(
        productId,
        input,
      );


      await onUpdated?.();


      setEditOpen(
        false,
      );

      reset();
    }
    catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update product.",
      );
    }
    finally {
      setIsSaving(
        false,
      );
    }
  }


  // ===========================================================
  // Close Edit
  // ===========================================================

  function handleCloseEdit() {
    if (isSaving) {
      return;
    }


    setEditOpen(
      false,
    );

    setError(
      null,
    );

    reset();
  }


  // ===========================================================
  // Delete
  // ===========================================================

  async function handleDelete() {
    if (isDeleting) {
      return;
    }


    try {
      setError(
        null,
      );

      setIsDeleting(
        true,
      );


      await deleteProductConfig(
        productId,
      );


      await onDeleted?.();


      setDeleteOpen(
        false,
      );
    }
    catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete product.",
      );
    }
    finally {
      setIsDeleting(
        false,
      );
    }
  }


  // ===========================================================
  // Render
  // ===========================================================

  return (
    <>
      {/* =====================================================
          Buttons
      ===================================================== */}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={
            loadingConfig
          }
          onClick={() => {
            void handleOpenEdit();
          }}
        >
          <Pencil data-icon="inline-start" />

          {loadingConfig
            ? "Loading..."
            : "Edit"}
        </Button>


        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            setError(
              null,
            );

            setDeleteOpen(
              true,
            );
          }}
        >
          <Trash2 data-icon="inline-start" />

          Delete
        </Button>
      </div>


      {/* =====================================================
          Edit Dialog
      ===================================================== */}

      <Dialog
        open={editOpen}
        onOpenChange={
          nextOpen => {
            if (
              !nextOpen &&
              isSaving
            ) {
              return;
            }


            setEditOpen(
              nextOpen,
            );


            if (!nextOpen) {
              setError(
                null,
              );

              reset();
            }
          }
        }
      >
        <DialogContent
          className="
            max-h-[90vh]
            overflow-y-auto
            sm:max-w-4xl
          "
        >
          <DialogHeader>
            <DialogTitle>
              Edit product
            </DialogTitle>

            <DialogDescription>
              Update product settings,
              comparison quantity,
              targets and stores.
            </DialogDescription>
          </DialogHeader>


          {error && (
            <div
              className="
                rounded-md
                border
                border-destructive/40
                bg-destructive/5
                px-4 py-3
                text-sm
                text-destructive
              "
            >
              {error}
            </div>
          )}


          <ProductForm
            form={
              form
            }

            isEditing

            isSaving={
              isSaving
            }

            onFieldChange={
              setField
            }

            onSourceChange={
              updateSource
            }

            onAddSource={
              addSource
            }

            onRemoveSource={
              removeSource
            }

            onSubmit={
              handleSave
            }

            onCancel={
              handleCloseEdit
            }
          />
        </DialogContent>
      </Dialog>


      {/* =====================================================
          Delete Dialog
      ===================================================== */}

      <Dialog
        open={
          deleteOpen
        }

        onOpenChange={
          nextOpen => {
            if (
              !nextOpen &&
              isDeleting
            ) {
              return;
            }


            setDeleteOpen(
              nextOpen,
            );


            if (!nextOpen) {
              setError(
                null,
              );
            }
          }
        }
      >
        <DialogContent
          className="sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>
              Delete product?
            </DialogTitle>

            <DialogDescription>
              This will remove{" "}
              <span className="font-medium text-foreground">
                {productName}
              </span>{" "}
              from your product
              configuration.
            </DialogDescription>
          </DialogHeader>


          {error && (
            <div
              className="
                rounded-md
                border
                border-destructive/40
                bg-destructive/5
                px-4 py-3
                text-sm
                text-destructive
              "
            >
              {error}
            </div>
          )}


          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={
                isDeleting
              }
              onClick={() => {
                setDeleteOpen(
                  false,
                );
              }}
            >
              Cancel
            </Button>


            <Button
              type="button"
              variant="destructive"
              disabled={
                isDeleting
              }
              onClick={() => {
                void handleDelete();
              }}
            >
              <Trash2 data-icon="inline-start" />

              {isDeleting
                ? "Deleting..."
                : "Delete product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}