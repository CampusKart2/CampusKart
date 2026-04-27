import { NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { createReportBodySchema } from "@/lib/validators/reports";
import type { ReportReason } from "@/lib/types/report";
import { sendReportThresholdAlert } from "@/lib/email";

// How many reports on a single listing trigger the admin alert.
// Defined here so it appears in one place and can be referenced in tests.
const REPORT_ALERT_THRESHOLD = 3;

const paramsSchema = z.object({
  id: z.string().uuid("Listing id must be a valid UUID."),
});

// ── DB row shapes ──────────────────────────────────────────────────────────────

type DbListingOwnerRow = {
  seller_id: string;
  status: "active" | "sold" | "deleted";
};

type DbReportRow = {
  id: string;
  listing_id: string;
  reporter_id: string | null;
  reason: ReportReason;
  notes: string | null;
  created_at: string;
};

/**
 * Returned by the post-insert threshold CTE.
 *
 * `flagged_id` and `flagged_title` are non-null only when this specific INSERT
 * caused the listing to cross the report threshold for the first time —
 * i.e., report_alert_sent_at was NULL and is now set.  They are null on every
 * subsequent report so the email is never sent twice.
 */
type DbThresholdRow = {
  report_count: number;
  flagged_id: string | null;
  flagged_title: string | null;
};

// ── Narrow pg driver errors so we can inspect the error code without `any` ────

interface PgError {
  code: string;
  constraint?: string;
}

function isPgError(err: unknown): err is PgError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as Record<string, unknown>).code === "string"
  );
}

// PostgreSQL error code for a UNIQUE constraint violation.
const PG_UNIQUE_VIOLATION = "23505";

