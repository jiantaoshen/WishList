import {
  useEffect,
  useState,
} from "react";

import {
  CheckCircle2,
  KeyRound,
  Mail,
  RefreshCw,
  Save,
  Send,
  Server,
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
  fetchEmailSettings,
  saveEmailSettings,
  sendTestEmail,
} from "@/services/emailSettingsApi";


// =============================================================
// Email Settings
// =============================================================

export function EmailSettings() {
  const [
    smtpHost,
    setSmtpHost,
  ] = useState(
    "smtp.gmail.com",
  );

  const [
    smtpPort,
    setSmtpPort,
  ] = useState(587);

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
    null,
  );

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );


  // =========================================================
  // Load
  // =========================================================

  useEffect(() => {
    async function load() {
      try {
        const settings =
          await fetchEmailSettings();

        setSmtpHost(
          settings.smtpHost,
        );

        setSmtpPort(
          settings.smtpPort,
        );

        setSmtpUser(
          settings.smtpUser,
        );

        setEmailFrom(
          settings.emailFrom,
        );

        setEmailTo(
          settings.emailTo,
        );

        setHasPassword(
          settings.hasPassword,
        );
      }
      catch (exception) {
        setError(
          getErrorMessage(
            exception,
            "Failed to load email settings.",
          ),
        );
      }
      finally {
        setLoading(false);
      }
    }


    void load();
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
        settings.hasPassword,
      );


      // Never retain password
      // in React state.
      setSmtpPassword("");


      setMessage(
        "Email settings saved.",
      );
    }
    catch (exception) {
      setError(
        getErrorMessage(
          exception,
          "Failed to save email settings.",
        ),
      );
    }
    finally {
      setSaving(false);
    }
  }


  // =========================================================
  // Test
  // =========================================================

  async function handleTest() {
    if (testing) {
      return;
    }


    setTesting(true);
    setError(null);
    setMessage(null);


    try {
      await sendTestEmail();

      setMessage(
        "Test email sent successfully.",
      );
    }
    catch (exception) {
      setError(
        getErrorMessage(
          exception,
          "Failed to send test email.",
        ),
      );
    }
    finally {
      setTesting(false);
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
            Loading email settings...
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
            Email Notifications
          </CardTitle>

          <CardDescription className="mt-1">
            Configure SMTP settings
            for Price Watch alerts.
          </CardDescription>
        </div>


        <PasswordStatus
          hasPassword={
            hasPassword
          }
        />
      </CardHeader>


      <CardContent className="space-y-6">
        {/* =================================================
            SMTP
        ================================================= */}

        <section
          className="
            rounded-xl
            border
            p-5
          "
        >
          <div
            className="
              mb-5 flex
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
              <Server
                className="
                  size-4
                  text-muted-foreground
                "
              />
            </div>


            <div>
              <h3 className="font-medium">
                SMTP server
              </h3>

              <p
                className="
                  mt-1 text-sm
                  text-muted-foreground
                "
              >
                Connection and
                authentication settings.
              </p>
            </div>
          </div>


          <div
            className="
              grid gap-4
              md:grid-cols-2
            "
          >
            <TextField
              id="smtp-host"
              label="SMTP Host"
              value={smtpHost}
              placeholder="smtp.gmail.com"
              disabled={
                saving || testing
              }
              onChange={
                setSmtpHost
              }
            />


            <div className="space-y-2">
              <Label htmlFor="smtp-port">
                SMTP Port
              </Label>

              <Input
                id="smtp-port"
                type="number"
                min={1}
                max={65535}
                value={smtpPort}
                disabled={
                  saving || testing
                }
                onChange={event => {
                  const value =
                    Number(
                      event.target.value,
                    );

                  setSmtpPort(value);
                }}
              />
            </div>


            <TextField
              id="smtp-user"
              label="SMTP User"
              value={smtpUser}
              placeholder="user@example.com"
              disabled={
                saving || testing
              }
              onChange={
                setSmtpUser
              }
            />


            {/* Password */}

            <div className="space-y-2">
              <div
                className="
                  flex items-center
                  justify-between
                  gap-3
                "
              >
                <Label htmlFor="smtp-password">
                  SMTP Password
                </Label>

                {hasPassword && (
                  <span
                    className="
                      text-xs
                      text-muted-foreground
                    "
                  >
                    Saved
                  </span>
                )}
              </div>


              <Input
                id="smtp-password"
                type="password"
                value={smtpPassword}
                autoComplete="new-password"
                disabled={
                  saving || testing
                }
                placeholder={
                  hasPassword
                    ? "Leave blank to keep saved password"
                    : "Enter App Password"
                }
                onChange={event =>
                  setSmtpPassword(
                    event.target.value,
                  )
                }
              />


              <p
                className="
                  text-xs
                  text-muted-foreground
                "
              >
                {hasPassword
                  ? "A password is already stored. Enter a new one only to replace it."
                  : "No SMTP password is currently stored."}
              </p>
            </div>
          </div>
        </section>


        {/* =================================================
            Email
        ================================================= */}

        <section
          className="
            rounded-xl
            border
            p-5
          "
        >
          <div
            className="
              mb-5 flex
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
              <Mail
                className="
                  size-4
                  text-muted-foreground
                "
              />
            </div>


            <div>
              <h3 className="font-medium">
                Email addresses
              </h3>

              <p
                className="
                  mt-1 text-sm
                  text-muted-foreground
                "
              >
                Configure the sender
                and notification recipient.
              </p>
            </div>
          </div>


          <div
            className="
              grid gap-4
              md:grid-cols-2
            "
          >
            <TextField
              id="email-from"
              type="email"
              label="Email From"
              value={emailFrom}
              placeholder="pricewatch@example.com"
              disabled={
                saving || testing
              }
              onChange={
                setEmailFrom
              }
            />


            <TextField
              id="email-to"
              type="email"
              label="Send To"
              value={emailTo}
              placeholder="you@example.com"
              disabled={
                saving || testing
              }
              onChange={
                setEmailTo
              }
            />
          </div>
        </section>


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


        {message && (
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
              {message}
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
            disabled={
              saving || testing
            }
            onClick={() => {
              void handleSave();
            }}
          >
            <Save />

            {saving
              ? "Saving..."
              : "Save settings"}
          </Button>


          <Button
            type="button"
            variant="outline"
            disabled={
              testing ||
              saving ||
              !hasPassword
            }
            onClick={() => {
              void handleTest();
            }}
          >
            <Send />

            {testing
              ? "Sending..."
              : "Send test email"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


// =============================================================
// Text Field
// =============================================================

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange:
    (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: "text" | "email";
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
      </Label>

      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={event =>
          onChange(
            event.target.value,
          )
        }
      />
    </div>
  );
}


// =============================================================
// Password Status
// =============================================================

function PasswordStatus({
  hasPassword,
}: {
  hasPassword: boolean;
}) {
  if (hasPassword) {
    return (
      <Badge
        variant="secondary"
        className="gap-1"
      >
        <KeyRound className="size-3" />

        Password saved
      </Badge>
    );
  }


  return (
    <Badge
      variant="outline"
      className="gap-1"
    >
      <KeyRound className="size-3" />

      Password required
    </Badge>
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