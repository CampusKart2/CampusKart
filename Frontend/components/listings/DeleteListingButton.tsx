"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

const deleteListingResponseSchema = z.object({
  listing: z.object({
    id: z.string().uuid(),
    status: z.literal("deleted"),
    updated_at: z.string().min(1),
  }),
});

type DeleteListingButtonProps = {
  listingId: string;
};

export default function DeleteListingButton({
  listingId,
}: DeleteListingButtonProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleConfirmDelete(): Promise<void> {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/listings/${encodeURIComponent(listingId)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const fallback = "Unable to delete this listing right now.";
        let message = fallback;

        try {
          const payload = (await response.json()) as { error?: string };
          if (typeof payload.error === "string" && payload.error.trim()) {
            message = payload.error;
          }
        } catch {
          message = fallback;
        }

        setErrorMessage(message);
        return;
      }

      const payload: unknown = await response.json();
      const parsed = deleteListingResponseSchema.safeParse(payload);
      if (!parsed.success) {
        setErrorMessage("Received an unexpected response from the server.");
        return;
      }

      setIsModalOpen(false);
      router.replace("/listings");
      router.refresh();
    } catch {
      setErrorMessage("Network error. Please check your connection and retry.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (!isSubmitting) {
            setIsModalOpen(true);
          }
        }}
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center rounded-button bg-danger px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-70 sm:w-fit"
      >
        {isSubmitting ? "Deleting..." : "Delete Listing"}
      </button>

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-listing-title"
          aria-describedby="delete-listing-description"
        >
          <div className="w-full max-w-md rounded-card border border-border bg-card p-4 shadow-card sm:p-6">
            <h2
              id="delete-listing-title"
              className="text-base font-bold text-text-primary sm:text-lg"
            >
              Delete this listing?
            </h2>
            <p
              id="delete-listing-description"
              className="mt-2 text-sm leading-relaxed text-text-secondary"
            >
              This will remove the listing from the marketplace for buyers.
              Please confirm that you want to delete it before continuing.
            </p>
            <p className="mt-3 rounded-input border border-danger/30 bg-red-50 px-3 py-2 text-xs font-medium text-danger">
              Warning: this action hides the listing immediately and cannot be
              undone from the current UI.
            </p>

            {errorMessage ? (
              <p className="mt-3 rounded-input border border-danger/30 bg-red-50 px-3 py-2 text-xs text-danger">
                {errorMessage}
              </p>
            ) : null}

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!isSubmitting) {
                    setIsModalOpen(false);
                    setErrorMessage(null);
                  }
                }}
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-button border border-border px-4 py-2.5 text-sm font-semibold text-text-primary transition hover:bg-surface sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleConfirmDelete();
                }}
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-button bg-danger px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-70 sm:w-auto"
              >
                {isSubmitting ? "Deleting..." : "Yes, delete listing"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
