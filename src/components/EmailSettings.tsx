import {
  useEffect,
  useState,
} from "react";

import {
  fetchEmailSettings,
  saveEmailSettings,
  sendTestEmail,
} from "../services/emailSettingsApi";


export function EmailSettings() {

  const [
    smtpHost,
    setSmtpHost,
  ] = useState(
    "smtp.gmail.com"
  );

  const [
    smtpPort,
    setSmtpPort,
  ] = useState(
    587
  );

  const [
    smtpUser,
    setSmtpUser,
  ] = useState("");

  const [
    smtpPassword,
    setSmtpPassword,
  ] = useState("");

  const [
    emailFrom,
    setEmailFrom,
  ] = useState("");

  const [
    emailTo,
    setEmailTo,
  ] = useState("");

  const [
    hasPassword,
    setHasPassword,
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
    testing,
    setTesting,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState<string | null>(
    null
  );

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );


  useEffect(() => {

    async function load() {

      try {

        const settings =
          await fetchEmailSettings();

        setSmtpHost(
          settings.smtpHost
        );

        setSmtpPort(
          settings.smtpPort
        );

        setSmtpUser(
          settings.smtpUser
        );

        setEmailFrom(
          settings.emailFrom
        );

        setEmailTo(
          settings.emailTo
        );

        setHasPassword(
          settings.hasPassword
        );

      } catch (error) {

        if (error instanceof Error) {
          setError(
            error.message
          );
        }

      } finally {

        setLoading(false);
      }
    }


    load();

  }, []);


  async function handleSave() {

    setSaving(true);
    setError(null);
    setMessage(null);

    try {

      const settings =
        await saveEmailSettings({
          smtpHost,
          smtpPort,
          smtpUser,

          smtpPassword:
            smtpPassword.trim()
              ? smtpPassword
              : null,

          emailFrom,
          emailTo,
        });


      setHasPassword(
        settings.hasPassword
      );

      // Never retain password in React.
      setSmtpPassword("");

      setMessage(
        "Email settings saved."
      );

    } catch (error) {

      if (error instanceof Error) {
        setError(
          error.message
        );
      }

    } finally {

      setSaving(false);
    }
  }


  async function handleTest() {

    setTesting(true);
    setError(null);
    setMessage(null);

    try {

      await sendTestEmail();

      setMessage(
        "Test email sent successfully."
      );

    } catch (error) {

      if (error instanceof Error) {
        setError(
          error.message
        );
      }

    } finally {

      setTesting(false);
    }
  }


  if (loading) {

    return (
      <div className="rounded-2xl border bg-white p-6">
        <p className="text-sm text-gray-500">
          Loading email settings...
        </p>
      </div>
    );
  }


  return (
    <section
      className="
        rounded-2xl
        border
        bg-white
        p-6
      "
    >

      <h2 className="text-lg font-semibold text-gray-900">
        Email Notifications
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Configure SMTP settings for Price Watch alerts.
      </p>


      <div
        className="
          mt-6
          grid
          gap-4
          md:grid-cols-2
        "
      >

        <Input
          label="SMTP Host"
          value={smtpHost}
          onChange={setSmtpHost}
        />

        <div>

          <label className="text-sm font-medium text-gray-700">
            SMTP Port
          </label>

          <input
            type="number"
            value={smtpPort}
            onChange={(event) =>
              setSmtpPort(
                Number(
                  event.target.value
                )
              )
            }
            className="
              mt-2
              w-full
              rounded-xl
              border
              px-4
              py-3
              text-sm
            "
          />

        </div>


        <Input
          label="SMTP User"
          value={smtpUser}
          onChange={setSmtpUser}
        />


        <div>

          <label className="text-sm font-medium text-gray-700">
            SMTP Password
          </label>

          <input
            type="password"
            value={smtpPassword}
            onChange={(event) =>
              setSmtpPassword(
                event.target.value
              )
            }
            placeholder={
              hasPassword
                ? "Saved — leave blank to keep"
                : "Enter App Password"
            }
            className="
              mt-2
              w-full
              rounded-xl
              border
              px-4
              py-3
              text-sm
            "
          />

        </div>


        <Input
          label="Email From"
          value={emailFrom}
          onChange={setEmailFrom}
        />

        <Input
          label="Send To"
          value={emailTo}
          onChange={setEmailTo}
        />

      </div>


      {error && (
        <p className="mt-5 text-sm text-red-600">
          {error}
        </p>
      )}


      {message && (
        <p className="mt-5 text-sm text-green-700">
          {message}
        </p>
      )}


      <div className="mt-6 flex flex-wrap gap-3">

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
            disabled:bg-gray-300
          "
        >
          {saving
            ? "Saving..."
            : "Save Settings"}
        </button>


        <button
          type="button"
          disabled={
            testing ||
            !hasPassword
          }
          onClick={handleTest}
          className="
            rounded-xl
            border
            px-5
            py-2.5
            text-sm
            font-medium
            text-gray-700
            disabled:opacity-50
          "
        >
          {testing
            ? "Sending..."
            : "Send Test Email"}
        </button>

      </div>

    </section>
  );
}


function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {

  return (
    <div>

      <label className="text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        type="text"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="
          mt-2
          w-full
          rounded-xl
          border
          px-4
          py-3
          text-sm
        "
      />

    </div>
  );
}