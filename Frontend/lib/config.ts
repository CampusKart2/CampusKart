// lib/config.ts
const required = (key: string): string => {
  const val = process.env[key]
  if (!val) throw new Error(`Missing required env var: ${key}`)
  return val
}

export const config = {
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
}
