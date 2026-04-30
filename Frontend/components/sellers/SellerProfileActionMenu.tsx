"use client";

import { useState } from "react";
import { z } from "zod";

type SellerProfileActionMenuProps = {
  sellerId: string;
  sellerName: string;
  initialIsBlocked: boolean;
};

const blockStatusSchema = z.object({
  blockerId: z.string().uuid(),
  blockedId: z.string().uuid(),
  isBlocked: z.boolean(),
});

const blockMutationSchema = z.object({
  block: z
    .object({
      id: z.string().uuid(),
      blockerId: z.string().uuid(),
      blockedId: z.string().uuid(),
      createdAt: z.string(),
    })
    .optional(),
  unblocked: z
    .object({
      id: z.string().uuid(),
      blockerId: z.string().uuid(),
      blockedId: z.string().uuid(),
      createdAt: z.string(),
    })
    .optional(),
});

export default function SellerProfileActionMenu({
  sellerId,
  sellerName,
  initialIsBlocked,
}: SellerProfileActionMenuProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(initialIsBlocked);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const primaryLabel = isBlocked ? "Unblock user" : "Block user";
  const actionVerb = isBlocked ? "unblock" : "block";
  const confirmVerb = isBlocked ? "Unblock" : "Block";

  async function refreshBlockState(): Promise<void> {
    const response = await fetch(`/api/users/${encodeURIComponent(sellerId)}/block`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) return;
    const payload: unknown = await response.json();
    const parsed = blockStatusSchema.safeParse(payload);
    if (parsed.success) {
      setIsBlocked(parsed.data.isBlocked);
    }
  }

  async function handleConfirmAction(): Promise<void> {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/users/${encodeURIComponent(sellerId)}/block`, {
        method: isBlocked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const fallback = `Unable to ${actionVerb} this user right now.`;
        let message = fallback;
        try {
          const payload = (await response.json()) as { error?: string };
          if (typeof payload.error === "string" && payload.error.trim()) {
            message = payload.error;
          }
        } catch {
          // Keep fallback when response is not JSON.
        }
        setErrorMessage(message);
        await refreshBlockState();
        return;
      }

      const payload: unknown = await response.json();
      const parsed = blockMutationSchema.safeParse(payload);
      if (!parsed.success) {
        setErrorMessage("Unexpected response from server.");
        await refreshBlockState();
        return;
      }

      setIsBlocked((prev) => !prev);
      setIsConfirmOpen(false);
    } catch {
      setErrorMessage("Network error. Please try again.");
      await refreshBlockState();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full sm:w-auto shrink-0 flex justify-center sm:justify-end">
      <button
        type="button"
        onClick={() => {
          setIsConfirmOpen(true);
          setErrorMessage(null);
        }}
        className={[
          "inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center rounded-button border px-4 py-2.5 text-sm font-semibold transition",
          isBlocked
            ? "border-success/40 bg-green-50 text-success hover:bg-green-100"
            : "border-danger/40 bg-card text-danger hover:bg-red-50",
        ].join(" ")}
      >
        {primaryLabel}
      </button>

      {isConfirmOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="block-user-confirm-title"
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) {
              setIsConfirmOpen(false);
            }
          }}
        >
          <div className="w-full max-w-md rounded-card border border-border bg-card p-4 shadow-card sm:p-6">
            <h2 id="block-user-confirm-title" className="text-lg font-bold text-text-primary">
              Confirm {confirmVerb.toLowerCase()}
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              {isBlocked
                ? `Unblock ${sellerName}? You will be able to message this user again.`
                : `Block ${sellerName}? This prevents new messages between both of you.`}
            </p>

            {errorMessage ? (
              <p
                role="alert"
                className="mt-3 rounded-input border border-danger/30 bg-red-50 px-3 py-2 text-xs text-danger"
              >
                {errorMessage}
              </p>
            ) : null}

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isSubmitting}
                className="inline-flex min-h-[44px] items-center justify-center rounded-button border border-border px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-surface disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleConfirmAction();
                }}
                disabled={isSubmitting}
                className={[
                  "inline-flex min-h-[44px] items-center justify-center rounded-button px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60",
                  isBlocked ? "bg-success hover:bg-green-700" : "bg-danger hover:opacity-95",
                ].join(" ")}
              >
                {isSubmitting ? "Please wait..." : confirmVerb}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
