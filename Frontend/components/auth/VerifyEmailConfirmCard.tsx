"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle, MailWarning, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface VerifyEmailConfirmCardProps {
  token: string;
}

type VerificationState = "loading" | "success" | "error";

export default function VerifyEmailConfirmCard({
  token,
}: VerifyEmailConfirmCardProps) {
  const router = useRouter();
  const [state, setState] = useState<VerificationState>("loading");
  const [message, setMessage] = useState("Confirming your email now...");

  const isTokenValidShape = useMemo(
    () => /^[0-9a-f]{64}$/.test(token),
    [token]
  );

  useEffect(() => {
    let isActive = true;

    async function confirmEmail() {
      if (!isTokenValidShape) {
        setState("error");
        setMessage("This verification link is invalid or incomplete.");
        return;
      }

      try {
        const res = await fetch(
          `/api/auth/verify-email/confirm?token=${encodeURIComponent(token)}`,
          { method: "GET", credentials: "include" }
        );
        const body = (await res.json()) as { message?: string; error?: string };

        if (!isActive) {
          return;
        }

        if (!res.ok) {
          setState("error");
          setMessage(body.error ?? "We could not verify this link.");
          return;
        }

        setState("success");
        setMessage(body.message ?? "Email verified successfully.");

        window.setTimeout(() => {
          router.push("/login");
          router.refresh();
        }, 1800);
      } catch {
        if (!isActive) {
          return;
        }

        setState("error");
        setMessage("We could not reach the verification service. Please try again.");
      }
    }

    void confirmEmail();

    return () => {
      isActive = false;
    };
  }, [isTokenValidShape, router, token]);

  const accentClass =
    state === "success"
      ? "from-emerald-500 to-teal-500"
      : state === "error"
      ? "from-rose-500 to-orange-400"
      : "from-blue-600 to-cyan-400";

  return (
    <section className="w-full max-w-3xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_36px_90px_rgba(15,23,42,0.12)]">
      <div className={`h-2 w-full bg-gradient-to-r ${accentClass}`} />

      <div className="grid gap-10 p-8 md:grid-cols-[0.95fr_1.05fr] md:p-12">
        <div className="rounded-[28px] bg-slate-950 p-8 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
            <Sparkles className="h-3.5 w-3.5" />
            CampusKart
          </div>

          <h1 className="mt-6 text-3xl font-bold leading-tight">
            {state === "success"
              ? "You are all set."
              : state === "error"
              ? "This link needs attention."
              : "Finishing your verification."}
          </h1>

          <p className="mt-4 text-base leading-7 text-slate-300">
            {state === "success"
              ? "Your account has been confirmed. If you opened this link in the same browser, your access updates automatically."
              : state === "error"
              ? "Verification links can expire or already be used. You can request a fresh one in a few seconds."
              : "We are checking your token and activating your account now. This should only take a moment."}
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-semibold text-white">What happens next</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {state === "success"
                ? "You will be redirected shortly. Verified users can browse, post listings, and message other students without the old verification banner lingering around."
                : state === "error"
                ? "Request another verification email from your account and open the newest link instead."
                : "Once verification completes, we will guide you back into the app with a cleaner confirmation experience."}
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100">
            {state === "success" && (
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            )}
            {state === "error" && (
              <MailWarning className="h-9 w-9 text-rose-500" />
            )}
            {state === "loading" && (
              <LoaderCircle className="h-9 w-9 animate-spin text-blue-600" />
            )}
          </div>

          <h2 className="text-2xl font-semibold text-slate-900">
            {state === "success"
              ? "Email confirmed"
              : state === "error"
              ? "Verification failed"
              : "Verifying your email"}
          </h2>

          <p className="mt-3 text-base leading-7 text-slate-600">{message}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {state === "success" ? (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Continue to CampusKart
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Go to homepage
                </Link>
              </>
            ) : state === "error" ? (
              <>
                <Link
                  href="/verify-email"
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Request a new link
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Back to log in
                </Link>
              </>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Activating your account...
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
