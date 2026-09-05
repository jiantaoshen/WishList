import {
  useState,
} from "react";

import {
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  createProductConfig,
} from "@/services/productConfigApi";

import type {
  ProductConfig,
} from "@/services/productConfigApi";


interface AddProductDialogProps {
  onCreated?: (
    product: ProductConfig,
  ) =>
    void |
    Promise<void>;
}


export function AddProductDialog({
  onCreated,
}: AddProductDialogProps) {
  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    isSaving,
    setIsSaving,
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

    setField,

    addSource,
    removeSource,
    updateSource,

    buildInput,
  } = useProductForm();


  function handleOpen() {
    reset();

    setError(
      null,
    );

    setOpen(
      true,
    );
  }


  function handleCancel() {
    if (isSaving) {
      return;
    }

    setOpen(
      false,
    );

    setError(
      null,
    );

    reset();
  }


  async function handleSubmit() {
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


      const product =
        await createProductConfig(
          input,
        );


      await onCreated?.(
        product,
      );


      setOpen(
        false,
      );

      reset();
    }
    catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create product.",
      );
    }
    finally {
      setIsSaving(
        false,
      );
    }
  }


  return (
    <>
      <Button
        type="button"
        onClick={handleOpen}
      >
        <Plus data-icon="inline-start" />

        Add product
      </Button>


      <Dialog
        open={open}
        onOpenChange={
          nextOpen => {
            if (
              !nextOpen &&
              isSaving
            ) {
              return;
            }

            setOpen(
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Add product
            </DialogTitle>

            <DialogDescription>
              Add a product, configure
              its comparison quantity,
              targets and store sources.
            </DialogDescription>
          </DialogHeader>


          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}


          <ProductForm
            form={form}

            isEditing={false}

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
              handleSubmit
            }

            onCancel={
              handleCancel
            }
          />
        </DialogContent>
      </Dialog>
    </>
  );
}