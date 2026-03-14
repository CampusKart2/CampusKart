"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

interface Props {
  /** Pre-masked email shown in the body copy, e.g. "al**@pace.edu" */
  maskedEmail: string;
}

export default function CheckEmailCard({ maskedEmail }: Props) {
  const [resendStatus, setResendStatus] = useState<"idle" | "sent" | "error">("idle");
  const [isPending, startTransition] = useTransition();

  function handleResend() {
    setResendStatus("idle");
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/verify-email/resend", { method: "POST" });
        const body = (await res.json()) as { message?: string; error?: string };
        setResendStatus(res.ok ? "sent" : "error");
        if (!res.ok) console.error("[CheckEmailCard] resend error:", body.error);
      } catch {
        setResendStatus("error");
      }
    });
  }

  return (
    <div className="w-full max-w-md bg-card rounded-card shadow-card p-8 text-center space-y-6">
      {/* Envelope illustration */}
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
        <svg
          className="h-8 w-8 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8
               M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5
               a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>

      {/* Heading */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-text-primary">Check your email</h1>
        <p className="text-sm text-text-secondary">
          We sent a verification link to{" "}
          {maskedEmail ? (
            <span className="font-semibold text-text-primary">{maskedEmail}</span>
          ) : (
            "your .edu address"
          )}
          . Click the link to activate your CampusKart account.
        </p>
      </div>

      {/* Resend feedback */}
      {resendStatus === "sent" && (
        <p
          role="status"
          className="rounded-input bg-green-50 border border-success/20 px-4 py-2.5 text-sm text-success"
        >
          Email resent — please check your inbox.
        </p>
      )}
      {resendStatus === "error" && (
        <p
          role="alert"
          className="rounded-input bg-red-50 border border-danger/20 px-4 py-2.5 text-sm text-danger"
        >
          Something went wrong. Please try again in a moment.
        </p>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={handleResend}
          disabled={isPending || resendStatus === "sent"}
          className="w-full rounded-button border border-border py-2.5 text-sm font-semibold
                     text-text-primary bg-card hover:bg-surface transition
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Sending…" : "Resend verification email"}
        </button>

        <Link
          href="/login"
          className="block w-full rounded-button py-2.5 text-sm font-semibold text-white
                     bg-primary hover:bg-primary-dark transition text-center"
        >
          Back to log in
        </Link>
      </div>

      {/* Expiry notice */}
      <p className="text-xs text-text-muted">
        The link expires in 24 hours. Check your spam folder if you don&apos;t see it.
      </p>
    </div>
  );
}
