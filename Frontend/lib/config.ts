export const config = {
  get databaseUrl() {
    const val = process.env.DATABASE_URL
    if (!val) throw new Error("Missing required env var: DATABASE_URL")
    return val
  },
  get jwtSecret() {
    const val = process.env.JWT_SECRET
    if (!val) throw new Error("Missing required env var: JWT_SECRET")
    return val
  },
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
}
