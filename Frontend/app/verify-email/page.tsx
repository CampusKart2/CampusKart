/**
 * /verify-email page
 *
 * Shown to authenticated users whose email_verified === false when they
 * try to access a restricted route (middleware redirect).
 * Renders a prompt to check their inbox and a "Resend" button.
 */
"use client";

import { useState, useTransition } from "react";

export default function VerifyEmailPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleResend() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        // Hit the send endpoint without an email param — the server reads the
        // session cookie to determine the user's address.
        const res = await fetch("/api/auth/verify-email/resend", {
          method: "POST",
        });
        const body = (await res.json()) as { message?: string; error?: string };

        if (!res.ok) {
          setError(body.error ?? "Something went wrong. Please try again.");
        } else {
          setMessage(body.message ?? "Verification email sent.");
        }
      } catch {
        setError("Network error. Please check your connection and try again.");
      }
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
          <svg
            className="h-7 w-7 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Verify your email
        </h1>
        <p className="mb-6 text-sm text-gray-600">
          We sent a confirmation link to your <strong>.edu</strong> address.
          Click the link in that email to unlock posting and messaging on
          CampusKart.
        </p>

        {/* Feedback */}
        {message && (
          <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </p>
        )}
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* Resend button */}
        <button
          onClick={handleResend}
          disabled={isPending}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white
                     transition hover:bg-blue-700 focus:outline-none focus:ring-2
                     focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isPending ? "Sending…" : "Resend verification email"}
        </button>

        <p className="mt-4 text-xs text-gray-400">
          The link expires in 24 hours.
        </p>
      </div>
    </main>
  );
}
