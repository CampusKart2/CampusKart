Here’s a short runbook for a tester running the DB test from EC2 (where RDS is reachable).
1. Get on the EC2 instance
# From your laptop (use your key and host)ssh -i /path/to/your-key.pem ec2-user@<EC2_PUBLIC_IP># Or: ssh -i /path/to/your-key.pem ubuntu@<EC2_PUBLIC_IP>
2. Put the app (or at least the script) on EC2
Option A – Clone the repo on EC2
# Install Node 20+ if needed (Amazon Linux 2 example)sudo yum install -y nodejs npm   # or: sudo apt install -y nodejs npm# Clone (use HTTPS or deploy key)git clone https://github.com/CampusKart2/CampusKart.gitcd CampusKart/Frontendnpm install
Option B – Copy only what’s needed
Copy the Frontend folder (or at least Frontend/scripts, Frontend/lib, and Frontend/package.json) to EC2 (e.g. with scp or your CI/deploy process), then on EC2:
cd /path/to/Frontendnpm install
3. Set env vars on EC2
Either create .env.local in the Frontend directory:
cd /path/to/CampusKart/Frontend   # or wherever Frontend lives on EC2cat > .env.local << 'EOF'DATABASE_URL=postgresql://postgres:Team2abc@dev.cipwmk648uoo.us-east-1.rds.amazonaws.com:5432/postgresJWT_SECRET=a66324879774eb116b24d581a06f5c3f54e7b56f7d8668c1c2968c819f8f4c81db5af5895e158eae3a0f5c146ef81d4cf10ab43eefd74e4a0f506c4bf8bdb197NEXT_PUBLIC_APP_URL=http://localhost:3000EOF
Or export for a one-off run (same directory as above):
export DATABASE_URL="postgresql://postgres:Team2abc@dev.cipwmk648uoo.us-east-1.rds.amazonaws.com:5432/postgres"export JWT_SECRET="a66324879774eb116b24d581a06f5c3f54e7b56f7d8668c1c2968c819f8f4c81db5af5895e158eae3a0f5c146ef81d4cf10ab43eefd74e4a0f506c4bf8bdb197"export NEXT_PUBLIC_APP_URL="http://localhost:3000"
4. Run the DB test script
From the Frontend directory (where package.json and scripts/test-db.ts live):
npx tsx scripts/test-db.ts
Expected success:
Connected at: 2026-03-10T12:00:00.000ZCategories: [ { slug: 'books', name: 'Books' }, ... ]
Expected failure (e.g. wrong URL or no schema):
Connection failed: <error message>
Exit code will be non-zero.
5. (Optional) Test the health API from EC2
If the Next app is running on the same EC2 (e.g. on port 3000):
curl -s http://localhost:3000/api/health | jq .
Without jq: curl -s http://localhost:3000/api/health
200: "status": "ok", "db": "connected", plus categories and timestamp.
503: "status": "error", "db": "unreachable", plus message.
Checklist for the tester
Step	Command / action
1	SSH into EC2 with the project’s key.
2	Ensure Node (e.g. 18+) and npm are installed; clone or copy repo and run npm install in Frontend.
3	Create Frontend/.env.local (or export vars) with DATABASE_URL, JWT_SECRET, NEXT_PUBLIC_APP_URL.
4	From Frontend: npx tsx scripts/test-db.ts.
5	Optional: if app is running on EC2, curl http://localhost:3000/api/health.
Note: EC2 must be in the same VPC as RDS (or have a network path to it), and the RDS security group must allow inbound PostgreSQL (port 5432) from the EC2 security group. If the test still times out on EC2, the next place to check is VPC/security groups and RDS accessibility.