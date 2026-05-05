import nodemailer from "nodemailer";
import type { SentMessageInfo, Transporter } from "nodemailer";

interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  baseUrl: string;
  appUrl: string;
}

interface SendRawInput {
  to: string;
  subject: string;
  text: string;
  html: string;
}

interface EmailClient {
  config: EmailConfig;
  transporter: Transporter;
}

const REQUIRED_ENV_VARS = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "EMAIL_FROM",
  "NEXT_PUBLIC_BASE_URL",
] as const;

type RequiredEnvVar = (typeof REQUIRED_ENV_VARS)[number];

function getRequiredEnv(name: RequiredEnvVar): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Configure SMTP and email settings before sending email.`
    );
  }

  return value;
}

function getEmailConfig(): EmailConfig {
  const portValue = getRequiredEnv("SMTP_PORT");
  const port = Number.parseInt(portValue, 10);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(
      `Invalid SMTP_PORT value "${portValue}". SMTP_PORT must be a valid positive integer.`
    );
  }

  return {
    host: getRequiredEnv("SMTP_HOST"),
    port,
    user: getRequiredEnv("SMTP_USER"),
    pass: getRequiredEnv("SMTP_PASS"),
    from: getRequiredEnv("EMAIL_FROM"),
    baseUrl: getRequiredEnv("NEXT_PUBLIC_BASE_URL").replace(/\/+$/, ""),
    appUrl: (
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      getRequiredEnv("NEXT_PUBLIC_BASE_URL")
    ).replace(/\/+$/, ""),
  };
}

let emailClient: EmailClient | null = null;

function getEmailClient(): EmailClient {
  if (emailClient) {
    return emailClient;
  }

  const config = getEmailConfig();

  emailClient = {
    config,
    transporter: nodemailer.createTransport({
      host: config.host,
      port: config.port,
      // Port 587 starts with a plain TCP connection and upgrades to TLS afterward,
      // so `secure` must stay false instead of trying to open an implicit TLS socket.
      secure: false,
      // STARTTLS upgrades the connection to an encrypted TLS session after the
      // initial handshake, which is the standard flow for Gmail on port 587.
      requireTLS: true,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    }),
  };

  return emailClient;
}

export async function sendRaw({
  to,
  subject,
  text,
  html,
}: SendRawInput): Promise<SentMessageInfo> {
  const { config, transporter } = getEmailClient();

  return transporter.sendMail({
    from: config.from,
    to,
    subject,
    text,
    html,
  });
}

// ── Email verification ─────────────────────────────────────────────────────────

function buildVerificationEmailHtml(verificationLink: string): string {
  return `
    <div style="margin:0;padding:32px 16px;background-color:#f4f7fb;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:40px 32px;">
        <p style="margin:0 0 16px;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;color:#2563eb;font-weight:700;">
          CampusKart
        </p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.25;color:#111827;">
          Verify your email address
        </h1>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#374151;">
          Thanks for creating your CampusKart account. Confirm your email address to finish setting up access.
        </p>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#374151;">
          This verification link expires in 24 hours.
        </p>
        <p style="margin:0 0 32px;">
          <a
            href="${verificationLink}"
            style="display:inline-block;padding:14px 24px;border-radius:10px;background-color:#2563eb;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;"
          >
            Verify Email
          </a>
        </p>
        <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#6b7280;">
          If the button does not work, copy and paste this link into your browser:
        </p>
        <p style="margin:0 0 24px;font-size:14px;line-height:1.7;word-break:break-word;">
          <a href="${verificationLink}" style="color:#2563eb;text-decoration:none;">
            ${verificationLink}
          </a>
        </p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:#6b7280;">
          If you did not create a CampusKart account, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;
}

function buildVerificationEmailText(verificationLink: string): string {
  return [
    "CampusKart",
    "",
    "Verify your email address to finish setting up your account.",
    "This verification link expires in 24 hours.",
    "",
    verificationLink,
    "",
    "If you did not create a CampusKart account, you can safely ignore this email.",
  ].join("\n");
}

export async function sendVerificationEmail(
  to: string,
  token: string
): Promise<SentMessageInfo> {
  const { config } = getEmailClient();
  const verificationLink = new URL(
    `/verify-email/confirm?token=${encodeURIComponent(token)}`,
    config.baseUrl
  ).toString();

  return sendRaw({
    to,
    subject: "Verify your CampusKart email address",
    text: buildVerificationEmailText(verificationLink),
    html: buildVerificationEmailHtml(verificationLink),
  });
}

// Password reset -------------------------------------------------------------

