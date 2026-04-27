import { z } from "zod";
import { REPORT_REASONS } from "@/lib/types/report";
import type { ReportReason } from "@/lib/types/report";

export { REPORT_REASONS, type ReportReason };

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
