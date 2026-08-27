import { useEffect, useState } from "react";

import {
  deleteSchedule,
  fetchSchedule,
  saveSchedule,
} from "../services/scheduleApi";


const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];


// =============================================================
// Automation Settings
// =============================================================

export function AutomationSettings() {

  const [enabled, setEnabled] = useState(false);
  const [day, setDay] = useState("Monday");
  const [time, setTime] = useState("08:00");
  const [runIfMissed, setRunIfMissed] = useState(true);
  const [taskExists, setTaskExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);


  // =========================================================
  // Load Existing Schedule
  // =========================================================

  useEffect(() => {

    async function loadSchedule() {

      try {

        const schedule = await fetchSchedule();

        setEnabled(schedule.enabled);
        setDay(schedule.day);
        setTime(schedule.time);
        setRunIfMissed(schedule.runIfMissed);
        setTaskExists(schedule.taskExists);

      } catch (error) {

        if (error instanceof Error) { setError(error.message); }

      } finally {

        setLoading(false);

      }
    }


    loadSchedule();

  }, []);


  // =========================================================
  // Save
  // =========================================================

  async function handleSave() {

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {

      const schedule = await saveSchedule({
        enabled,
        day,
        time,
        runIfMissed,
      });

      setEnabled(schedule.enabled);
      setDay(schedule.day);
      setTime(schedule.time);
      setRunIfMissed(schedule.runIfMissed);
      setTaskExists(schedule.taskExists);
      setSuccess("Schedule saved successfully.");

    } catch (error) {

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to save schedule.");
      }

    } finally {

      setSaving(false);

    }
  }


  // =========================================================
  // Delete
  // =========================================================

  async function handleDelete() {

    const confirmed = window.confirm("Delete the Price Watch scheduled task?");

    if (!confirmed) { return; }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {

      await deleteSchedule();

      setEnabled(false);
      setTaskExists(false);
      setSuccess("Schedule deleted.");

    } catch (error) {

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to delete schedule.");
      }

    } finally {

      setSaving(false);

    }
  }


  // =========================================================
  // Loading
  // =========================================================

  if (loading) {
    return (
      <div className="app-card p-6">
        <p className="app-body">
          Loading automation settings...
        </p>
      </div>
    );
  }


  // =========================================================
  // UI
  // =========================================================

  return (
    <section className="app-card p-6">

      {/* Header */}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h2 className="app-page-title">
            Automation
          </h2>

          <p className="app-body mt-1">
            Manage the Windows scheduled price check.
          </p>
        </div>


        <span className={`app-card-tag px-3 py-1 ${enabled && taskExists ? "status-success" : "status-unknown"}`}>
          {enabled && taskExists ? "Active" : taskExists ? "Disabled" : "Not configured"}
        </span>

      </div>


      {/* Settings */}

      <div className="mt-6 grid gap-5 md:grid-cols-2">

        {/* Enabled */}

        <label className="app-card-dashed flex items-center justify-between gap-4 px-4 py-3">

          <div>
            <p className="text-sm font-medium text-app-text">
              Enable automatic checks
            </p>

            <p className="app-muted mt-1">
              Run Price Watch automatically.
            </p>
          </div>

          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            className="h-5 w-5"
          />

        </label>


        {/* Run If Missed */}

        <label className="app-card-dashed flex items-center justify-between gap-4 px-4 py-3">

          <div>
            <p className="text-sm font-medium text-app-text">
              Run if missed
            </p>

            <p className="app-muted mt-1">
              Run when Windows becomes available again.
            </p>
          </div>

          <input
            type="checkbox"
            checked={runIfMissed}
            onChange={(event) => setRunIfMissed(event.target.checked)}
            className="h-5 w-5"
          />

        </label>


        {/* Day */}

        <div>

          <label
            htmlFor="schedule-day"
            className="app-body font-medium"
          >
            Day
          </label>

          <select
            id="schedule-day"
            value={day}
            onChange={(event) => setDay(event.target.value)}
            className="app-select mt-2 w-full"
          >
            {DAYS.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>

        </div>


        {/* Time */}

        <div>

          <label
            htmlFor="schedule-time"
            className="app-body font-medium"
          >
            Time
          </label>

          <input
            id="schedule-time"
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className="app-input mt-2"
          />

        </div>

      </div>


      {/* Messages */}

      {error && (
        <div className="status-danger mt-5 rounded-xl border px-4 py-3">
          <p className="text-sm">
            {error}
          </p>
        </div>
      )}

      {success && (
        <div className="status-success mt-5 rounded-xl border px-4 py-3">
          <p className="text-sm">
            {success}
          </p>
        </div>
      )}


      {/* Actions */}

      <div className="mt-6 flex flex-wrap gap-3">

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="app-btn app-btn-primary px-5 py-2.5 text-sm"
        >
          {saving ? "Saving..." : "Save Schedule"}
        </button>


        {taskExists && (
          <button
            type="button"
            disabled={saving}
            onClick={handleDelete}
            className="app-btn app-btn-danger px-5 py-2.5 text-sm"
          >
            Delete Schedule
          </button>
        )}

      </div>

    </section>
  );
}
