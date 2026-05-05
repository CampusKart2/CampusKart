import { NextRequest, NextResponse } from "next/server";
import { ADMIN_EMAIL, getAdminSession } from "@/lib/admin";
import { query } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const admin = await getAdminSession(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const rows = await query<{ id: string; email: string }>(
      `UPDATE users
       SET is_active = FALSE
       WHERE id = $1
         AND email <> $2
       RETURNING id, email`,
      [id, ADMIN_EMAIL]
    );

    if (!rows[0]) {
      return NextResponse.json(
        { error: "User not found or cannot be deactivated." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[PATCH /api/admin/users/[id]/deactivate] error:", err);
    return NextResponse.json(
      { error: "Failed to deactivate user." },
      { status: 500 }
    );
  }
}
