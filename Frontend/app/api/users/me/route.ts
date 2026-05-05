import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth";
import { query } from "@/lib/db";

type UserProfileRow = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  average_rating: string;
  rating_count: number;
  created_at: string;
};

const updateMeBodySchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters.")
      .max(100, "Full name must be 100 characters or fewer.")
      .optional(),
    avatar_url: z.preprocess(
      (value) => (value === "" ? null : value),
      z
        .string()
        .trim()
        .url("Avatar URL must be a valid URL.")
        .max(2048, "Avatar URL must be 2048 characters or fewer.")
        .nullable()
        .optional()
    ),
  })
  .strict()
  .refine(
    (value) => value.full_name !== undefined || value.avatar_url !== undefined,
    "At least one profile field is required."
  );

function toApiUser(row: UserProfileRow) {
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    avatar_url: row.avatar_url,
    average_rating: Number(row.average_rating),
    rating_count: row.rating_count,
    created_at: row.created_at,
  };
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const parsed = updateMeBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        fields: parsed.error.issues.map((issue) => ({
          field: issue.path[0] ?? "body",
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const currentRows = await query<UserProfileRow>(
    `
    SELECT id, full_name, email, avatar_url, average_rating, rating_count, created_at
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [session.userId]
  );

  const currentUser = currentRows[0];
  if (!currentUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const nextFullName = parsed.data.full_name ?? currentUser.full_name;
  const nextAvatarUrl =
    parsed.data.avatar_url === undefined
      ? currentUser.avatar_url
      : parsed.data.avatar_url;

  const updatedRows = await query<UserProfileRow>(
    `
    UPDATE users
    SET full_name = $1,
        avatar_url = $2
    WHERE id = $3
    RETURNING id, full_name, email, avatar_url, average_rating, rating_count, created_at
    `,
    [nextFullName, nextAvatarUrl, session.userId]
  );

  const updatedUser = updatedRows[0];
  if (!updatedUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ user: toApiUser(updatedUser) }, { status: 200 });
}
