"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { resetPasswordSchema } from "@/lib/validators/auth";

interface FieldErrors {
  password?: string;
  confirmPassword?: string;
  token?: string;
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);
    setMessage(null);

    const parsed = resetPasswordSchema.safeParse({
      token,
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      setFieldErrors(
        parsed.error.issues.reduce<FieldErrors>((errors, issue) => {
          const field = issue.path[0];
          if (
            field === "password" ||
            field === "confirmPassword" ||
            field === "token"
          ) {
            errors[field] ??= issue.message;
          }
          return errors;
        }, {})
      );
      return;
    }

    setFieldErrors({});
    setPending(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        setServerError(data.error ?? "Unable to reset password.");
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setMessage(data.message ?? "Password has been reset successfully.");
    } catch {
      setServerError("Unable to reset password. Please try again.");
    } finally {
      setPending(false);
    }
  }

  function inputClass(field: keyof FieldErrors) {
    const hasError = !!fieldErrors[field];
    return [
      "w-full px-3 py-2.5 text-sm border rounded-input bg-surface transition",
      "focus:outline-none focus:ring-2",
      hasError
        ? "border-danger focus:ring-danger/30 focus:border-danger"
        : "border-border focus:ring-primary/30 focus:border-primary",
    ].join(" ");
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-sm bg-card rounded-card shadow-card p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary">
            Reset password
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Choose a stronger password for your CampusKart account
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {fieldErrors.token && (
            <p
              role="alert"
              className="text-sm text-danger bg-red-50 border border-danger/20 rounded-input px-3 py-2"
            >
              {fieldErrors.token}
            </p>
          )}

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
              htmlFor="password"
              className="block text-sm font-medium text-text-primary"
            >
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={
                fieldErrors.password ? "password-error" : undefined
              }
              className={inputClass("password")}
            />
            {fieldErrors.password && (
              <p id="password-error" className="text-xs text-danger">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-text-primary"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              aria-invalid={!!fieldErrors.confirmPassword}
              aria-describedby={
                fieldErrors.confirmPassword
                  ? "confirm-password-error"
                  : undefined
              }
              className={inputClass("confirmPassword")}
            />
            {fieldErrors.confirmPassword && (
              <p id="confirm-password-error" className="text-xs text-danger">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={pending || !!message}
            className="w-full py-2.5 text-sm font-semibold text-white bg-primary rounded-button hover:bg-primary-dark disabled:opacity-60 transition"
          >
            {pending ? "Resetting..." : "Reset password"}
          </button>
        </form>

        <p className="text-center text-sm text-text-secondary">
          Back to{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
