"use client";

import { useState } from "react";
import { z } from "zod";
import {
  REPORT_REASON_LABELS,
  REPORT_REASONS,
  type ReportReason,
} from "@/lib/types/report";

// ── Response schema ────────────────────────────────────────────────────────────

const reportResponseSchema = z.object({
  report: z.object({
    id: z.string().uuid(),
    listing_id: z.string().uuid(),
    reporter_id: z.string().uuid().nullable(),
    reason: z.enum(REPORT_REASONS),
    notes: z.string().nullable(),
    created_at: z.string(),
  }),
});

// ── Types ──────────────────────────────────────────────────────────────────────

type ModalState = "idle" | "open" | "submitting" | "success";

type ReportListingButtonProps = {
  listingId: string;
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function ReportListingButton({
  listingId,
}: ReportListingButtonProps) {
  const [modalState, setModalState] = useState<ModalState>("idle");
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(
    null
  );
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isOpen = modalState !== "idle";
  const isSubmitting = modalState === "submitting";
  const isSuccess = modalState === "success";

  function openModal(): void {
    setSelectedReason(null);
    setNotes("");
    setErrorMessage(null);
    setModalState("open");
  }

  function closeModal(): void {
    // Block close while a request is in-flight.
    if (isSubmitting) return;
    setModalState("idle");
    setErrorMessage(null);
  }

  function handleReasonChange(reason: ReportReason): void {
    setSelectedReason(reason);
    // Clear any prior error when the user makes a new selection.
    setErrorMessage(null);
    // Clear notes when switching away from "Other" so stale text isn't sent.
    if (reason !== "Other") setNotes("");
  }

  async function handleSubmit(): Promise<void> {
    if (!selectedReason || isSubmitting) return;

    // "Other" requires elaboration so the moderation team has enough context.
    if (selectedReason === "Other" && !notes.trim()) {
      setErrorMessage(
        'Please describe the issue when selecting "Other".'
      );
      return;
    }

    setModalState("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/listings/${encodeURIComponent(listingId)}/report`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: selectedReason,
            // Only include notes when the user wrote something.
            ...(notes.trim() ? { notes: notes.trim() } : {}),
          }),
        }
      );

      if (!response.ok) {
        const fallback = "Unable to submit your report right now.";
        let message = fallback;

        try {
          const data = (await response.json()) as { error?: string };
          if (typeof data.error === "string" && data.error.trim()) {
            message = data.error;
          }
        } catch {
          // JSON parse failed — keep fallback message.
        }

        setErrorMessage(message);
        setModalState("open");
        return;
      }

      const payload: unknown = await response.json();
      const parsed = reportResponseSchema.safeParse(payload);
      if (!parsed.success) {
        setErrorMessage("Received an unexpected response from the server.");
        setModalState("open");
        return;
      }

      setModalState("success");
    } catch {
      setErrorMessage("Network error. Please check your connection and retry.");
      setModalState("open");
    }
  }

  return (
    <>
      {/* Trigger — intentionally low-prominence so it doesn't compete with CTAs */}
      <button
        type="button"
        onClick={openModal}
        className="mt-5 text-xs text-danger underline-offset-2 transition-colors hover:underline"
      >
        Report this listing
      </button>

      {/* Modal overlay */}
      {isOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-listing-title"
          // Close on backdrop click — only when not submitting.
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
        >
          <div className="w-full max-w-md rounded-card border border-border bg-card p-4 shadow-card sm:p-6">
            {isSuccess ? (
              // ── Success state ────────────────────────────────────────────────
              <>
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/10"
                  >
                    {/* Check icon */}
                    <svg
                      className="h-4 w-4 text-success"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <h2
                    id="report-listing-title"
                    className="text-base font-bold text-text-primary sm:text-lg"
                  >
                    Report submitted
                  </h2>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                  Thank you for helping keep the marketplace safe. Our
                  moderation team will review your report shortly.
                </p>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="inline-flex items-center justify-center rounded-button bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
                  >
                    Done
                  </button>
                </div>
              </>
            ) : (
              // ── Reason-selection state ───────────────────────────────────────
              <>
                <h2
                  id="report-listing-title"
                  className="text-base font-bold text-text-primary sm:text-lg"
                >
                  Report this listing
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Select the reason that best describes the issue.
                </p>

                {/* Radio group */}
                <fieldset className="mt-4" disabled={isSubmitting}>
                  <legend className="sr-only">Report reason</legend>
                  <div className="space-y-2">
                    {REPORT_REASONS.map((reason) => (
                      <label
                        key={reason}
                        className={[
                          "flex cursor-pointer items-center gap-3 rounded-input border px-3 py-2.5 text-sm transition",
                          isSubmitting ? "cursor-not-allowed opacity-60" : "",
                          selectedReason === reason
                            ? "border-primary bg-primary-light font-medium text-primary"
                            : "border-border bg-surface text-text-primary hover:border-primary/50",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <input
                          type="radio"
                          name="report-reason"
                          value={reason}
                          checked={selectedReason === reason}
                          onChange={() => handleReasonChange(reason)}
                          className="accent-primary"
                        />
                        {REPORT_REASON_LABELS[reason]}
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Notes textarea — always shown once a reason is selected;
                    required only for "other". */}
                {selectedReason !== null ? (
                  <div className="mt-4">
                    <label
                      htmlFor="report-notes"
                      className="text-xs font-semibold text-text-muted"
                    >
                      {selectedReason === "Other" ? (
                        <>
                          Please describe the issue{" "}
                          <span className="text-danger" aria-hidden="true">
                            *
                          </span>
                          <span className="sr-only">(required)</span>
                        </>
                      ) : (
                        <>
                          Additional details{" "}
                          <span className="font-normal text-text-muted">
                            (optional)
                          </span>
                        </>
                      )}
                    </label>
                    <textarea
                      id="report-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      maxLength={500}
                      rows={selectedReason === "Other" ? 3 : 2}
                      disabled={isSubmitting}
                      placeholder={
                        selectedReason === "Other"
                          ? "Briefly describe the problem…"
                          : "Anything else to help our review… (optional)"
                      }
                      className="mt-1 w-full resize-none rounded-input border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                    />
                    <div className="mt-0.5 text-right text-xs text-text-muted">
                      {notes.length}/500
                    </div>
                  </div>
                ) : null}

                {/* Inline error */}
                {errorMessage ? (
                  <p
                    role="alert"
                    className="mt-3 rounded-input border border-danger/30 bg-red-50 px-3 py-2 text-xs text-danger"
                  >
                    {errorMessage}
                  </p>
                ) : null}

                {/* Actions */}
                <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSubmitting}
                    className="inline-flex w-full items-center justify-center rounded-button border border-border px-4 py-2.5 text-sm font-semibold text-text-primary transition hover:bg-surface disabled:opacity-60 sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void handleSubmit();
                    }}
                    disabled={isSubmitting || selectedReason === null}
                    className="inline-flex w-full items-center justify-center rounded-button bg-danger px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50 sm:w-auto"
                  >
                    {isSubmitting ? "Submitting…" : "Report"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
