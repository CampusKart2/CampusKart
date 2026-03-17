"use client";

import { useEffect, useId, useState } from "react";

interface MessageSellerCtaProps {
  sellerName: string;
}

export default function MessageSellerCta({ sellerName }: MessageSellerCtaProps) {
  const toastId = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => setOpen(false), 2200);
    return () => window.clearTimeout(t);
  }, [open]);

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full inline-flex items-center justify-center rounded-button bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-dark transition"
        aria-describedby={open ? toastId : undefined}
      >
        Message Seller
        <span className="ml-2 inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold">
          Coming soon
        </span>
      </button>

      {/* Lightweight toast (Sprint 1 placeholder until chat ships) */}
      {open && (
        <div
          id={toastId}
          role="status"
          aria-live="polite"
          className="fixed left-1/2 bottom-5 z-50 -translate-x-1/2 max-w-[92vw] rounded-card border border-border bg-card px-4 py-2 shadow-card"
        >
          <div className="text-sm font-semibold text-text-primary">
            Coming Soon
          </div>
          <div className="text-xs text-text-muted">
            Messaging {sellerName} will be available in Sprint 3.
          </div>
        </div>
      )}
    </div>
  );
}

