export const REPORT_REASONS = [
  "Prohibited item",
  "Spam or scam",
  "Offensive content",
  "Wrong category",
  "Already sold",
  "Other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  "Prohibited item": "Prohibited Item",
  "Spam or scam": "Spam or Scam",
  "Offensive content": "Offensive Content",
  "Wrong category": "Wrong Category",
  "Already sold": "Already Sold",
  Other: "Other",
};
