# Database smoke test

1. In `Frontend/`, create `.env.local`:

   ```
   DATABASE_URL=postgresql://<user>:<password>@<host>:5432/postgres
   JWT_SECRET=<generate with: openssl rand -base64 48>
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

2. Install and run the test:

   ```bash
   cd Frontend
   npm install
   npx tsx scripts/test-db.ts
   ```

   Success prints `Connected at: <timestamp>` and the categories.
   Failure prints `Connection failed: <error>` and exits non-zero.

3. Optional, with the app running:

   ```bash
   curl -s http://localhost:3000/api/health | jq .
   ```