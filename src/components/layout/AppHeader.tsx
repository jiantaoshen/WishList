import {
  Activity,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  RunNowButton,
} from "@/components/RunNowButton";

import {
  getRunHealth,
} from "@/utils/runHealth";

import type {
  AppView,
} from "@/types/app";

import type {
  RunMetadata,
} from "@/types/run";


interface AppHeaderProps {
  view: AppView;

  generatedAt: string;

  latestRun:
    RunMetadata | null;

  onNavigate:
    (view: AppView) => void;

  onRefresh:
    () => void | Promise<void>;
}


export function AppHeader({
  view,
  generatedAt,
  latestRun,
  onNavigate,
  onRefresh,
}: AppHeaderProps) {
  const health =
    getRunHealth(latestRun);


  return (
    <header
      className="
        sticky top-0 z-40
        border-b
        bg-background/95
        backdrop-blur
      "
    >
      <div
        className="
          mx-auto flex
          min-h-14
          max-w-6xl
          flex-wrap
          items-center
          gap-3
          px-5 py-2
          sm:px-6
        "
      >
        <button
          type="button"
          className="
            font-semibold
            tracking-tight
          "
          onClick={() =>
            onNavigate(
              "dashboard",
            )
          }
        >
          PriceWatch
        </button>


        <div className="hidden h-5 w-px bg-border sm:block" />


        <nav className="flex gap-1">
          <NavButton
            active={
              view === "dashboard"
            }
            onClick={() =>
              onNavigate(
                "dashboard",
              )
            }
          >
            Dashboard
          </NavButton>

          <NavButton
            active={
              view === "automation"
            }
            onClick={() =>
              onNavigate(
                "automation",
              )
            }
          >
            Automation
          </NavButton>

          <NavButton
            active={
              view === "email"
            }
            onClick={() =>
              onNavigate("email")
            }
          >
            Email
          </NavButton>
        </nav>


        <div
          className="
            ml-auto
            flex items-center
            gap-2
          "
        >
          <span
            className="
              hidden text-xs
              text-muted-foreground
              xl:block
            "
          >
            {formatUpdated(
              generatedAt,
            )}
          </span>


          <RunNowButton
            onCompleted={
              onRefresh
            }
          />


          <Button
            type="button"
            size="sm"
            variant={
              view === "scraper"
                ? "secondary"
                : "outline"
            }
            onClick={() =>
              onNavigate(
                "scraper",
              )
            }
          >
            <span
              className={`
                size-2
                rounded-full
                ${healthDot(
                  health.state,
                )}
              `}
            />

            <span className="hidden lg:inline">
              {health.label}
            </span>

            <Activity className="lg:hidden" />
          </Button>
        </div>
      </div>
    </header>
  );
}


function NavButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={
        active
          ? "secondary"
          : "ghost"
      }
      onClick={onClick}
    >
      {children}
    </Button>
  );
}


function healthDot(
  state: ReturnType<
    typeof getRunHealth
  >["state"],
) {
  switch (state) {
    case "healthy":
      return "bg-emerald-500";

    case "warning":
      return "bg-amber-500";

    case "stale":
      return "bg-orange-500";

    case "failed":
      return "bg-destructive";

    default:
      return "bg-muted-foreground";
  }
}


function formatUpdated(
  value: string,
) {
  if (!value) {
    return "Never";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Unknown";
  }

  return date.toLocaleString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
  );
}