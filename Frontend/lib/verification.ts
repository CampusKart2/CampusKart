/**
 * lib/verification.ts
 *
 * Shared helper for the email-verification token flow.
 * Accepts an already-open PoolClient so callers can include the token
 * insert inside the same transaction as the user insert — guaranteeing
 * the row and the token are always created together.
 *
 * Sending the email is intentionally done AFTER the transaction commits
 * so a send failure never rolls back a successfully created account.
 */

import { randomBytes } from "crypto";
import type { PoolClient } from "pg";
import { sendVerificationEmail } from "@/lib/email";

/**
 * Upsert a 24-hour verification token for `userId`.
 * Must be called inside an open transaction — the caller is responsible
 * for BEGIN / COMMIT / ROLLBACK.
 *
 * Returns the raw hex token string so the caller can pass it to
 * `sendVerificationEmail` after committing.
 */
export async function issueVerificationToken(
  client: PoolClient,
  userId: string
): Promise<string> {
  const token = randomBytes(32).toString("hex"); // 256-bit token, 64 hex chars

  // Replace any existing token for this user (handles the resend case too)
  await client.query(
    `DELETE FROM email_verification_tokens WHERE user_id = $1`,
    [userId]
  );
  await client.query(
    `INSERT INTO email_verification_tokens (token, user_id, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
    [token, userId]
  );

  return token;
}

/**
 * Convenience wrapper: issues a token in its own mini-transaction and
 * immediately sends the verification email.
 *
 * Use this when you are NOT sharing a transaction with a user insert
 * (e.g. the resend flow). For the registration flow use
 * `issueVerificationToken` directly inside the user-insert transaction.
 */
export async function issueAndSendVerificationEmail(
  client: PoolClient,
  userId: string,
  email: string
): Promise<void> {
  await client.query("BEGIN");
  let token: string;
  try {
    token = await issueVerificationToken(client, userId);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }
  // Send outside the transaction so a transient SMTP failure never
  // rolls back a successfully persisted token.
  await sendVerificationEmail(email, token);
}
