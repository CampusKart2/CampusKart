"use client";

import { Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { useState, useTransition } from "react";

export default function VerifyEmailCard() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleResend() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/verify-email/resend", {
          method: "POST",
        });
        const body = (await res.json()) as { message?: string; error?: string };

        if (!res.ok) {
          setError(body.error ?? "Something went wrong. Please try again.");
          return;
        }

        setMessage(body.message ?? "Verification email sent.");
      } catch {
        setError("Network error. Please check your connection and try again.");
      }
    });
  }

  return (
    <section className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
      <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.20),_transparent_42%),linear-gradient(135deg,_#eff6ff_0%,_#ffffff_55%,_#f8fafc_100%)] p-8 md:p-10">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <Mail className="h-7 w-7" />
          </div>

          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-blue-700">
            CampusKart Access
          </p>
          <h1 className="max-w-md text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
            One quick step and your account is ready.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">
            Check your inbox and open the verification link we sent to your campus
            email. Once that link is confirmed, your posting and messaging access
            unlocks automatically.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4 backdrop-blur">
              <p className="text-sm font-semibold text-slate-900">Why this matters</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Email verification keeps CampusKart limited to real students and
                helps protect buyers and sellers on campus.
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-slate-900 p-4 text-slate-50 shadow-lg shadow-slate-200">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4" />
                Secure access
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Links expire after 24 hours, and you can request a fresh one any
                time from here.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center bg-slate-950 p-8 text-white md:p-10">
          <h2 className="text-2xl font-semibold">Need another email?</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            No problem. We can send a new verification link to the email address on
            your account.
          </p>

          {message && (
            <p className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {message}
            </p>
          )}

          {error && (
            <p className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          )}

          <button
            onClick={handleResend}
            disabled={isPending}
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
            {isPending ? "Sending..." : "Resend verification email"}
          </button>

          <p className="mt-5 text-xs uppercase tracking-[0.18em] text-slate-500">
            Check spam or promotions if you do not see it right away.
          </p>
        </div>
      </div>
    </section>
  );
}
