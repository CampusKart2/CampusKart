import { NextResponse } from "next/server"
import { query } from "@/lib/db"

type TimeRow = { time: Date }
type CategoryRow = { id: number; slug: string; name: string }

export async function GET() {
  try {
    const [timeRow] = await query<TimeRow>("SELECT NOW() as time")
    const categories = await query<CategoryRow>(
      "SELECT id, slug, name FROM categories ORDER BY id"
    )

    return NextResponse.json(
      {
        status: "ok",
        db: "connected",
        timestamp: timeRow.time,
        categories,
      },
      { status: 200 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database unreachable"
    return NextResponse.json(
      {
        status: "error",
        db: "unreachable",
        message,
      },
      { status: 503 }
    )
  }
}
