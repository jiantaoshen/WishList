import {
  ArrowLeft,
  Plus,
  RefreshCw,
  Store,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import {
  ProductForm,
} from "@/components/products/ProductForm";

import {
  ProductManagementList,
} from "@/components/products/ProductManagementList";

import {
  useProductManagement,
} from "@/hooks/useProductManagement";


export function ProductManagement({
  onBack,
}: {
  onBack?: () => void;
}) {
  const manager =
    useProductManagement();


  if (manager.formOpen) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={
            manager.editingId
              ? "Edit product"
              : "Add product"
          }
          description="Configure product tracking and store sources."
          onBack={
            manager.cancel
          }
        />

        <ProductForm
          form={manager.form.form}
          editing={
            manager.editingId !== null
          }
          saving={
            manager.saving
          }
          error={
            manager.error
          }
          onFieldChange={
            manager.form.setField
          }
          onSourceChange={
            manager.form.updateSource
          }
          onAddSource={
            manager.form.addSource
          }
          onRemoveSource={
            manager.form.removeSource
          }
          onSubmit={
            manager.save
          }
          onCancel={
            manager.cancel
          }
        />
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <PageHeader
        title="Manage products"
        description="Manage products, targets and store sources."
        onBack={onBack}
      />


      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {manager.products.length} products
        </p>

        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={
              manager.loading
            }
            onClick={() => {
              void manager.load();
            }}
          >
            <RefreshCw
              className={
                manager.loading
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={
              manager.add
            }
          >
            <Plus />
            Add product
          </Button>
        </div>
      </div>


      {manager.error && (
        <p className="text-sm text-destructive">
          {manager.error}
        </p>
      )}


      {manager.loading ? (
        <Loading />
      ) : manager.products.length ? (
        <ProductManagementList
          products={
            manager.products
          }
          onEdit={
            manager.edit
          }
          onDelete={product => {
            void manager.remove(
              product,
            );
          }}
        />
      ) : (
        <Empty
          onAdd={
            manager.add
          }
        />
      )}
    </div>
  );
}


function PageHeader({
  title,
  description,
  onBack,
}: {
  title: string;
  description: string;
  onBack?: () => void;
}) {
  return (
    <div className="space-y-3">
      {onBack && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onBack}
          className="-ml-2"
        >
          <ArrowLeft />
          Back
        </Button>
      )}

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {title}
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}


function Loading() {
  return (
    <Card>
      <CardContent className="py-10 text-center text-sm text-muted-foreground">
        Loading products...
      </CardContent>
    </Card>
  );
}


function Empty({
  onAdd,
}: {
  onAdd: () => void;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <Store className="mx-auto size-5 text-muted-foreground" />

        <p className="mt-3 font-medium">
          No products configured
        </p>

        <Button
          type="button"
          size="sm"
          className="mt-4"
          onClick={onAdd}
        >
          <Plus />
          Add product
        </Button>
      </CardContent>
    </Card>
  );
}