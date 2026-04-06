// ============================================================
// CampusKart — Seed Test Data Script
// Inserts a test user + 15 listings across all categories
//
// Run: node seed-test-data.js
// Prerequisites:
//   - .env.local must have DATABASE_URL set
//   - schema.sql and 0005 must already be run on DB
// ============================================================

require("dotenv").config({ path: ".env.local" });
const { Pool } = require("pg");
const crypto = require("crypto");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ── seed data ─────────────────────────────────────────────────
const TEST_SELLER = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "seller@pace.edu",
  full_name: "Test Seller",
  password_hash: "$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // "password"
};

const LISTINGS = [
  // Electronics
  {
    title: "MacBook Pro 2022",
    description: "Excellent condition MacBook Pro, barely used. Comes with charger.",
    price: 89900,   // stored as cents
    condition: "Like New",
    category_slug: "electronics",
  },
  {
    title: "iPhone 13 Pro",
    description: "iPhone 13 Pro 256GB, minor scratches on back. Battery health 91%.",
    price: 55000,
    condition: "Good",
    category_slug: "electronics",
  },
  {
    title: "iPad Air",
    description: "iPad Air 4th gen with Apple Pencil. Perfect for note taking in class.",
    price: 45000,
    condition: "Good",
    category_slug: "electronics",
  },
  {
    title: "Mechanical Keyboard",
    description: "Keychron K2 mechanical keyboard, brown switches. Great for studying.",
    price: 7500,
    condition: "Like New",
    category_slug: "electronics",
  },

  // Books
  {
    title: "Calculus Early Transcendentals",
    description: "James Stewart 8th edition. Some highlighting in first 3 chapters.",
    price: 4500,
    condition: "Good",
    category_slug: "books",
  },
  {
    title: "Introduction to Algorithms (CLRS)",
    description: "3rd edition CLRS. No markings. Perfect for CS students.",
    price: 3500,
    condition: "Like New",
    category_slug: "books",
  },
  {
    title: "Python Crash Course",
    description: "2nd edition. Great for beginners. Light pencil marks.",
    price: 1500,
    condition: "Good",
    category_slug: "books",
  },

  // Furniture
  {
    title: "IKEA Desk",
    description: "IKEA MICKE desk, white, 105x50cm. Easy to assemble. Minor scuff on side.",
    price: 4000,
    condition: "Good",
    category_slug: "furniture",
  },
  {
    title: "Ergonomic Office Chair",
    description: "Adjustable office chair with lumbar support. Very comfortable for long study sessions.",
    price: 8500,
    condition: "Good",
    category_slug: "furniture",
  },
  {
    title: "Bookshelf",
    description: "5-shelf bookcase, dark brown. Fits perfectly in a dorm room.",
    price: 3000,
    condition: "Fair",
    category_slug: "furniture",
  },

  // Clothing
  {
    title: "Pace University Hoodie",
    description: "Official Pace University hoodie, size M. Only worn twice.",
    price: 2500,
    condition: "Like New",
    category_slug: "clothing",
  },
  {
    title: "North Face Jacket",
    description: "North Face fleece jacket, size L, navy blue. Perfect for campus.",
    price: 6000,
    condition: "Good",
    category_slug: "clothing",
  },

  // Other
  {
    title: "Desk Lamp",
    description: "LED desk lamp with USB charging port. 3 brightness levels.",
    price: 2000,
    condition: "Like New",
    category_slug: "other",
  },
  {
    title: "Mini Fridge",
    description: "1.7 cu ft mini fridge. Perfect for dorm. Runs quietly.",
    price: 9500,
    condition: "Good",
    category_slug: "other",
  },
  {
    title: "Free Textbook Bundle",
    description: "Assorted intro textbooks from freshman year. Free to a good home.",
    price: 0,       // Free listing
    condition: "Fair",
    category_slug: "books",
  },
];

// ── helpers ───────────────────────────────────────────────────
function uuid() {
  return crypto.randomUUID();
}

// ── main ──────────────────────────────────────────────────────
async function seed() {
  const client = await pool.connect();

  try {
    console.log("\n🌱  CampusKart — Seeding test data...\n");

    await client.query("BEGIN");

    // ── 1. Insert test seller (skip if already exists) ────────
    await client.query(`
      INSERT INTO users (id, email, full_name, password_hash, email_verified, is_active)
      VALUES ($1, $2, $3, $4, true, true)
      ON CONFLICT (email) DO NOTHING
    `, [TEST_SELLER.id, TEST_SELLER.email, TEST_SELLER.full_name, TEST_SELLER.password_hash]);

    console.log(`  ✅ Test seller: ${TEST_SELLER.email}`);

    // ── 2. Get category IDs ───────────────────────────────────
    const catResult = await client.query(
      `SELECT id, slug FROM categories`
    );
    const categories = {};
    catResult.rows.forEach(row => {
      categories[row.slug] = row.id;
    });

    console.log(`  ✅ Categories loaded: ${Object.keys(categories).join(", ")}`);

    // ── 3. Insert listings ────────────────────────────────────
    let insertedCount = 0;
    for (const listing of LISTINGS) {
      const categoryId = categories[listing.category_slug];
      if (!categoryId) {
        console.log(`  ⚠️  Category not found: ${listing.category_slug} — skipping`);
        continue;
      }

      await client.query(`
        INSERT INTO listings (
          id,
          seller_id,
          category_id,
          title,
          description,
          price,
          condition,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
        ON CONFLICT DO NOTHING
      `, [
        uuid(),
        TEST_SELLER.id,
        categoryId,
        listing.title,
        listing.description,
        listing.price,
        listing.condition,
      ]);

      insertedCount++;
      console.log(`  ✅ Listing: "${listing.title}" — $${(listing.price / 100).toFixed(2)} — ${listing.condition}`);
    }

    await client.query("COMMIT");

    console.log(`\n  📦  Seeded ${insertedCount} listings across 5 categories`);
    console.log(`  👤  Test seller: ${TEST_SELLER.email} / password: password`);
    console.log(`\n  ⚠️  Update KNOWN_LISTING_TITLE in test-marketplace.js to "MacBook Pro 2022"`);
    console.log(`  ✅  Now run: node test-marketplace.js\n`);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("\n💥  Seed failed:", err.message);
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
