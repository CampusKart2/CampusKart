/**
 * Email utility – CampusKart
 *
 * Abstraction layer so the rest of the app never depends on a specific
 * transport. In development the link is printed to the console so the
 * flow can be tested without a real SMTP server. In production, swap
 * `sendRaw` for your transactional provider (Resend, SendGrid, etc.).
 *
 * No third-party library required – we stay within the approved stack.
 */

interface EmailPayload {
  to: string;
  subject: string;
  /** Plain-text fallback */
  text: string;
  /** HTML body */
  html: string;
}

/**
 * Low-level send function.
 * Replace the production branch body with your real transport call.
 */
async function sendRaw(payload: EmailPayload): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    // Print to server console so developers can click the link locally
    console.log(
      "\n--- [DEV EMAIL] ---\n" +
        `To:      ${payload.to}\n` +
        `Subject: ${payload.subject}\n` +
        `Body:\n${payload.text}\n` +
        "-------------------\n"
    );
    return;
  }

  /**
   * Production: plug in your transactional email provider here.
   * Example (Resend – just a fetch call, no extra SDK needed):
   *
   *   const res = await fetch("https://api.resend.com/emails", {
   *     method: "POST",
   *     headers: {
   *       Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
   *       "Content-Type": "application/json",
   *     },
   *     body: JSON.stringify({
   *       from: process.env.EMAIL_FROM,
   *       to: payload.to,
   *       subject: payload.subject,
   *       text: payload.text,
   *       html: payload.html,
   *     }),
   *   });
   *   if (!res.ok) throw new Error(`Email send failed: ${res.status}`);
   */
  throw new Error(
    "Production email transport is not configured. " +
      "Set up a provider in lib/email.ts and add the required env vars."
  );
}

// ─── Public helpers ────────────────────────────────────────────────────────────

export async function sendVerificationEmail(
  to: string,
  token: string
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const link = `${baseUrl}/api/auth/verify-email/confirm?token=${token}`;

  await sendRaw({
    to,
    subject: "Verify your CampusKart email address",
    text:
      `Welcome to CampusKart!\n\n` +
      `Click the link below to verify your .edu email address.\n` +
      `This link expires in 24 hours.\n\n` +
      `${link}\n\n` +
      `If you didn't create an account, you can safely ignore this email.`,
    html: `
      <p>Welcome to <strong>CampusKart</strong>!</p>
      <p>Click the button below to verify your .edu email address.<br/>
         This link expires in <strong>24 hours</strong>.</p>
      <p>
        <a href="${link}"
           style="display:inline-block;padding:12px 24px;background:#1d4ed8;
                  color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">
          Verify Email
        </a>
      </p>
      <p style="color:#6b7280;font-size:0.875rem;">
        Or copy and paste this URL into your browser:<br/>
        <a href="${link}">${link}</a>
      </p>
      <p style="color:#6b7280;font-size:0.875rem;">
        If you didn't create an account, you can safely ignore this email.
      </p>
    `,
  });
}
