"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { forgotPasswordSchema } from "@/lib/validators/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);
    setMessage(null);

    const parsed = forgotPasswordSchema.safeParse({
      email: email.trim().toLowerCase(),
    });

    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Enter a valid email.");
      return;
    }

    setFieldError(null);
    setPending(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        setServerError(data.error ?? "Unable to send reset link.");
        return;
      }

      setMessage(
        data.message ??
          "If an account exists for that email, a password reset link has been sent."
      );
    } catch {
      setServerError("Unable to send reset link. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-sm bg-card rounded-card shadow-card p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary">
            Forgot password
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Enter your .edu email and we&apos;ll send a reset link
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {serverError && (
            <p
              role="alert"
              className="text-sm text-danger bg-red-50 border border-danger/20 rounded-input px-3 py-2"
            >
              {serverError}
            </p>
          )}

          {message && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-input px-3 py-2">
              {message}
            </p>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-text-primary"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={!!fieldError}
              aria-describedby={fieldError ? "email-error" : undefined}
              className={[
                "w-full px-3 py-2.5 text-sm border rounded-input bg-surface transition",
                "focus:outline-none focus:ring-2",
                fieldError
                  ? "border-danger focus:ring-danger/30 focus:border-danger"
                  : "border-border focus:ring-primary/30 focus:border-primary",
              ].join(" ")}
            />
            {fieldError && (
              <p id="email-error" className="text-xs text-danger">
                {fieldError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full py-2.5 text-sm font-semibold text-white bg-primary rounded-button hover:bg-primary-dark disabled:opacity-60 transition"
          >
            {pending ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="text-center text-sm text-text-secondary">
          Remember your password?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
