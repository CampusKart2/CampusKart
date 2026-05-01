"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import ReviewPromptModal from "@/components/sellers/ReviewPromptModal";
import type { ReviewPrompt } from "@/app/api/users/me/review-prompts/route";

// ---------------------------------------------------------------------------
// Zod schema to validate the API response shape
// ---------------------------------------------------------------------------
const reviewPromptSchema = z.object({
  listingId: z.string().uuid(),
  listingTitle: z.string(),
  sellerId: z.string().uuid(),
  sellerName: z.string(),
  sellerAvatarUrl: z.string().nullable(),
  soldAt: z.string(),
});

const reviewPromptsResponseSchema = z.object({
  prompts: z.array(reviewPromptSchema),
});

/** localStorage key that stores an array of listing IDs the user has dismissed. */
const DISMISSED_KEY = "campuskart:dismissed_review_prompts";

function getDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return new Set(parsed as string[]);
  } catch {
    // Silently ignore parse errors
  }
  return new Set();
}

function addDismissed(listingId: string): void {
  try {
    const current = getDismissed();
    current.add(listingId);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...current]));
  } catch {
    // localStorage may be unavailable in private browsing — degrade gracefully
  }
}

/**
 * ReviewPromptChecker
 *
 * Rendered inside the root layout for authenticated users.
 * On mount it calls GET /api/users/me/review-prompts and shows a modal for
 * the first prompt that is:
 *  - ≥ 24 h after the listing was sold (enforced server-side)
 *  - not already dismissed by the user (tracked in localStorage)
 *
 * One prompt is shown per page load. After the user submits or dismisses, the
 * listing ID is added to the localStorage dismiss-list so it won't re-appear.
 */
export default function ReviewPromptChecker() {
  const [activePrompt, setActivePrompt] = useState<ReviewPrompt | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPrompts() {
      try {
        const res = await fetch("/api/users/me/review-prompts", {
          // No-store so we always get the freshest data on each page load
          cache: "no-store",
        });
        if (!res.ok) return;

        const json: unknown = await res.json();
        const parsed = reviewPromptsResponseSchema.safeParse(json);
        if (!parsed.success) return;

        const dismissed = getDismissed();

        // Pick the first prompt the user hasn't dismissed yet
        const pending = parsed.data.prompts.find(
          (p) => !dismissed.has(p.listingId)
        );

        if (!cancelled && pending) {
          setActivePrompt(pending);
        }
      } catch {
        // Network error — fail silently; the review can always be left manually
      }
    }

    void fetchPrompts();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!activePrompt) return null;

  function handleClose() {
    if (activePrompt) addDismissed(activePrompt.listingId);
    setActivePrompt(null);
  }

  return <ReviewPromptModal prompt={activePrompt} onClose={handleClose} />;
}
