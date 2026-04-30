import { NextResponse } from "next/server";
import type { DatabaseError } from "pg";

import { requireSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { hasUserBlocked, userExists } from "@/lib/blocking";
import { userIdParamsSchema } from "@/lib/validators/users";

export const dynamic = "force-dynamic";

type BlockedUserRow = {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
};

function isUniqueViolation(error: unknown): boolean {
  const dbError = error as DatabaseError | undefined;
  return dbError?.code === "23505";
}

/**
 * POST /api/users/:id/block
 * Creates a directed block: authenticated user -> :id
 */
export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await requireSession();
    const rawParams = await context.params;
    const parsedParams = userIdParamsSchema.safeParse(rawParams);

    if (!parsedParams.success) {
      return NextResponse.json(
        { error: "Invalid user id.", details: parsedParams.error.format() },
        { status: 400 }
      );
    }

    const blockerId = session.userId;
    const blockedId = parsedParams.data.id;

    if (blockerId === blockedId) {
      return NextResponse.json({ error: "You cannot block yourself." }, { status: 400 });
    }

    const targetExists = await userExists(blockedId);
    if (!targetExists) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    try {
      const rows = await query<BlockedUserRow>(
        `
        INSERT INTO blocked_users (blocker_id, blocked_id)
        VALUES ($1, $2)
        RETURNING id, blocker_id, blocked_id, created_at
        `,
        [blockerId, blockedId]
      );

      return NextResponse.json(
        {
          block: {
            id: rows[0].id,
            blockerId: rows[0].blocker_id,
            blockedId: rows[0].blocked_id,
            createdAt: rows[0].created_at,
          },
        },
        { status: 201 }
      );
    } catch (error) {
      if (isUniqueViolation(error)) {
        return NextResponse.json({ error: "User is already blocked." }, { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthenticated") {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    console.error("[POST /api/users/:id/block]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

/**
 * GET /api/users/:id/block
 * Returns block status for authenticated user -> :id
 */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await requireSession();
    const rawParams = await context.params;
    const parsedParams = userIdParamsSchema.safeParse(rawParams);

    if (!parsedParams.success) {
      return NextResponse.json(
        { error: "Invalid user id.", details: parsedParams.error.format() },
        { status: 400 }
      );
    }

    const actorUserId = session.userId;
    const targetUserId = parsedParams.data.id;

    if (actorUserId === targetUserId) {
      return NextResponse.json({ error: "You cannot check block status for yourself." }, { status: 400 });
    }

    const targetExists = await userExists(targetUserId);
    if (!targetExists) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const isBlocked = await hasUserBlocked(actorUserId, targetUserId);

    return NextResponse.json(
      {
        blockerId: actorUserId,
        blockedId: targetUserId,
        isBlocked,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthenticated") {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    console.error("[GET /api/users/:id/block]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

/**
 * DELETE /api/users/:id/block
 * Removes a directed block: authenticated user -> :id
 */
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await requireSession();
    const rawParams = await context.params;
    const parsedParams = userIdParamsSchema.safeParse(rawParams);

    if (!parsedParams.success) {
      return NextResponse.json(
        { error: "Invalid user id.", details: parsedParams.error.format() },
        { status: 400 }
      );
    }

    const blockerId = session.userId;
    const blockedId = parsedParams.data.id;

    if (blockerId === blockedId) {
      return NextResponse.json({ error: "You cannot unblock yourself." }, { status: 400 });
    }

    const targetExists = await userExists(blockedId);
    if (!targetExists) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const rows = await query<BlockedUserRow>(
      `
      DELETE FROM blocked_users
      WHERE blocker_id = $1 AND blocked_id = $2
      RETURNING id, blocker_id, blocked_id, created_at
      `,
      [blockerId, blockedId]
    );

    if (!rows[0]) {
      return NextResponse.json({ error: "Block relationship not found." }, { status: 404 });
    }

    return NextResponse.json(
      {
        unblocked: {
          id: rows[0].id,
          blockerId: rows[0].blocker_id,
          blockedId: rows[0].blocked_id,
          createdAt: rows[0].created_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthenticated") {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    console.error("[DELETE /api/users/:id/block]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