function buildPasswordResetEmailHtml(
  resetLink: string,
  fullName?: string
): string {
  const greeting = fullName ? `Hi ${fullName},` : "Hi,";

  return `
    <div style="margin:0;padding:32px 16px;background-color:#f4f7fb;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:40px 32px;">
        <p style="margin:0 0 16px;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;color:#2563eb;font-weight:700;">
          CampusKart
        </p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.25;color:#111827;">
          Reset your password
        </h1>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#374151;">
          ${greeting}
        </p>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#374151;">
          We received a request to reset the password for your CampusKart account.
        </p>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#374151;">
          This password reset link expires in 1 hour and can only be used once.
        </p>
        <p style="margin:0 0 32px;">
          <a
            href="${resetLink}"
            style="display:inline-block;padding:14px 24px;border-radius:10px;background-color:#2563eb;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;"
          >
            Reset Password
          </a>
        </p>
        <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#6b7280;">
          If the button does not work, copy and paste this link into your browser:
        </p>
        <p style="margin:0 0 24px;font-size:14px;line-height:1.7;word-break:break-word;">
          <a href="${resetLink}" style="color:#2563eb;text-decoration:none;">
            ${resetLink}
          </a>
        </p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:#6b7280;">
          If you did not request a password reset, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;
}

function buildPasswordResetEmailText(
  resetLink: string,
  fullName?: string
): string {
  return [
    "CampusKart",
    "",
    fullName ? `Hi ${fullName},` : "Hi,",
    "",
    "We received a request to reset the password for your CampusKart account.",
    "This password reset link expires in 1 hour and can only be used once.",
    "",
    resetLink,
    "",
    "If you did not request a password reset, you can safely ignore this email.",
  ].join("\n");
}

export async function sendPasswordResetEmail(
  to: string,
  token: string,
  fullName?: string
): Promise<SentMessageInfo> {
  const { config } = getEmailClient();
  const resetLink = new URL(
    `/reset-password?token=${encodeURIComponent(token)}`,
    config.appUrl
  ).toString();

  return sendRaw({
    to,
    subject: "Reset your CampusKart password",
    text: buildPasswordResetEmailText(resetLink, fullName),
    html: buildPasswordResetEmailHtml(resetLink, fullName),
  });
}

// ── Report threshold alert ─────────────────────────────────────────────────────

export interface ReportThresholdAlertInput {
  /** Admin inbox that receives the alert. */
  adminEmail: string;
  listingId: string;
  listingTitle: string;
  reportCount: number;
}

function buildReportAlertHtml(
  input: Omit<ReportThresholdAlertInput, "adminEmail"> & { listingUrl: string }
): string {
  const { listingTitle, listingUrl, reportCount } = input;

  return `
    <div style="margin:0;padding:32px 16px;background-color:#f4f7fb;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:40px 32px;">
        <p style="margin:0 0 16px;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;color:#2563eb;font-weight:700;">
          CampusKart &middot; Moderation Alert
        </p>
        <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#111827;">
          Listing flagged for review
        </h1>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#374151;">
          The following listing has received <strong>${reportCount} reports</strong>
          and has been automatically flagged for moderation review.
        </p>

        <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
          <tr>
            <td style="padding:10px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;font-weight:600;width:36%;">
              Listing Title
            </td>
            <td style="padding:10px 12px;background:#f9fafb;border:1px solid #e5e7eb;border-left:0;font-size:15px;color:#111827;font-weight:600;">
              ${listingTitle}
            </td>
          </tr>
          <tr>
            <td style="padding:10px 12px;background:#f9fafb;border:1px solid #e5e7eb;border-top:0;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;font-weight:600;">
              Report Count
            </td>
            <td style="padding:10px 12px;background:#f9fafb;border:1px solid #e5e7eb;border-top:0;border-left:0;font-size:15px;color:#dc2626;font-weight:700;">
              ${reportCount}
            </td>
          </tr>
        </table>

        <p style="margin:0 0 24px;">
          <a
            href="${listingUrl}"
            style="display:inline-block;padding:14px 24px;border-radius:10px;background-color:#2563eb;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;"
          >
            Review Listing
          </a>
        </p>

        <p style="margin:0;font-size:13px;line-height:1.7;color:#6b7280;">
          This alert was sent automatically when the report count crossed the
          threshold. No further alerts will be sent for this listing unless
          the flag is manually cleared.
        </p>
      </div>
    </div>
  `;
}

function buildReportAlertText(
  input: Omit<ReportThresholdAlertInput, "adminEmail"> & { listingUrl: string }
): string {
  const { listingTitle, listingUrl, reportCount } = input;

  return [
    "CampusKart — Moderation Alert",
    "",
    "A listing has been flagged for review.",
    "",
    `Title:        ${listingTitle}`,
    `Report count: ${reportCount}`,
    `Review at:    ${listingUrl}`,
    "",
    "This is an automated one-time alert. No further alerts will be sent",
    "for this listing unless the flag is manually cleared.",
  ].join("\n");
}

/**
 * Sends a one-time moderation alert when a listing crosses the report threshold.
 * The caller is responsible for ensuring this is only called once per listing
 * (enforced by the report_alert_sent_at flag in the listings table).
 */
export async function sendReportThresholdAlert(
  input: ReportThresholdAlertInput
): Promise<SentMessageInfo> {
  const { config } = getEmailClient();

  const listingUrl = new URL(
    `/listings/${encodeURIComponent(input.listingId)}`,
    config.baseUrl
  ).toString();

  const templateInput = {
    listingId: input.listingId,
    listingTitle: input.listingTitle,
    reportCount: input.reportCount,
    listingUrl,
  };

  return sendRaw({
    to: input.adminEmail,
    subject: `[CampusKart] Listing flagged for review — "${input.listingTitle}"`,
    text: buildReportAlertText(templateInput),
    html: buildReportAlertHtml(templateInput),
  });
}
