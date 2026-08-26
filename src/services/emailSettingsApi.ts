export const API_BASE_URL = "";

export interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  emailFrom: string;
  emailTo: string;
  hasPassword: boolean;
}


export interface UpdateEmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string | null;
  emailFrom: string;
  emailTo: string;
}


export async function fetchEmailSettings():
  Promise<EmailSettings> {

  const response = await fetch(
    `${API_BASE_URL}/api/settings/email`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load email settings."
    );
  }

  return response.json();
}


export async function saveEmailSettings(
  settings: UpdateEmailSettings
): Promise<EmailSettings> {

  const response = await fetch(
    `${API_BASE_URL}/api/settings/email`,
    {
      method: "PUT",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(
          settings
        ),
    }
  );


  if (!response.ok) {
    const text =
      await response.text();

    throw new Error(
      text ||
      "Failed to save email settings."
    );
  }


  return response.json();
}


export async function sendTestEmail():
  Promise<void> {

  const response = await fetch(
    `${API_BASE_URL}/api/settings/email/test`,
    {
      method: "POST",
    }
  );


  if (!response.ok) {
    throw new Error(
      "Failed to send test email."
    );
  }
}