/**
 * /check-email — "Check Your Email" confirmation screen
 *
 * Server Component: reads the `?email=` search param (set by signupAction)
 * and passes a masked version to the interactive card.
 */

import CheckEmailCard from "@/components/auth/CheckEmailCard";

interface CheckEmailPageProps {
  searchParams: Promise<{ email?: string }>;
}

/** Mask an email for display: "alex.rivera@pace.edu" → "al**@pace.edu" */
function maskEmail(raw: string): string {
  const at = raw.indexOf("@");
  if (at < 0) return raw;
  const local = raw.slice(0, at);
  const domain = raw.slice(at); // includes the "@"
  const visible = Math.min(2, local.length);
  return `${local.slice(0, visible)}${"*".repeat(local.length - visible)}${domain}`;
}

export default async function CheckEmailPage({ searchParams }: CheckEmailPageProps) {
  const { email = "" } = await searchParams;
  // Decode the query param safely — redirect passes encodeURIComponent
  const decoded = email ? decodeURIComponent(email) : "";
  const masked = decoded ? maskEmail(decoded) : "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-12">
      <CheckEmailCard maskedEmail={masked} />
    </div>
  );
}
