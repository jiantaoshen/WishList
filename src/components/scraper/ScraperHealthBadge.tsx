import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";

import {
  Badge,
} from "@/components/ui/badge";

import type {
  RunHealthInfo,
} from "@/utils/runHealth";


export function ScraperHealthBadge({
  health,
}: {
  health: RunHealthInfo;
}) {
  switch (health.state) {
    case "healthy":
      return (
        <Badge variant="secondary">
          <CheckCircle2 />
          {health.label}
        </Badge>
      );

    case "warning":
      return (
        <Badge variant="outline">
          <AlertTriangle />
          {health.label}
        </Badge>
      );

    case "stale":
      return (
        <Badge variant="outline">
          <Clock3 />
          {health.label}
        </Badge>
      );

    case "failed":
      return (
        <Badge variant="destructive">
          <XCircle />
          {health.label}
        </Badge>
      );

    default:
      return (
        <Badge variant="outline">
          {health.label}
        </Badge>
      );
  }
}