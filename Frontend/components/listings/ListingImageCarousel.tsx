"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

interface ListingImageCarouselProps {
  /** Ordered image URLs. Empty/invalid entries are ignored. */
  images: readonly (string | null | undefined)[];
  /** Used as alt text and for placeholder state. */
  title: string;
}

export default function ListingImageCarousel({
  images,
  title,
}: ListingImageCarouselProps) {
  const cleaned = useMemo(
    () => images.filter((u): u is string => typeof u === "string" && u.length > 0),
    [images]
  );

  const [index, setIndex] = useState(0);
  const count = cleaned.length;

  const canCycle = count > 1;
  const safeIndex = count === 0 ? 0 : Math.min(index, count - 1);
  const src = cleaned[safeIndex] ?? null;

  const prev = () => {
    if (!canCycle) return;
    setIndex((i) => (i - 1 + count) % count);
  };
  const next = () => {
    if (!canCycle) return;
    setIndex((i) => (i + 1) % count);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-card bg-surface border border-border">
      <div className="relative aspect-video w-full bg-surface">
        {src ? (
          <Image
            src={src}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 720px"
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-sm text-text-muted">No image available</div>
          </div>
        )}
      </div>

      {/* Controls */}
      {canCycle && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-card/90 backdrop-blur border border-border px-3 py-2 text-sm font-semibold text-text-primary hover:bg-card transition"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next image"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-card/90 backdrop-blur border border-border px-3 py-2 text-sm font-semibold text-text-primary hover:bg-card transition"
          >
            ›
          </button>

          {/* Dots */}
          <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5">
            {cleaned.map((_u, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to image ${i + 1}`}
                aria-current={i === safeIndex}
                className={[
                  "h-2.5 w-2.5 rounded-full border transition",
                  i === safeIndex
                    ? "bg-primary border-primary"
                    : "bg-card/80 border-border hover:bg-card",
                ].join(" ")}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

