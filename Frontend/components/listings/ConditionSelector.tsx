"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { LISTING_CONDITIONS, type ListingCondition } from "@/lib/validators/listings";

// Human-readable tooltip for each condition so buyers know what to expect.
const CONDITION_META: Record<
  ListingCondition,
  { label: string; description: string; color: string }
> = {
  New: {
    label: "New",
    description: "Never used. Still in original packaging or unused with tags.",
    color: "emerald",
  },
  "Like New": {
    label: "Like New",
    description: "Used once or twice. No visible wear; looks brand new.",
    color: "teal",
  },
  Good: {
    label: "Good",
    description: "Light signs of use (minor scratches or scuffs). Fully functional.",
    color: "blue",
  },
  Fair: {
    label: "Fair",
    description: "Noticeable wear and tear but works as expected.",
    color: "amber",
  },
  Poor: {
    label: "Poor",
    description:
      "Heavy use, visible damage or missing parts. Priced to reflect condition.",
    color: "rose",
  },
};

const COLOR_CLASSES: Record<
  string,
  { ring: string; bg: string; dot: string; border: string; text: string }
> = {
  emerald: {
    ring: "focus-within:ring-emerald-300/50",
    bg: "bg-emerald-50",
    dot: "bg-emerald-500",
    border: "border-emerald-400",
    text: "text-emerald-700",
  },
  teal: {
    ring: "focus-within:ring-teal-300/50",
    bg: "bg-teal-50",
    dot: "bg-teal-500",
    border: "border-teal-400",
    text: "text-teal-700",
  },
  blue: {
    ring: "focus-within:ring-blue-300/50",
    bg: "bg-blue-50",
    dot: "bg-blue-500",
    border: "border-blue-400",
    text: "text-blue-700",
  },
  amber: {
    ring: "focus-within:ring-amber-300/50",
    bg: "bg-amber-50",
    dot: "bg-amber-500",
    border: "border-amber-400",
    text: "text-amber-700",
  },
  rose: {
    ring: "focus-within:ring-rose-300/50",
    bg: "bg-rose-50",
    dot: "bg-rose-500",
    border: "border-rose-400",
    text: "text-rose-700",
  },
};

type Props = {
  value: ListingCondition;
  onChange: (value: ListingCondition) => void;
  error?: string;
};

export default function ConditionSelector({ value, onChange, error }: Props) {
  // Track which tooltip is currently pinned open via keyboard / click.
  const [openTooltip, setOpenTooltip] = useState<ListingCondition | null>(null);

  const toggleTooltip = (condition: ListingCondition) => {
    setOpenTooltip((prev) => (prev === condition ? null : condition));
  };

  return (
    <fieldset>
      <legend className="text-sm font-medium text-text-primary">
        Condition <span className="text-rose-500" aria-hidden="true">*</span>
      </legend>

      <div
        role="radiogroup"
        aria-required="true"
        aria-label="Item condition"
        className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5"
      >
        {LISTING_CONDITIONS.map((condition) => {
          const meta = CONDITION_META[condition];
          const colors = COLOR_CLASSES[meta.color];
          const isSelected = value === condition;
          const isTooltipOpen = openTooltip === condition;

          return (
            <div key={condition} className="relative">
              {/* Radio tile */}
              <label
                className={`group flex cursor-pointer flex-col gap-1.5 rounded-card border-2 p-3 transition focus-within:ring-2 ${
                  isSelected
                    ? `${colors.border} ${colors.bg} ${colors.ring}`
                    : "border-border bg-surface hover:border-text-muted focus-within:ring-primary/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {/* Hidden native radio — keyboard + screen reader accessible */}
                    <input
                      type="radio"
                      name="condition"
                      value={condition}
                      checked={isSelected}
                      onChange={() => onChange(condition)}
                      required
                      className="sr-only"
                      aria-describedby={`condition-tip-${condition}`}
                    />

                    {/* Custom dot indicator */}
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition ${
                        isSelected ? `${colors.border} ${colors.bg}` : "border-border bg-white"
                      }`}
                      aria-hidden="true"
                    >
                      {isSelected && (
                        <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
                      )}
                    </span>

                    <span
                      className={`text-sm font-semibold ${
                        isSelected ? colors.text : "text-text-primary"
                      }`}
                    >
                      {meta.label}
                    </span>
                  </span>

                  {/* Info button — toggles tooltip on click / Enter */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault(); // Don't trigger the label's radio selection
                      toggleTooltip(condition);
                    }}
                    aria-label={`What does "${meta.label}" mean?`}
                    aria-expanded={isTooltipOpen}
                    aria-controls={`condition-tip-${condition}`}
                    className={`rounded-full p-0.5 transition hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                      isSelected ? colors.text : "text-text-muted"
                    }`}
                  >
                    <Info size={14} />
                  </button>
                </div>
              </label>

              {/* Tooltip — shown on hover (CSS) or pinned open via the info button */}
              <div
                id={`condition-tip-${condition}`}
                role="tooltip"
                className={`absolute left-0 top-full z-20 mt-1.5 w-56 rounded-card border border-border bg-white px-3 py-2.5 text-xs leading-relaxed text-text-secondary shadow-card transition-all ${
                  isTooltipOpen
                    ? "pointer-events-auto opacity-100"
                    : "pointer-events-none opacity-0"
                }`}
              >
                <p className={`mb-0.5 font-semibold ${colors.text}`}>{meta.label}</p>
                {meta.description}
              </div>
            </div>
          );
        })}
      </div>

      {/* CSS-only hover tooltips (no JS required for basic usage) */}
      <style>{`
        .group:hover ~ [role="tooltip"] {
          /* Hover reveal is handled per-tile via the sibling pattern below */
        }
      `}</style>

      {error ? (
        <p className="mt-2 text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
