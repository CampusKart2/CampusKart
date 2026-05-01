"use client";

import { useState, useCallback, useId } from "react";
import { Star } from "lucide-react";

interface StarRatingInputProps {
  /** Current selected value (1–5). Pass 0 for no selection. */
  value: number;
  onChange: (rating: number) => void;
  /** Disables all interaction (e.g. while submitting). */
  disabled?: boolean;
}

const LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very good",
  5: "Excellent",
};

/**
 * Interactive 1–5 star rating picker.
 *
 * Accessibility:
 *  - Uses a `<fieldset>` + `<legend>` with a visually-hidden label.
 *  - Each star is a `<button role="radio">` with `aria-checked` so screen
 *    readers announce the current selection.
 *  - Keyboard: Tab to focus the group, then Arrow Left/Right or 1–5 keys.
 *    Enter/Space confirms the focused star.
 */
export default function StarRatingInput({
  value,
  onChange,
  disabled = false,
}: StarRatingInputProps) {
  // Track which star the user is hovering over (visual preview only).
  const [hovered, setHovered] = useState<number>(0);
  const groupId = useId();

  const displayed = hovered > 0 ? hovered : value;

  const handleKey = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, star: number) => {
      if (disabled) return;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault();
        const next = Math.min(5, star + 1);
        onChange(next);
        // Move DOM focus to the next star button
        const btn = document.getElementById(`${groupId}-star-${next}`);
        btn?.focus();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        const prev = Math.max(1, star - 1);
        onChange(prev);
        const btn = document.getElementById(`${groupId}-star-${prev}`);
        btn?.focus();
      } else if (e.key >= "1" && e.key <= "5") {
        // Direct digit shortcut
        e.preventDefault();
        const chosen = Number(e.key);
        onChange(chosen);
        const btn = document.getElementById(`${groupId}-star-${chosen}`);
        btn?.focus();
      }
    },
    [disabled, groupId, onChange]
  );

  return (
    <fieldset className="border-none p-0 m-0">
      {/* Visually hidden legend keeps the group labelled for screen readers */}
      <legend className="sr-only">Star rating</legend>

      <div
        className="flex items-center gap-1"
        onMouseLeave={() => setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayed;
          const isSelected = star === value;

          return (
            <button
              key={star}
              id={`${groupId}-star-${star}`}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${star} star${star > 1 ? "s" : ""} – ${LABELS[star]}`}
              disabled={disabled}
              // Tab stops only on the currently selected star (or star 1 when nothing selected).
              // Arrow keys move focus within the group.
              tabIndex={value === star || (value === 0 && star === 1) ? 0 : -1}
              className={[
                "rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                "transition-transform active:scale-90",
                disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
              ].join(" ")}
              onMouseEnter={() => !disabled && setHovered(star)}
              onClick={() => !disabled && onChange(star)}
              onKeyDown={(e) => handleKey(e, star)}
            >
              <Star
                className={[
                  "w-8 h-8 sm:w-9 sm:h-9 transition-colors",
                  isFilled
                    ? "fill-amber-400 text-amber-400"
                    : "fill-none text-border",
                ].join(" ")}
                strokeWidth={isFilled ? 0 : 1.5}
                aria-hidden="true"
              />
            </button>
          );
        })}

        {/* Visible label for the current selection */}
        <span
          className="ml-2 text-sm font-medium text-text-secondary min-w-[5rem]"
          aria-live="polite"
          aria-atomic="true"
        >
          {displayed > 0 ? LABELS[displayed] : ""}
        </span>
      </div>
    </fieldset>
  );
}
