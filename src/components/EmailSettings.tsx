import { useEffect, useState } from "react";

import {
  fetchEmailSettings,
  saveEmailSettings,
  sendTestEmail,
} from "../services/emailSettingsApi";


interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}


// =============================================================
// Email Settings
// =============================================================

export function EmailSettings() {

  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [emailFrom, setEmailFrom] = useState("");
  const [emailTo, setEmailTo] = useState("");
  const [hasPassword, setHasPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);


  // =========================================================
  // Load Settings
  // =========================================================

  useEffect(() => {

    async function load() {

      try {

        const settings = await fetchEmailSettings();

        setSmtpHost(settings.smtpHost);
        setSmtpPort(settings.smtpPort);
        setSmtpUser(settings.smtpUser);
        setEmailFrom(settings.emailFrom);
        setEmailTo(settings.emailTo);
        setHasPassword(settings.hasPassword);

      } catch (error) {

        if (error instanceof Error) { setError(error.message); }

      } finally {

        setLoading(false);

      }
    }


    load();

  }, []);


  // =========================================================
  // Save
  // =========================================================

  async function handleSave() {

    setSaving(true);
    setError(null);
    setMessage(null);

    try {

      const settings = await saveEmailSettings({
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPassword: smtpPassword.trim() ? smtpPassword : null,
        emailFrom,
        emailTo,
      });

      setHasPassword(settings.hasPassword);

      // Never retain password in React.
      setSmtpPassword("");

      setMessage("Email settings saved.");

    } catch (error) {

      if (error instanceof Error) { setError(error.message); }

    } finally {

      setSaving(false);

    }
  }


  // =========================================================
  // Test
  // =========================================================

  async function handleTest() {

    setTesting(true);
    setError(null);
    setMessage(null);

    try {

      await sendTestEmail();

      setMessage("Test email sent successfully.");

    } catch (error) {

      if (error instanceof Error) { setError(error.message); }

    } finally {

      setTesting(false);

    }
  }


  // =========================================================
  // Loading
  // =========================================================

  if (loading) {
    return (
      <div className="app-card p-6">
        <p className="app-body">
          Loading email settings...
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

      <div>
        <h2 className="app-page-title">
          Email Notifications
        </h2>

        <p className="app-body mt-1">
          Configure SMTP settings for Price Watch alerts.
        </p>
      </div>


      {/* Form */}

      <div className="mt-6 grid gap-4 md:grid-cols-2">

        <Input
          label="SMTP Host"
          value={smtpHost}
          onChange={setSmtpHost}
        />


        <div>

          <label className="app-body font-medium">
            SMTP Port
          </label>

          <input
            type="number"
            value={smtpPort}
            onChange={(event) => setSmtpPort(Number(event.target.value))}
            className="app-input mt-2"
          />

        </div>


        <Input
          label="SMTP User"
          value={smtpUser}
          onChange={setSmtpUser}
        />


        <div>

          <label className="app-body font-medium">
            SMTP Password
          </label>

          <input
            type="password"
            value={smtpPassword}
            onChange={(event) => setSmtpPassword(event.target.value)}
            placeholder={hasPassword ? "Saved — leave blank to keep" : "Enter App Password"}
            className="app-input mt-2"
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


      {/* Messages */}

      {error && (
        <div className="status-danger mt-5 rounded-xl border px-4 py-3">
          <p className="text-sm">
            {error}
          </p>
        </div>
      )}

      {message && (
        <div className="status-success mt-5 rounded-xl border px-4 py-3">
          <p className="text-sm">
            {message}
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
          {saving ? "Saving..." : "Save Settings"}
        </button>


        <button
          type="button"
          disabled={testing || !hasPassword}
          onClick={handleTest}
          className="app-btn app-btn-secondary px-5 py-2.5 text-sm"
        >
          {testing ? "Sending..." : "Send Test Email"}
        </button>

      </div>

    </section>
  );
}


// =============================================================
// Input
// =============================================================

function Input({
  label,
  value,
  onChange,
}: InputProps) {

  return (
    <div>

      <label className="app-body font-medium">
        {label}
      </label>

      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="app-input mt-2"
      />

    </div>
  );
}