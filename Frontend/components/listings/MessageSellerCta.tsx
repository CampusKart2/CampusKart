"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";

interface MessageSellerCtaProps {
  sellerName: string;
  sellerId: string;
  listingId: string;
  listingTitle: string;
}

export default function MessageSellerCta({
  sellerName,
  sellerId,
  listingId,
  listingTitle,
}: MessageSellerCtaProps) {
  const toastId = useId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleMessageClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/messages/channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, sellerId, listingTitle, sellerName }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create channel");
      }

      router.push(`/messages/${encodeURIComponent(data.channelId)}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start conversation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleMessageClick}
        disabled={loading}
        className="w-full inline-flex items-center justify-center rounded-button bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-dark transition disabled:opacity-50"
        aria-describedby={error ? toastId : undefined}
      >
        {loading ? "Initializing Chat..." : `Message ${sellerName}`}
      </button>

      {error && (
        <div
          id={toastId}
          role="alert"
          aria-live="assertive"
          className="mt-2 text-sm text-error font-medium"
        >
          {error}
        </div>
      )}
    </div>
  );
}
