import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
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
    const rows = await query<{ id: string }>(
      `UPDATE users
       SET is_active = TRUE
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    if (!rows[0]) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[PATCH /api/admin/users/[id]/activate] error:", err);
    return NextResponse.json(
      { error: "Failed to activate user." },
      { status: 500 }
    );
  }
}
