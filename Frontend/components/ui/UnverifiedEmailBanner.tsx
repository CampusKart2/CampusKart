"use client";

import { useState, useTransition } from "react";

type ResendState = "idle" | "pending" | "sent" | "error";

export default function UnverifiedEmailBanner() {
  const [resendState, setResendState] = useState<ResendState>("idle");
  const [dismissed, setDismissed] = useState(false);
  const [, startTransition] = useTransition();

  if (dismissed) return null;

  async function handleResend() {
    setResendState("pending");
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/verify-email/resend", {
          method: "POST",
        });
        const body = (await res.json()) as { message?: string; error?: string };
        if (res.ok) {
          setResendState("sent");
        } else {
          console.error("[UnverifiedEmailBanner] resend error:", body.error);
          setResendState("error");
        }
      } catch {
        setResendState("error");
      }
    });
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2.5"
    >
      <div className="max-w-screen-xl mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-sm">
        {/* Left: message */}
        <span className="text-amber-800">
          <span className="font-semibold">Verify your email</span>
          {" — "}
          {resendState === "sent"
            ? "Verification email sent! Check your inbox."
            : resendState === "error"
            ? "Couldn't send the email. Please try again."
            : "Confirm your .edu address to post listings and send messages."}
        </span>

        {/* Right: CTA + dismiss */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {resendState !== "sent" && (
            <button
              onClick={handleResend}
              disabled={resendState === "pending"}
              className="text-sm font-semibold text-amber-700 underline underline-offset-2
                         hover:text-amber-900 disabled:opacity-50 transition"
            >
              {resendState === "pending" ? "Sending…" : "Resend verification email"}
            </button>
          )}

          {/* Dismiss × — hides the banner for the current page session */}
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss verification banner"
            className="text-amber-600 hover:text-amber-900 transition ml-1"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
