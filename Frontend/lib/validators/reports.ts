import { z } from "zod";

/** Must stay in sync with the report_reason enum in 0009_create_reports_table.sql. */
export const REPORT_REASONS = [
  "prohibited_item",
  "scam_or_fraud",
  "misleading_info",
  "wrong_price",
  "spam",
  "other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export const createReportBodySchema = z.object({
  reason: z.enum(REPORT_REASONS, {
    error: `Reason must be one of: ${REPORT_REASONS.join(", ")}.`,
  }),
  /** Optional free-text elaboration; required when reason is "other". */
  notes: z
    .string()
    .trim()
    .max(500, "Notes must be at most 500 characters.")
    .optional(),
});

export type CreateReportBodyInput = z.infer<typeof createReportBodySchema>;
