import { query } from "@/lib/db";

type ExistsRow = {
  exists: boolean;
};

export async function userExists(userId: string): Promise<boolean> {
  const rows = await query<ExistsRow>(
    "SELECT EXISTS(SELECT 1 FROM users WHERE id = $1) AS exists",
    [userId]
  );
  return rows[0]?.exists ?? false;
}

/**
 * Returns true when either user has blocked the other.
 * We treat blocks as bidirectional for messaging permissions.
 */
export async function hasBlockingRelation(
  userAId: string,
  userBId: string
): Promise<boolean> {
  const rows = await query<ExistsRow>(
    `
    SELECT EXISTS(
      SELECT 1
      FROM blocked_users
      WHERE (blocker_id = $1 AND blocked_id = $2)
         OR (blocker_id = $2 AND blocked_id = $1)
    ) AS exists
    `,
    [userAId, userBId]
  );
  return rows[0]?.exists ?? false;
}

/**
 * Returns true if blockerId has directly blocked blockedId.
 */
export async function hasUserBlocked(
  blockerId: string,
  blockedId: string
): Promise<boolean> {
  const rows = await query<ExistsRow>(
    `
    SELECT EXISTS(
      SELECT 1
      FROM blocked_users
      WHERE blocker_id = $1 AND blocked_id = $2
    ) AS exists
    `,
    [blockerId, blockedId]
  );
  return rows[0]?.exists ?? false;
}
