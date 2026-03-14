"use client";

import { useState, useRef, type ChangeEvent, type FocusEvent } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { signupAction } from "@/app/(auth)/actions";
import { signupSchema } from "@/lib/validators/auth";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  from: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

// 0 = empty, 1 = weak, 2 = fair, 3 = good, 4 = strong
type StrengthLevel = 0 | 1 | 2 | 3 | 4;

// ─── Password helpers ──────────────────────────────────────────────────────────

const STRENGTH_LABELS: Record<StrengthLevel, string> = {
  0: "",
  1: "Weak",
  2: "Fair",
  3: "Good",
  4: "Strong",
};

const STRENGTH_COLORS: Record<StrengthLevel, string> = {
  0: "bg-border",
  1: "bg-danger",
  2: "bg-badge-fair",
  3: "bg-badge-good",
  4: "bg-success",
};

const STRENGTH_TEXT_COLORS: Record<StrengthLevel, string> = {
  0: "text-text-muted",
  1: "text-danger",
  2: "text-badge-fair",
  3: "text-badge-good",
  4: "text-success",
};

/** Score a password 0–4 based on length + character variety. */
function scorePassword(pw: string): StrengthLevel {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 14) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(4, score) as StrengthLevel;
}

// ─── Field validator ───────────────────────────────────────────────────────────

/**
 * Run the Zod signup schema against a single field and return the first
 * error message, or undefined if the value is valid.
 */
function validateField(
  field: keyof Omit<FieldErrors, "confirmPassword">,
  value: string
): string | undefined {
  const result = signupSchema.pick({ [field]: true } as Record<typeof field, true>).safeParse({
    [field]: value,
  });
  return result.success ? undefined : result.error.issues[0]?.message;
}

