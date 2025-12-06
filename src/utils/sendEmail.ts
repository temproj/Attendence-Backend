// Path: src/utils/sendEmail.ts

let cachedToken: string | null = null;
let cachedTokenExpiry = 0;

// Helper: get app-only access token
const getAccessToken = async (): Promise<string> => {
  const now = Date.now();

  // small in-memory cache to reduce token calls
  if (cachedToken && now < cachedTokenExpiry - 60_000) {
    return cachedToken;
  }

  const params = new URLSearchParams();
  params.append("client_id", process.env.MS_CLIENT_ID!);
  params.append("client_secret", process.env.MS_CLIENT_SECRET!);
  params.append("scope", "https://graph.microsoft.com/.default");
  params.append("grant_type", "client_credentials");

  const resp = await fetch(
    `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    }
  );

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Failed to get MS Graph token: ${resp.status} ${txt}`);
  }

  const data: any = await resp.json();
  cachedToken = data.access_token;
  // expires_in is seconds
  cachedTokenExpiry = now + (data.expires_in || 3600) * 1000;

  return cachedToken!;
};

const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: Error }> => {
  try {
    if (!to || !subject || !html) {
      throw new Error("Missing to/subject/html in sendEmail");
    }

    const accessToken = await getAccessToken();

    // We send on behalf of fixed sender mailbox
    const sender = process.env.MS_MAIL_SENDER!; // e.g. "attendance@gecbanka.org"

    const resp = await fetch(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
        sender
      )}/sendMail`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            subject,
            body: {
              contentType: "HTML",
              content: html,
            },
            toRecipients: [
              {
                emailAddress: {
                  address: to,
                },
              },
            ],
            from: {
              emailAddress: {
                address: sender,
              },
            },
          },
          saveToSentItems: true, // ✅ will show in Outlook "Sent"
        }),
      }
    );

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("Graph sendMail error:", resp.status, txt);
      return { success: false, error: new Error(txt) };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in sendEmail utility:", error);
    return { success: false, error };
  }
};

export default sendEmail;
