"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import ReviewForm from "@/components/sellers/ReviewForm";
import type { ReviewPrompt } from "@/app/api/users/me/review-prompts/route";

interface ReviewPromptModalProps {
  prompt: ReviewPrompt;
  onClose: () => void;
}

/**
 * ReviewPromptModal
 *
 * Full-screen overlay modal that prompts the buyer to review a seller
 * after a purchase. Traps focus inside the dialog and closes on Escape.
 */
export default function ReviewPromptModal({
  prompt,
  onClose,
}: ReviewPromptModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Trap focus inside the dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Move focus into the dialog on open
    closeButtonRef.current?.focus();

    function handleTab(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const focusable = dialog!.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, []);

  // Prevent body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="presentation"
      onClick={(e) => {
        // Close when clicking outside the dialog panel
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Dialog panel */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-prompt-title"
        className="relative w-full max-w-md bg-card rounded-card shadow-card-hover border border-border overflow-y-auto max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
          <div>
            <p
              id="review-prompt-title"
              className="text-base font-semibold text-text-primary"
            >
              How was your purchase?
            </p>
            <p className="text-sm text-text-secondary mt-0.5 line-clamp-1">
              {prompt.listingTitle}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Dismiss review prompt"
            className="ml-3 shrink-0 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary p-1 text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body — ReviewForm handles submission + success state */}
        <div className="p-5">
          <ReviewForm
            sellerId={prompt.sellerId}
            sellerName={prompt.sellerName}
            onSuccess={onClose}
          />
        </div>
      </div>
    </div>
  );
}
