import {
  Button,
} from "@/components/ui/button";


interface ProductPaginationProps {

  page: number;

  totalPages: number;

  onPageChange:
    (page: number) => void;
}


// =============================================================
// Product Pagination
// =============================================================

export function ProductPagination({
  page,
  totalPages,
  onPageChange,
}: ProductPaginationProps) {

  if (totalPages <= 1) {
    return null;
  }


  return (

    <div className="flex items-center justify-center gap-3">

      <Button
        type="button"
        variant="outline"
        size="sm"

        disabled={
          page <= 1
        }

        onClick={() =>
          onPageChange(
            page - 1
          )
        }
      >
        Previous
      </Button>


      <span className="text-sm text-muted-foreground">

        Page{" "}

        <span className="font-medium text-foreground">
          {page}
        </span>

        {" "}of{" "}

        <span className="font-medium text-foreground">
          {totalPages}
        </span>

      </span>


      <Button
        type="button"
        variant="outline"
        size="sm"

        disabled={
          page >= totalPages
        }

        onClick={() =>
          onPageChange(
            page + 1
          )
        }
      >
        Next
      </Button>

    </div>
  );
}