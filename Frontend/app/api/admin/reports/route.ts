import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { query } from "@/lib/db";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const admin = await getAdminSession(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const reportedListings = await query<{
      listing_id: string;
      title: string;
      report_count: number;
      last_reported: string;
    }>(
      `SELECT
         l.id AS listing_id,
         l.title,
         COUNT(r.id)::int AS report_count,
         MAX(r.created_at) AS last_reported
       FROM reports r
       INNER JOIN listings l ON l.id = r.listing_id
       WHERE l.status <> 'deleted'
       GROUP BY l.id, l.title
       ORDER BY report_count DESC, last_reported DESC`
    );

    const recentReports = await query<{
      id: string;
      listing_id: string;
      listing_title: string;
      reporter_email: string | null;
      reason: string;
      created_at: string;
    }>(
      `SELECT
         r.id,
         l.id AS listing_id,
         l.title AS listing_title,
         u.email AS reporter_email,
         r.reason::text AS reason,
         r.created_at
       FROM reports r
       INNER JOIN listings l ON l.id = r.listing_id
       LEFT JOIN users u ON u.id = r.reporter_id
       ORDER BY r.created_at DESC
       LIMIT 50`
    );

    return NextResponse.json(
      { reportedListings, recentReports },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET /api/admin/reports] error:", err);
    return NextResponse.json(
      { error: "Failed to load reports." },
      { status: 500 }
    );
  }
}
