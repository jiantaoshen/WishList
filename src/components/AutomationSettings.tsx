import {
  useEffect,
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Power,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  deleteSchedule,
  fetchSchedule,
  saveSchedule,
} from "@/services/scheduleApi";


// =============================================================
// Days
// =============================================================

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DAY_OPTIONS =
  DAYS.map(day => ({
    label: day,
    value: day,
  }));


// =============================================================
// Automation Settings
// =============================================================

export function AutomationSettings() {
  const [
    enabled,
    setEnabled,
  ] = useState(false);

  const [
    day,
    setDay,
  ] = useState("Monday");

  const [
    time,
    setTime,
  ] = useState("08:00");

  const [
    runIfMissed,
    setRunIfMissed,
  ] = useState(true);

  const [
    taskExists,
    setTaskExists,
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
  ] = useState<string | null>(
    null,
  );

  const [
    success,
    setSuccess,
  ] = useState<string | null>(
    null,
  );


  // =========================================================
  // Load
  // =========================================================

  useEffect(() => {
    async function loadSchedule() {
      try {
        const schedule =
          await fetchSchedule();

        setEnabled(
          schedule.enabled,
        );

        setDay(
          schedule.day,
        );

        setTime(
          schedule.time,
        );

        setRunIfMissed(
          schedule.runIfMissed,
        );

        setTaskExists(
          schedule.taskExists,
        );
      }
      catch (exception) {
        setError(
          getErrorMessage(
            exception,
            "Failed to load automation settings.",
          ),
        );
      }
      finally {
        setLoading(false);
      }
    }


    void loadSchedule();
  }, []);


  // =========================================================
  // Save
  // =========================================================

  async function handleSave() {
    if (saving) {
      return;
    }


    setSaving(true);
    setError(null);
    setSuccess(null);


    try {
      const schedule =
        await saveSchedule({
          enabled,
          day,
          time,
          runIfMissed,
        });


      setEnabled(
        schedule.enabled,
      );

      setDay(
        schedule.day,
      );

      setTime(
        schedule.time,
      );

      setRunIfMissed(
        schedule.runIfMissed,
      );

      setTaskExists(
        schedule.taskExists,
      );

      setSuccess(
        "Schedule saved successfully.",
      );
    }
    catch (exception) {
      setError(
        getErrorMessage(
          exception,
          "Failed to save schedule.",
        ),
      );
    }
    finally {
      setSaving(false);
    }
  }


  // =========================================================
  // Delete
  // =========================================================

  async function handleDelete() {
    const confirmed =
      window.confirm(
        "Delete the Price Watch scheduled task?",
      );


    if (!confirmed) {
      return;
    }


    setSaving(true);
    setError(null);
    setSuccess(null);


    try {
      await deleteSchedule();

      setEnabled(false);
      setTaskExists(false);

      setSuccess(
        "Schedule deleted.",
      );
    }
    catch (exception) {
      setError(
        getErrorMessage(
          exception,
          "Failed to delete schedule.",
        ),
      );
    }
    finally {
      setSaving(false);
    }
  }


  // =========================================================
  // Loading
  // =========================================================

  if (loading) {
    return (
      <Card>
        <CardContent
          className="
            flex items-center
            gap-3 p-6
          "
        >
          <RefreshCw
            className="
              size-4
              animate-spin
              text-muted-foreground
            "
          />

          <p
            className="
              text-sm
              text-muted-foreground
            "
          >
            Loading automation
            settings...
          </p>
        </CardContent>
      </Card>
    );
  }


  // =========================================================
  // UI
  // =========================================================

  return (
    <Card>
      {/* ===================================================
          Header
      =================================================== */}

      <CardHeader
        className="
          flex flex-col
          gap-4
          sm:flex-row
          sm:items-start
          sm:justify-between
        "
      >
        <div>
          <CardTitle className="text-xl">
            Automation
          </CardTitle>

          <CardDescription className="mt-1">
            Manage the Windows
            scheduled price check.
          </CardDescription>
        </div>


        <ScheduleStatus
          enabled={enabled}
          taskExists={taskExists}
        />
      </CardHeader>


      <CardContent className="space-y-6">
        {/* =================================================
            Toggles
        ================================================= */}

        <div
          className="
            grid gap-3
            md:grid-cols-2
          "
        >
          <ToggleCard
            icon={Power}
            title="Automatic checks"
            description="Run Price Watch automatically."
            checked={enabled}
            disabled={saving}
            onChange={setEnabled}
          />


          <ToggleCard
            icon={RefreshCw}
            title="Run if missed"
            description="Run when Windows becomes available again."
            checked={runIfMissed}
            disabled={saving}
            onChange={
              setRunIfMissed
            }
          />
        </div>


        {/* =================================================
            Schedule
        ================================================= */}

        <div
          className="
            rounded-xl
            border
            p-5
          "
        >
          <div className="mb-5">
            <h3 className="font-medium">
              Schedule
            </h3>

            <p
              className="
                mt-1 text-sm
                text-muted-foreground
              "
            >
              Choose when the weekly
              price check should run.
            </p>
          </div>


          <div
            className="
              grid gap-4
              md:grid-cols-2
            "
          >
            {/* Day */}

            <div className="space-y-2">
              <Label
                htmlFor="schedule-day"
              >
                <CalendarDays className="size-4" />

                Day
              </Label>


              <Select
                items={DAY_OPTIONS}
                value={day}
                onValueChange={value => {
                  if (value) {
                    setDay(value);
                  }
                }}
              >
                <SelectTrigger
                  id="schedule-day"
                  className="w-full"
                  disabled={saving}
                >
                  <SelectValue
                    placeholder="Select day"
                  />
                </SelectTrigger>


                <SelectContent>
                  <SelectGroup>
                    {DAY_OPTIONS.map(
                      option => (
                        <SelectItem
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </SelectItem>
                      ),
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>


            {/* Time */}

            <div className="space-y-2">
              <Label
                htmlFor="schedule-time"
              >
                <Clock3 className="size-4" />

                Time
              </Label>


              <Input
                id="schedule-time"
                type="time"
                value={time}
                disabled={saving}
                onChange={event =>
                  setTime(
                    event.target.value,
                  )
                }
              />
            </div>
          </div>
        </div>


        {/* =================================================
            Messages
        ================================================= */}

        {error && (
          <div
            className="
              rounded-lg
              border
              border-destructive/30
              bg-destructive/5
              px-4 py-3
              text-sm
              text-destructive
            "
          >
            {error}
          </div>
        )}


        {success && (
          <div
            className="
              flex items-start
              gap-2
              rounded-lg
              border
              bg-muted/40
              px-4 py-3
              text-sm
            "
          >
            <CheckCircle2
              className="
                mt-0.5
                size-4
                shrink-0
              "
            />

            <span>
              {success}
            </span>
          </div>
        )}


        {/* =================================================
            Actions
        ================================================= */}

        <div
          className="
            flex flex-wrap
            gap-2
            border-t
            pt-5
          "
        >
          <Button
            type="button"
            disabled={saving}
            onClick={() => {
              void handleSave();
            }}
          >
            <Save />

            {saving
              ? "Saving..."
              : "Save schedule"}
          </Button>


          {taskExists && (
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => {
                void handleDelete();
              }}
              className="
                text-destructive
                hover:text-destructive
              "
            >
              <Trash2 />

              Delete schedule
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


// =============================================================
// Status
// =============================================================

function ScheduleStatus({
  enabled,
  taskExists,
}: {
  enabled: boolean;
  taskExists: boolean;
}) {
  if (
    enabled &&
    taskExists
  ) {
    return (
      <Badge>
        Active
      </Badge>
    );
  }


  if (taskExists) {
    return (
      <Badge variant="secondary">
        Disabled
      </Badge>
    );
  }


  return (
    <Badge variant="outline">
      Not configured
    </Badge>
  );
}


// =============================================================
// Toggle Card
// =============================================================

function ToggleCard({
  icon: Icon,
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  icon:
    typeof Power;

  title: string;
  description: string;

  checked: boolean;
  disabled: boolean;

  onChange:
    (checked: boolean) => void;
}) {
  return (
    <label
      className="
        flex cursor-pointer
        items-center
        justify-between
        gap-4
        rounded-xl
        border
        p-4
        transition-colors
        hover:bg-muted/40
        has-disabled:cursor-not-allowed
        has-disabled:opacity-60
      "
    >
      <div
        className="
          flex min-w-0
          items-start gap-3
        "
      >
        <div
          className="
            flex size-9
            shrink-0
            items-center
            justify-center
            rounded-lg
            border
            bg-muted/40
          "
        >
          <Icon
            className="
              size-4
              text-muted-foreground
            "
          />
        </div>


        <div className="min-w-0">
          <p
            className="
              text-sm
              font-medium
            "
          >
            {title}
          </p>

          <p
            className="
              mt-1 text-xs
              text-muted-foreground
            "
          >
            {description}
          </p>
        </div>
      </div>


      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={event =>
          onChange(
            event.target.checked,
          )
        }
        className="
          size-4
          shrink-0
          accent-primary
        "
      />
    </label>
  );
}


// =============================================================
// Error
// =============================================================

function getErrorMessage(
  exception: unknown,
  fallback: string,
): string {
  if (
    exception instanceof Error &&
    exception.message
  ) {
    return exception.message;
  }

  return fallback;
}