import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import type { Product } from "@/types/product";


interface ProductStatusBadgeProps {
  status: Product["status"];
}


export function ProductStatusBadge({ status }: ProductStatusBadgeProps) {
  if (status === "not_run") {
    return (
      <Badge variant="outline" className="shrink-0 text-muted-foreground">
        Not run yet
      </Badge>
    );
  }

  if (status === "failed") {
    return (
      <Badge variant="destructive" className="shrink-0">
        Failed
      </Badge>
    );
  }

  if (status === "suspicious") {
    return (
      <Badge variant="outline" className="shrink-0 gap-1">
        <AlertTriangle className="size-3" />
        Check price
      </Badge>
    );
  }

  return null;
}