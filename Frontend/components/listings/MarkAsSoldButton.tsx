"use client";

import { useState } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";

import type { ListingStatus } from "@/lib/types/listing";

const soldResponseSchema = z.object({
  listing: z.object({
    id: z.string().uuid(),
    status: z.literal("sold"),
  }),
});

type MarkAsSoldButtonProps = {
  listingId: string;
  initialStatus?: ListingStatus;
};

export default function MarkAsSoldButton({
  listingId,
  initialStatus,
}: MarkAsSoldButtonProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<ListingStatus>(
    initialStatus ?? "active"
  );

  const isSold = status === "sold";

  async function handleConfirmMarkSold(): Promise<void> {
    if (isSubmitting || isSold) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/listings/${encodeURIComponent(listingId)}/sold`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const fallback = "Unable to mark this listing as sold right now.";
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
      const parsed = soldResponseSchema.safeParse(payload);
      if (!parsed.success) {
        setErrorMessage("Received an unexpected response from the server.");
        return;
      }

      setStatus(parsed.data.listing.status);
      setIsModalOpen(false);
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
          if (!isSold) setIsModalOpen(true);
        }}
        disabled={isSubmitting || isSold}
        className={[
          "inline-flex w-full items-center justify-center rounded-button px-4 py-2.5 text-sm font-semibold transition sm:w-fit",
          isSold
            ? "cursor-not-allowed border border-border bg-surface text-text-muted"
            : "border border-danger bg-card text-danger hover:bg-red-50 disabled:opacity-60",
        ].join(" ")}
      >
        {isSold ? "Sold" : "Mark as Sold"}
      </button>

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mark-sold-title"
        >
          <div className="w-full max-w-md rounded-card border border-border bg-card p-4 shadow-card sm:p-6">
            <h2
              id="mark-sold-title"
              className="text-base font-bold text-text-primary sm:text-lg"
            >
              Mark this item as sold?
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              This will update the listing status to sold and hide buyer actions
              for this item.
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
                  void handleConfirmMarkSold();
                }}
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-button bg-danger px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-70 sm:w-auto"
              >
                {isSubmitting ? "Marking..." : "Yes, mark as sold"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