/**
 * POST /api/listings/:id/report
 *
 * Files a policy-violation report against a listing.  After a successful
 * insert, atomically checks whether the report count has reached
 * REPORT_ALERT_THRESHOLD and, if so, sets `listings.report_alert_sent_at`
 * and fires an admin email.  The flag guarantees the email is sent exactly
 * once per listing regardless of concurrent reporters.
 *
 * HTTP status codes:
 *   201 – report filed successfully
 *   400 – invalid UUID param or body validation failure
 *   401 – not authenticated
 *   403 – email not verified, or attempting to report own listing
 *   404 – listing not found or soft-deleted
 *   409 – reporter has already filed a report on this listing
 *   500 – unexpected server error
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // ── 1. Auth ────────────────────────────────────────────────────────────────
  let session: Awaited<ReturnType<typeof requireSession>>;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  // The middleware guards /api/listings/* at the edge, but we re-check here so
  // the error message is actionable rather than a generic 401/403.
  if (!session.emailVerified) {
    return NextResponse.json(
      { error: "Email verification is required to report listings." },
      { status: 403 }
    );
  }

  // ── 2. Validate route param ────────────────────────────────────────────────
  const rawParams = await context.params;
  const paramsParsed = paramsSchema.safeParse(rawParams);
  if (!paramsParsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        fields: paramsParsed.error.issues.map((issue) => ({
          field: issue.path[0] ?? "unknown",
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }
  const { id: listingId } = paramsParsed.data;

  // ── 3. Validate request body ───────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const bodyParsed = createReportBodySchema.safeParse(body);
  if (!bodyParsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        fields: bodyParsed.error.issues.map((issue) => ({
          field: issue.path[0] ?? "unknown",
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }
  const { reason, notes } = bodyParsed.data;

  // ── 4. DB: verify listing → guard self-report → insert → threshold gate ───
  const client = await pool.connect();
  let thresholdRow: DbThresholdRow | undefined;
  let insertedReport: DbReportRow | undefined;

  try {
    await client.query("BEGIN");

    // FOR UPDATE (not FOR SHARE) serialises concurrent reporters through the
    // listing row lock, which prevents two simultaneous transactions from both
    // seeing the threshold-crossing count and both trying to set the flag.
    const listingResult = await client.query<DbListingOwnerRow>(
      `SELECT seller_id, status FROM listings WHERE id = $1 LIMIT 1 FOR UPDATE`,
      [listingId]
    );

    const listing = listingResult.rows[0];

    // Treat soft-deleted listings the same as missing ones — reporters should
    // not be able to infer whether a listing existed before it was removed.
    if (!listing || listing.status === "deleted") {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Listing not found." },
        { status: 404 }
      );
    }

    if (listing.seller_id === session.userId) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "You cannot report your own listing." },
        { status: 403 }
      );
    }

    // Insert the new report.
    const insertResult = await client.query<DbReportRow>(
      `
      INSERT INTO reports (listing_id, reporter_id, reason, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING id, listing_id, reporter_id, reason, notes, created_at
      `,
      [listingId, session.userId, reason, notes ?? null]
    );
    insertedReport = insertResult.rows[0];

    // ── Threshold gate ────────────────────────────────────────────────────────
    //
    // The CTE does two things atomically within this transaction:
    //   1. Counts all reports for this listing (including the one just inserted).
    //   2. Sets report_alert_sent_at on the listing IF the count >= threshold
    //      AND the flag has not been set before (IS NULL).
    //
    // The UPDATE returns a row only when it actually modified something, i.e.
    // only on the exact insert that crosses the threshold.  Every subsequent
    // report finds report_alert_sent_at already set, so the UPDATE hits zero
    // rows and the email is never sent again.
    //
    // Because we hold a FOR UPDATE lock on the listing row, concurrent reporters
    // are queued behind this transaction.  The second reporter will commit after
    // us and see report_alert_sent_at already populated.
    const thresholdResult = await client.query<DbThresholdRow>(
      `
      WITH report_count AS (
        SELECT COUNT(*)::int AS total
        FROM   reports
        WHERE  listing_id = $1
      ),
      flagged AS (
        UPDATE listings
        SET    report_alert_sent_at = NOW()
        FROM   report_count
        WHERE  listings.id          = $1
          AND  report_count.total  >= $2
          AND  listings.report_alert_sent_at IS NULL
        RETURNING listings.id AS flagged_id, listings.title AS flagged_title
      )
      SELECT
        report_count.total  AS report_count,
        flagged.flagged_id  AS flagged_id,
        flagged.flagged_title AS flagged_title
      FROM  report_count
      LEFT  JOIN flagged ON true
      `,
      [listingId, REPORT_ALERT_THRESHOLD]
    );
    thresholdRow = thresholdResult.rows[0];

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");

    // UNIQUE constraint uq_reports_listing_reporter fires when the same user
    // tries to report the same listing a second time.
    if (isPgError(err) && err.code === PG_UNIQUE_VIOLATION) {
      return NextResponse.json(
        { error: "You have already reported this listing." },
        { status: 409 }
      );
    }

    console.error("[POST /api/listings/:id/report] DB error:", err);
    return NextResponse.json(
      { error: "Failed to submit report. Please try again." },
      { status: 500 }
    );
  } finally {
    client.release();
  }

  // ── 5. Fire admin alert after commit ──────────────────────────────────────
  //
  // We send the email AFTER the transaction commits so that:
  //   a) A rollback can never produce a false-alarm alert.
  //   b) The 201 response is returned promptly while the email goes out.
  //
  // If the send fails we log the error but do not surface it to the reporter —
  // the report is already durably stored and the flag is set, so the data
  // is correct even if the SMTP call fails.
  if (thresholdRow?.flagged_id != null) {
    const adminEmail = process.env.ADMIN_REPORT_EMAIL?.trim();

    if (!adminEmail) {
      console.error(
        "[POST /api/listings/:id/report] ADMIN_REPORT_EMAIL is not set — " +
          "report threshold crossed but alert email was not sent. " +
          `Listing: ${thresholdRow.flagged_id}`
      );
    } else {
      sendReportThresholdAlert({
        adminEmail,
        listingId: thresholdRow.flagged_id,
        listingTitle: thresholdRow.flagged_title ?? "Unknown listing",
        reportCount: thresholdRow.report_count,
      }).catch((err: unknown) => {
        // Non-fatal — the flag is already set in the DB so no duplicate will
        // be sent on the next report.  The SMTP failure should be monitored.
        console.error(
          "[POST /api/listings/:id/report] Failed to send report threshold alert:",
          err
        );
      });
    }
  }

  // ── 6. Respond ────────────────────────────────────────────────────────────
  const report = insertedReport!;
  return NextResponse.json(
    {
      report: {
        id: report.id,
        listing_id: report.listing_id,
        reporter_id: report.reporter_id,
        reason: report.reason,
        notes: report.notes,
        created_at: report.created_at,
      },
    },
    { status: 201 }
  );
}
