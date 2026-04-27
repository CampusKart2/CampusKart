-- Migration: 0011_add_current_report_reason_values
--
-- Keeps the report_reason enum aligned with the values currently used by the
-- production database and report listing UI. Existing enum labels are not
-- removed so older reports remain readable.

ALTER TYPE report_reason ADD VALUE IF NOT EXISTS 'Prohibited item';
ALTER TYPE report_reason ADD VALUE IF NOT EXISTS 'Spam or scam';
ALTER TYPE report_reason ADD VALUE IF NOT EXISTS 'Offensive content';
ALTER TYPE report_reason ADD VALUE IF NOT EXISTS 'Wrong category';
ALTER TYPE report_reason ADD VALUE IF NOT EXISTS 'Already sold';
ALTER TYPE report_reason ADD VALUE IF NOT EXISTS 'Other';
