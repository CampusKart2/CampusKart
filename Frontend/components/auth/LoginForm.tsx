"use client";

import Link from "next/link";
import { useState, type ChangeEvent } from "react";
import { useActionState } from "react";
import { loginAction } from "@/app/(auth)/actions";
import { loginSchema } from "@/lib/validators/auth";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  from: string;
}

interface FieldErrors {
  email?: string;
  password?: string;
}

// ─── Eye icon toggle ───────────────────────────────────────────────────────────

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7
           a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243
           M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59m7.532 7.532l3.29 3.29
           M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7
           a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
           -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function LoginForm({ from }: Props) {
  const [serverError, action, pending] = useActionState(loginAction, null);

  // Controlled values
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Per-field inline errors; only shown after the field has been blurred
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FieldErrors, boolean>>>({});

  // Show/hide password toggle
  const [showPassword, setShowPassword] = useState(false);

  // ── Validation ───────────────────────────────────────────────────────────

  function validateField(field: keyof FieldErrors, value: string): string | undefined {
    const result = loginSchema.pick({ [field]: true } as Record<typeof field, true>).safeParse({
      [field]: value,
    });
    return result.success ? undefined : result.error.issues[0]?.message;
  }

  function handleBlur(field: keyof FieldErrors) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value = field === "email" ? email : password;
    setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
  }

  // Clear the inline error as the user re-types (only when already touched)
  function handleEmailChange(e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setEmail(val);
    if (touched.email) {
      setFieldErrors((prev) => ({ ...prev, email: validateField("email", val) }));
    }
  }

  function handlePasswordChange(e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setPassword(val);
    if (touched.password) {
      setFieldErrors((prev) => ({ ...prev, password: validateField("password", val) }));
    }
  }

  // Client-side guard before letting the Server Action fire
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      e.preventDefault();
      setTouched({ email: true, password: true });
      setFieldErrors({
        email:    result.error.issues.find((i) => i.path[0] === "email")?.message,
        password: result.error.issues.find((i) => i.path[0] === "password")?.message,
      });
    }
  }

  // ── Input class helper ────────────────────────────────────────────────────

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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-sm bg-card rounded-card shadow-card p-8 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary">Welcome back</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Log in to your CampusKart account
        </p>
      </div>

      <form action={action} onSubmit={handleSubmit} noValidate className="space-y-4">
        <input type="hidden" name="from" value={from} />

        {/* Server error (wrong credentials, etc.) */}
        {serverError && (
          <p role="alert" className="text-sm text-danger bg-red-50 border border-danger/20 rounded-input px-3 py-2">
            {serverError}
          </p>
        )}

        {/* ── Email ── */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-text-primary">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@university.edu"
            value={email}
            onChange={handleEmailChange}
            onBlur={() => handleBlur("email")}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
            className={inputClass("email")}
          />
          {fieldErrors.email && (
            <p id="email-error" className="text-xs text-danger">{fieldErrors.email}</p>
          )}
        </div>

        {/* ── Password ── */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="password" className="block text-sm font-medium text-text-primary">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={handlePasswordChange}
              onBlur={() => handleBlur("password")}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
              className={inputClass("password") + " pr-10"}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-text-muted hover:text-text-secondary transition"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <EyeIcon visible={showPassword} />
            </button>
          </div>
          {fieldErrors.password && (
            <p id="password-error" className="text-xs text-danger">{fieldErrors.password}</p>
          )}
        </div>

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={pending}
          className="w-full py-2.5 text-sm font-semibold text-white bg-primary rounded-button hover:bg-primary-dark disabled:opacity-60 transition"
        >
          {pending ? "Logging in…" : "Log In"}
        </button>
      </form>

      <p className="text-center text-sm text-text-secondary">
        Don&apos;t have an account?{" "}
        <Link
          href={`/signup${from !== "/" ? `?from=${encodeURIComponent(from)}` : ""}`}
          className="text-primary font-semibold hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
