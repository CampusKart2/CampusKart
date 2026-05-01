"use client";

import { useState } from "react";
import { z } from "zod";
import StarRatingInput from "@/components/sellers/StarRatingInput";

// ---------------------------------------------------------------------------
// Zod schema — mirrors the backend createReviewBodySchema (max 500 chars per AC)
// ---------------------------------------------------------------------------
const reviewFormSchema = z.object({
  rating: z
    .number({ error: "Please select a star rating." })
    .int()
    .min(1, "Please select a star rating.")
    .max(5),
  comment: z
    .string()
    .max(500, "Comment must be 500 characters or fewer.")
    .optional(),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

const MAX_COMMENT = 500;

interface ReviewFormProps {
  /** The seller being reviewed. */
  sellerId: string;
  sellerName: string;
  /** Called after a review is successfully submitted. */
  onSuccess?: () => void;
}

type FormStatus = "idle" | "submitting" | "success" | "error";

/**
 * ReviewForm
 * Displays a StarRatingInput + optional comment textarea.
 * Validates client-side with Zod, then POSTs to /api/users/:id/reviews.
 */
export default function ReviewForm({
  sellerId,
  sellerName,
  onSuccess,
}: ReviewFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ReviewFormValues, string>>>({});
  const [status, setStatus] = useState<FormStatus>("idle");
  const [apiError, setApiError] = useState<string | null>(null);

  const charsLeft = MAX_COMMENT - comment.length;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Client-side validation
    const parsed = reviewFormSchema.safeParse({
      rating,
      comment: comment.trim() || undefined,
    });

    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        rating: flat.rating?.[0],
        comment: flat.comment?.[0],
      });
      return;
    }

    setFieldErrors({});
    setApiError(null);
    setStatus("submitting");

    try {
      const res = await fetch(`/api/users/${encodeURIComponent(sellerId)}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (res.status === 409) {
        setApiError("You have already reviewed this seller.");
        setStatus("error");
        return;
      }

      if (res.status === 401) {
        setApiError("You must be logged in to leave a review.");
        setStatus("error");
        return;
      }

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setApiError(body.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      setStatus("success");
      onSuccess?.();
    } catch {
      setApiError("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  }

  // ---- Success state --------------------------------------------------------
  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-card border border-success/30 bg-success/10 px-5 py-4 text-sm font-medium text-success"
      >
        Your review was submitted. Thank you!
      </div>
    );
  }

  const isSubmitting = status === "submitting";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={`Leave a review for ${sellerName}`}
      className="rounded-card border border-border bg-card shadow-card p-4 sm:p-6 space-y-5"
    >
      <h3 className="text-base font-semibold text-text-primary">
        Review {sellerName}
      </h3>

      {/* Star picker */}
      <div className="space-y-1">
        <StarRatingInput
          value={rating}
          onChange={(v) => {
            setRating(v);
            // Clear star error on change
            setFieldErrors((prev) => ({ ...prev, rating: undefined }));
          }}
          disabled={isSubmitting}
        />
        {fieldErrors.rating && (
          <p role="alert" className="text-xs text-danger mt-1">
            {fieldErrors.rating}
          </p>
        )}
      </div>

      {/* Comment textarea */}
      <div className="space-y-1">
        <label
          htmlFor="review-comment"
          className="block text-sm font-medium text-text-primary"
        >
          Comment{" "}
          <span className="font-normal text-text-muted">(optional)</span>
        </label>
        <textarea
          id="review-comment"
          name="comment"
          rows={4}
          maxLength={MAX_COMMENT}
          value={comment}
          disabled={isSubmitting}
          onChange={(e) => {
            setComment(e.target.value);
            setFieldErrors((prev) => ({ ...prev, comment: undefined }));
          }}
          placeholder="Share your experience with this seller…"
          className={[
            "w-full rounded-input border px-3 py-2 text-sm text-text-primary",
            "placeholder:text-text-muted bg-white resize-none",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            "transition-colors",
            fieldErrors.comment ? "border-danger" : "border-border",
          ].join(" ")}
          aria-describedby="review-comment-chars"
        />
        <div className="flex items-center justify-between gap-2">
          {fieldErrors.comment ? (
            <p role="alert" className="text-xs text-danger">
              {fieldErrors.comment}
            </p>
          ) : (
            <span />
          )}
          {/* Live character count */}
          <span
            id="review-comment-chars"
            aria-live="polite"
            aria-atomic="true"
            className={[
              "text-xs tabular-nums",
              charsLeft <= 50 ? "text-danger font-medium" : "text-text-muted",
            ].join(" ")}
          >
            {charsLeft} / {MAX_COMMENT}
          </span>
        </div>
      </div>

      {/* API-level error */}
      {apiError && (
        <p role="alert" className="text-sm text-danger">
          {apiError}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={[
          "w-full sm:w-auto inline-flex items-center justify-center",
          "min-h-[44px] px-6 py-2 rounded-button text-sm font-semibold",
          "bg-primary text-white hover:bg-primary-dark transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          "disabled:opacity-60 disabled:cursor-not-allowed",
        ].join(" ")}
      >
        {isSubmitting ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
