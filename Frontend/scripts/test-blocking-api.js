const crypto = require("crypto");

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value.trim();
}

function uuid() {
  return crypto.randomUUID();
}

async function requestJson({ method, url, cookie, body }) {
  const response = await fetch(url, {
    method,
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let json = null;
  try {
    json = await response.json();
  } catch {
    // Non-JSON response is fine for status-only checks.
  }

  return { status: response.status, json };
}

function assertStatus(label, actual, expected) {
  if (Array.isArray(expected)) {
    if (!expected.includes(actual)) {
      throw new Error(`${label}: expected one of [${expected.join(", ")}], got ${actual}`);
    }
    console.log(`PASS ${label}: ${actual}`);
    return;
  }

  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
  console.log(`PASS ${label}: ${actual}`);
}

async function main() {
  const baseUrl = (process.env.BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
  const actorSessionCookie = requireEnv("ACTOR_SESSION_COOKIE");
  const targetUserId = requireEnv("TARGET_USER_ID");
  const missingUserId = process.env.MISSING_USER_ID || "00000000-0000-0000-0000-000000000001";
  const listingId = process.env.LISTING_ID || uuid();
  const sellerId = process.env.SELLER_ID || targetUserId;

  const blockUrl = `${baseUrl}/api/users/${targetUserId}/block`;
  const missingBlockUrl = `${baseUrl}/api/users/${missingUserId}/block`;
  const invalidBlockUrl = `${baseUrl}/api/users/not-a-uuid/block`;
  const messagesChannelUrl = `${baseUrl}/api/messages/channel`;

  console.log("Running blocking API checks...");
  console.log(`BASE_URL=${baseUrl}`);

  const unauthenticatedBlock = await requestJson({
    method: "POST",
    url: blockUrl,
  });
  assertStatus("POST /api/users/:id/block without auth", unauthenticatedBlock.status, 401);

  const invalidIdBlock = await requestJson({
    method: "POST",
    url: invalidBlockUrl,
    cookie: actorSessionCookie,
  });
  assertStatus("POST /api/users/:id/block invalid id", invalidIdBlock.status, 400);

  const missingUserBlock = await requestJson({
    method: "POST",
    url: missingBlockUrl,
    cookie: actorSessionCookie,
  });
  assertStatus("POST /api/users/:id/block missing user", missingUserBlock.status, 404);

  const firstBlock = await requestJson({
    method: "POST",
    url: blockUrl,
    cookie: actorSessionCookie,
  });
  assertStatus("POST /api/users/:id/block create", firstBlock.status, [201, 409]);

  const duplicateBlock = await requestJson({
    method: "POST",
    url: blockUrl,
    cookie: actorSessionCookie,
  });
  assertStatus("POST /api/users/:id/block duplicate", duplicateBlock.status, 409);

  const blockedMessageCreate = await requestJson({
    method: "POST",
    url: messagesChannelUrl,
    cookie: actorSessionCookie,
    body: { listingId, sellerId },
  });
  assertStatus("POST /api/messages/channel while blocked", blockedMessageCreate.status, 403);

  const unblock = await requestJson({
    method: "DELETE",
    url: blockUrl,
    cookie: actorSessionCookie,
  });
  assertStatus("DELETE /api/users/:id/block existing", unblock.status, 200);

  const duplicateUnblock = await requestJson({
    method: "DELETE",
    url: blockUrl,
    cookie: actorSessionCookie,
  });
  assertStatus("DELETE /api/users/:id/block missing relation", duplicateUnblock.status, 404);

  const restoredMessaging = await requestJson({
    method: "POST",
    url: messagesChannelUrl,
    cookie: actorSessionCookie,
    body: { listingId, sellerId },
  });
  assertStatus(
    "POST /api/messages/channel after unblock",
    restoredMessaging.status,
    [201, 409]
  );

  console.log("All blocking checks passed.");
}

main().catch((error) => {
  console.error("Blocking API checks failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