// ─── ShowPasswordButton ────────────────────────────────────────────────────────

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    // Eye-slash (hide)
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7
           a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243
           M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59m7.532 7.532l3.29 3.29
           M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7
           a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    // Eye (show)
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
           -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function SignupForm({ from }: Props) {
  const [serverError, action, pending] = useActionState(signupAction, null);

  // Controlled field values
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Per-field inline error messages (shown after first blur)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Track which fields have been touched (blurred at least once)
  const touched = useRef<Partial<Record<keyof FieldErrors, boolean>>>({});

  // Show/hide toggles for password inputs
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = scorePassword(password);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleBlur(field: keyof FieldErrors) {
    touched.current[field] = true;
    revalidateField(field);
  }

  function revalidateField(field: keyof FieldErrors) {
    if (!touched.current[field]) return;

    setFieldErrors((prev) => {
      const next = { ...prev };

      if (field === "confirmPassword") {
        next.confirmPassword =
          confirmPassword !== password ? "Passwords do not match." : undefined;
      } else {
        const val = field === "name" ? name : field === "email" ? email : password;
        next[field] = validateField(field, val);
      }

      return next;
    });
  }

  function handleNameChange(e: ChangeEvent<HTMLInputElement>) {
    setName(e.target.value);
    if (touched.current.name) {
      setFieldErrors((prev) => ({
        ...prev,
        name: validateField("name", e.target.value),
      }));
    }
  }

  function handleEmailChange(e: ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
    if (touched.current.email) {
      setFieldErrors((prev) => ({
        ...prev,
        email: validateField("email", e.target.value),
      }));
    }
  }

  function handlePasswordChange(e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setPassword(val);
    const next: FieldErrors = { ...fieldErrors };
    if (touched.current.password) next.password = validateField("password", val);
    // Re-validate confirm whenever password changes
    if (touched.current.confirmPassword) {
      next.confirmPassword = confirmPassword !== val ? "Passwords do not match." : undefined;
    }
    setFieldErrors(next);
  }

  function handleConfirmChange(e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setConfirmPassword(val);
    if (touched.current.confirmPassword) {
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: val !== password ? "Passwords do not match." : undefined,
      }));
    }
  }

  /** Run full client-side validation before letting the Server Action fire. */
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // Mark all fields as touched
    touched.current = { name: true, email: true, password: true, confirmPassword: true };

    const schemaResult = signupSchema.safeParse({ name, email, password });
    const confirmErr = confirmPassword !== password ? "Passwords do not match." : undefined;

    const errors: FieldErrors = {
      name:            schemaResult.success ? undefined : schemaResult.error.issues.find((i) => i.path[0] === "name")?.message,
      email:           schemaResult.success ? undefined : schemaResult.error.issues.find((i) => i.path[0] === "email")?.message,
      password:        schemaResult.success ? undefined : schemaResult.error.issues.find((i) => i.path[0] === "password")?.message,
      confirmPassword: confirmErr,
    };

    const hasErrors = Object.values(errors).some(Boolean);
    if (hasErrors) {
      e.preventDefault(); // Block native form submit; Server Action won't fire
      setFieldErrors(errors);
    }
    // If no client errors, let the form's action={action} handle submission naturally
  }

  // ── Input class helper ────────────────────────────────────────────────────

  function inputClass(field: keyof FieldErrors) {
    const hasError = !!fieldErrors[field];
    return [
      "w-full px-3 py-2.5 text-sm border rounded-input bg-surface",
      "focus:outline-none focus:ring-2 transition",
      hasError
        ? "border-danger focus:ring-danger/30 focus:border-danger"
        : "border-border focus:ring-primary/30 focus:border-primary",
    ].join(" ");
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-sm bg-card rounded-card shadow-card p-8 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary">Create your account</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Use your .edu email to join your campus marketplace
        </p>
      </div>

      <form action={action} onSubmit={handleSubmit} noValidate className="space-y-4">
        <input type="hidden" name="from" value={from} />

        {/* Server-returned error (e.g. duplicate email) */}
        {serverError && (
          <p role="alert" className="text-sm text-danger bg-red-50 border border-danger/20 rounded-input px-3 py-2">
            {serverError}
          </p>
        )}

        {/* ── Name ── */}
        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-sm font-medium text-text-primary">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Alex Rivera"
            value={name}
            onChange={handleNameChange}
            onBlur={() => handleBlur("name")}
            aria-invalid={!!fieldErrors.name}
            aria-describedby={fieldErrors.name ? "name-error" : undefined}
            className={inputClass("name")}
          />
          {fieldErrors.name && (
            <p id="name-error" className="text-xs text-danger mt-1">{fieldErrors.name}</p>
          )}
        </div>

        {/* ── Email ── */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-text-primary">
            University email (.edu)
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
            <p id="email-error" className="text-xs text-danger mt-1">{fieldErrors.email}</p>
          )}
        </div>

        {/* ── Password ── */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-text-primary">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={handlePasswordChange}
              onBlur={(e: FocusEvent<HTMLInputElement>) => { void e; handleBlur("password"); }}
              aria-invalid={!!fieldErrors.password}
              aria-describedby="password-strength"
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
            <p className="text-xs text-danger">{fieldErrors.password}</p>
          )}

          {/* Password strength indicator */}
          {password.length > 0 && (
            <div id="password-strength" aria-live="polite" className="space-y-1 pt-0.5">
              <div className="flex gap-1" role="img" aria-label={`Password strength: ${STRENGTH_LABELS[strength]}`}>
                {([1, 2, 3, 4] as StrengthLevel[]).map((level) => (
                  <div
                    key={level}
                    className={[
                      "h-1.5 flex-1 rounded-full transition-all duration-300",
                      strength >= level ? STRENGTH_COLORS[strength] : "bg-border",
                    ].join(" ")}
                  />
                ))}
              </div>
              <p className={`text-xs font-medium ${STRENGTH_TEXT_COLORS[strength]}`}>
                {STRENGTH_LABELS[strength]}
                {strength < 3 && " — try adding uppercase, numbers or symbols"}
              </p>
            </div>
          )}
        </div>

        {/* ── Confirm password ── */}
        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary">
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={handleConfirmChange}
              onBlur={() => handleBlur("confirmPassword")}
              aria-invalid={!!fieldErrors.confirmPassword}
              aria-describedby={fieldErrors.confirmPassword ? "confirm-error" : undefined}
              className={inputClass("confirmPassword") + " pr-10"}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-text-muted hover:text-text-secondary transition"
              aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
            >
              <EyeIcon visible={showConfirm} />
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p id="confirm-error" className="text-xs text-danger">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={pending}
          className="w-full py-2.5 text-sm font-semibold text-white bg-primary rounded-button hover:bg-primary-dark disabled:opacity-60 transition"
        >
          {pending ? "Creating account…" : "Sign Up"}
        </button>
      </form>

      <p className="text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link
          href={`/login${from !== "/" ? `?from=${encodeURIComponent(from)}` : ""}`}
          className="text-primary font-semibold hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
