/**
 * Standalone script to verify DB connection and schema.
 * Run from Frontend directory: npx tsx scripts/test-db.ts
 * (Ensure .env.local exists or set DATABASE_URL.)
 */
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

// Load .env.local before importing lib/db (so config sees DATABASE_URL)
const envPath = resolve(process.cwd(), ".env.local")
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8")
  for (const line of content.split("\n")) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith("#")) {
      const eq = trimmed.indexOf("=")
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim()
        const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "")
        if (!(key in process.env)) process.env[key] = val
      }
    }
  }
}

async function main() {
  const { db } = await import("../lib/db")
  const { rows } = await db.query<{ time: Date }>("SELECT NOW() as time")
  console.log("Connected at:", rows[0].time)
  const { rows: cats } = await db.query<{ slug: string; name: string }>(
    "SELECT slug, name FROM categories ORDER BY id"
  )
  console.log("Categories:", cats)
  process.exit(0)
}

main().catch((err) => {
  console.error("Connection failed:", err.message)
  process.exit(1)
})
