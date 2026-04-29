import { NextRequest, NextResponse } from "next/server";

import { requireSession } from "@/lib/auth";
import { pool } from "@/lib/db";
import {
  notificationsListResponseSchema,
  notificationsQuerySchema,
} from "@/lib/validators/notifications";

export const dynamic = "force-dynamic";

type DbRow = {
  id: string;
  sender_display_name: string;
  snippet: string;
  created_at: string;
  channel_type: string;
  channel_id: string;
};

type PgError = Error & { code?: string };

function isUndefinedTableError(error: unknown): error is PgError {
  return error instanceof Error && (error as PgError).code === "42P01";
}

/**
 * GET /api/notifications?limit=10
 *
 * Returns the most recent message-notification rows for the signed-in user
 * (same Stream user id as `users.id`). Requires verified email so it aligns
 * with chat onboarding.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireSession();
    if (!session.emailVerified) {
      return NextResponse.json(
        { error: "Email verification required." },
        { status: 401 }
      );
    }

    const raw = {
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    };
    const parsedQuery = notificationsQuerySchema.safeParse(raw);
    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          error: "Validation failed.",
          fields: parsedQuery.error.issues.map((issue) => ({
            field: issue.path[0] ?? "unknown",
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const { limit } = parsedQuery.data;

    let rows: DbRow[];
    try {
      const result = await pool.query<DbRow>(
        `SELECT id, sender_display_name, snippet, created_at, channel_type, channel_id
         FROM message_notification_feed
         WHERE recipient_user_id = $1::uuid
         ORDER BY created_at DESC
         LIMIT $2`,
        [session.userId, limit]
      );
      rows = result.rows;
    } catch (error) {
      if (isUndefinedTableError(error)) {
        const body = notificationsListResponseSchema.parse({ notifications: [] });
        return NextResponse.json(body, { status: 200 });
      }
      throw error;
    }

    const notifications = rows.map((row) => ({
      id: row.id,
      senderName: row.sender_display_name,
      snippet: row.snippet,
      createdAt: row.created_at,
      channelCid: `${row.channel_type}:${row.channel_id}`,
    }));

    const body = notificationsListResponseSchema.parse({ notifications });

    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthenticated") {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }
    console.error("[GET /api/notifications]", error);
    return NextResponse.json(
      { error: "Failed to load notifications." },
      { status: 500 }
    );
  }
}
