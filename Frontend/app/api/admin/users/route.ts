import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { query } from "@/lib/db";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const admin = await getAdminSession(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const users = await query<{
      id: string;
      full_name: string;
      email: string;
      email_verified: boolean;
      is_active: boolean;
      created_at: string;
    }>(
      `SELECT id, full_name, email, email_verified, is_active, created_at
       FROM users
       ORDER BY created_at DESC`
    );

    return NextResponse.json({ users }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/admin/users] error:", err);
    return NextResponse.json(
      { error: "Failed to load users." },
      { status: 500 }
    );
  }
}
