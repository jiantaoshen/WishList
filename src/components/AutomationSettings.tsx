import {
  useEffect,
  useState,
} from "react";

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
    null
  );

  const [
    success,
    setSuccess,
  ] = useState<string | null>(
    null
  );


  // =========================================================
  // Load existing schedule
  // =========================================================

  useEffect(() => {

    async function loadSchedule() {

      try {

        const schedule =
          await fetchSchedule();

        setEnabled(
          schedule.enabled
        );

        setDay(
          schedule.day
        );

        setTime(
          schedule.time
        );

        setRunIfMissed(
          schedule.runIfMissed
        );

        setTaskExists(
          schedule.taskExists
        );

      } catch (error) {

        if (
          error instanceof Error
        ) {
          setError(
            error.message
          );
        }

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

      const schedule =
        await saveSchedule({
          enabled,
          day,
          time,
          runIfMissed,
        });

      setEnabled(
        schedule.enabled
      );

      setDay(
        schedule.day
      );

      setTime(
        schedule.time
      );

      setRunIfMissed(
        schedule.runIfMissed
      );

      setTaskExists(
        schedule.taskExists
      );

      setSuccess(
        "Schedule saved successfully."
      );

    } catch (error) {

      if (
        error instanceof Error
      ) {
        setError(
          error.message
        );
      } else {
        setError(
          "Failed to save schedule."
        );
      }

    } finally {

      setSaving(false);
    }
  }


  // =========================================================
  // Delete
  // =========================================================

  async function handleDelete() {

    const confirmed =
      window.confirm(
        "Delete the Price Watch scheduled task?"
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
        "Schedule deleted."
      );

    } catch (error) {

      if (
        error instanceof Error
      ) {
        setError(
          error.message
        );
      } else {
        setError(
          "Failed to delete schedule."
        );
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
      <div
        className="
          rounded-2xl
          border
          bg-white
          p-6
        "
      >
        <p className="text-sm text-gray-500">
          Loading automation settings...
        </p>
      </div>
    );
  }


  // =========================================================
  // UI
  // =========================================================

  return (
    <section
      className="
        rounded-2xl
        border
        bg-white
        p-6
      "
    >

      <div
        className="
          flex
          flex-col
          gap-2
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >

        <div>

          <h2
            className="
              text-lg
              font-semibold
              text-gray-900
            "
          >
            Automation
          </h2>

          <p
            className="
              mt-1
              text-sm
              text-gray-500
            "
          >
            Manage the Windows scheduled price check.
          </p>

        </div>


        <span
          className={`
            inline-flex
            w-fit
            rounded-full
            px-3
            py-1
            text-xs
            font-medium
            ${
              enabled &&
              taskExists
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }
          `}
        >

          {enabled &&
          taskExists
            ? "Active"
            : taskExists
              ? "Disabled"
              : "Not configured"}

        </span>

      </div>


      <div
        className="
          mt-6
          grid
          gap-5
          md:grid-cols-2
        "
      >

        {/* Enabled */}

        <label
          className="
            flex
            items-center
            justify-between
            gap-4
            rounded-xl
            border
            px-4
            py-3
          "
        >

          <div>

            <p
              className="
                text-sm
                font-medium
                text-gray-900
              "
            >
              Enable automatic checks
            </p>

            <p
              className="
                mt-1
                text-xs
                text-gray-500
              "
            >
              Run Price Watch automatically.
            </p>

          </div>


          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) =>
              setEnabled(
                event.target.checked
              )
            }
            className="h-5 w-5"
          />

        </label>


        {/* Run if missed */}

        <label
          className="
            flex
            items-center
            justify-between
            gap-4
            rounded-xl
            border
            px-4
            py-3
          "
        >

          <div>

            <p
              className="
                text-sm
                font-medium
                text-gray-900
              "
            >
              Run if missed
            </p>

            <p
              className="
                mt-1
                text-xs
                text-gray-500
              "
            >
              Run when Windows becomes available again.
            </p>

          </div>


          <input
            type="checkbox"
            checked={runIfMissed}
            onChange={(event) =>
              setRunIfMissed(
                event.target.checked
              )
            }
            className="h-5 w-5"
          />

        </label>


        {/* Day */}

        <div>

          <label
            htmlFor="schedule-day"
            className="
              text-sm
              font-medium
              text-gray-700
            "
          >
            Day
          </label>

          <select
            id="schedule-day"
            value={day}
            onChange={(event) =>
              setDay(
                event.target.value
              )
            }
            className="
              mt-2
              w-full
              rounded-xl
              border
              border-gray-200
              bg-white
              px-4
              py-3
              text-sm
              outline-none
              focus:border-gray-400
            "
          >

            {DAYS.map(
              (item) => (

                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>

              )
            )}

          </select>

        </div>


        {/* Time */}

        <div>

          <label
            htmlFor="schedule-time"
            className="
              text-sm
              font-medium
              text-gray-700
            "
          >
            Time
          </label>

          <input
            id="schedule-time"
            type="time"
            value={time}
            onChange={(event) =>
              setTime(
                event.target.value
              )
            }
            className="
              mt-2
              w-full
              rounded-xl
              border
              border-gray-200
              bg-white
              px-4
              py-3
              text-sm
              outline-none
              focus:border-gray-400
            "
          />

        </div>

      </div>


      {/* Messages */}

      {error && (

        <div
          className="
            mt-5
            rounded-xl
            bg-red-50
            px-4
            py-3
          "
        >
          <p
            className="
              text-sm
              text-red-600
            "
          >
            {error}
          </p>
        </div>

      )}


      {success && (

        <div
          className="
            mt-5
            rounded-xl
            bg-green-50
            px-4
            py-3
          "
        >
          <p
            className="
              text-sm
              text-green-700
            "
          >
            {success}
          </p>
        </div>

      )}


      {/* Actions */}

      <div
        className="
          mt-6
          flex
          flex-wrap
          gap-3
        "
      >

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="
            rounded-xl
            bg-gray-900
            px-5
            py-2.5
            text-sm
            font-medium
            text-white
            transition
            hover:bg-gray-700
            disabled:cursor-not-allowed
            disabled:bg-gray-300
          "
        >

          {saving
            ? "Saving..."
            : "Save Schedule"}

        </button>


        {taskExists && (

          <button
            type="button"
            disabled={saving}
            onClick={handleDelete}
            className="
              rounded-xl
              border
              border-red-200
              bg-white
              px-5
              py-2.5
              text-sm
              font-medium
              text-red-600
              transition
              hover:bg-red-50
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            Delete Schedule
          </button>

        )}

      </div>

    </section>
  );
}