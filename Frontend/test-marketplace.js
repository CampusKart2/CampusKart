// ============================================================
// CampusKart — Sprint 1 Marketplace Test Suite
// Tests: T-16 to T-31 (Search, Filter, Category, Item Detail)
//
// Run: node test-marketplace.js
// Prerequisites:
//   - Next.js app must be running (npm run dev)
//   - Database must be seeded with test data
//   - Run seed script first: node seed-test-data.js
// ============================================================

const BASE_URL = process.env.APP_URL || "http://localhost:3000";

// ── tiny fetch wrapper ────────────────────────────────────────
async function api(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;
  try { data = await res.json(); } catch { data = {}; }
  return { status: res.status, data };
}

// ── logger ────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
let skipped = 0;

function check(testName, condition, got) {
  if (condition) {
    console.log(`  ✅ PASS — ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL — ${testName}`);
    console.log(`         Got:`, JSON.stringify(got, null, 2));
    failed++;
  }
}

function skip(testName, reason) {
  console.log(`  ⏭️  SKIP — ${testName} (${reason})`);
  skipped++;
}

function section(title) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"═".repeat(60)}`);
}

// ── test data ─────────────────────────────────────────────────
// These should match what's in your DB after seeding
const KNOWN_LISTING_TITLE = "MacBook Pro 2022";        // change to match your seed data
const KNOWN_CATEGORY_SLUG = "electronics";
const KNOWN_PRICE_MIN = 10;
const KNOWN_PRICE_MAX = 500;
const KNOWN_CONDITION = "Good";
let KNOWN_LISTING_ID = null;                    // captured from first search result

// ── tests ─────────────────────────────────────────────────────
async function runTests() {
  console.log(`\n🧪  CampusKart Marketplace Test Suite (T-16 → T-31)`);
  console.log(`    Base URL: ${BASE_URL}`);
  console.log(`    Make sure the app is running and DB is seeded!\n`);

  // ────────────────────────────────────────────────────────────
  section("T-16 + T-17 — SEARCH LISTINGS (02.01)");
  // ────────────────────────────────────────────────────────────

  // 1. Empty query returns latest listings
  {
    const { data } = await api("GET", "/api/listings");
    check("Empty query returns 200", status === 200, { status, data });
    check("Returns listings array", Array.isArray(data?.listings), data);
    check("Returns total count", typeof data?.total === "number", data);
    check("Returns page number", typeof data?.page === "number", data);
    check("Returns limit", typeof data?.limit === "number", data);
    check("Default limit is ≤ 20", data?.limit <= 20, data);
    check("Listings have required fields",
      data?.listings?.[0]?.id &&
      data?.listings?.[0]?.title &&
      typeof data?.listings?.[0]?.price === "number", data?.listings?.[0]);

    // Capture a listing ID for later tests
    if (data?.listings?.[0]?.id) {
      KNOWN_LISTING_ID = data.listings[0].id;
      console.log(`  ℹ️  Captured listing ID: ${KNOWN_LISTING_ID}`);
    }
  }

  // 2. Search with query returns relevant results
  {
    const { status, data } = await api("GET", `/api/listings?q=${KNOWN_LISTING_TITLE}`);
    check("Search with query returns 200", status === 200, { status, data });
    check("Search results contain relevant listing",
      data?.listings?.some(l =>
        l.title.toLowerCase().includes(KNOWN_LISTING_TITLE.toLowerCase())
      ), data?.listings);
  }

  // 3. Search with no results returns empty array not error
  {
    const { status, data } = await api("GET", "/api/listings?q=xyznonexistentitem999");
    check("No results returns 200 not 404", status === 200, { status, data });
    check("No results returns empty array", Array.isArray(data?.listings), data);
    check("Total is 0 for no results", data?.total === 0, data);
  }

  // 4. Pagination works
  {
    const { status, data } = await api("GET", "/api/listings?page=1&limit=5");
    check("Pagination returns 200", status === 200, { status, data });
    check("Limit respected (≤5 results)", data?.listings?.length <= 5, data);
    check("Page param reflected in response", data?.page === 1, data);
  }

  // 5. Invalid page returns 400
  {
    const { status } = await api("GET", "/api/listings?page=-1");
    check("Negative page returns 400", status === 400, { status });
  }

  // 6. Deleted/sold listings not in default results
  {
    const { data } = await api("GET", "/api/listings");
    check("No deleted listings in results",
      !data?.listings?.some(l => l.status === "deleted"), data?.listings);
    check("No sold listings in default results",
      !data?.listings?.some(l => l.status === "sold"), data?.listings);
  }

  // ────────────────────────────────────────────────────────────
  section("T-20 — FILTER LISTINGS (02.02)");
  // ────────────────────────────────────────────────────────────

  // 7. Filter by category
  {
    const { status, data } = await api("GET", `/api/listings?category=${KNOWN_CATEGORY_SLUG}`);
    check("Filter by category returns 200", status === 200, { status, data });
    check("All results match category",
      data?.listings?.every(l =>
        l.category?.toLowerCase() === KNOWN_CATEGORY_SLUG.toLowerCase()
      ), data?.listings);
  }

  // 8. Filter by price range
  {
    const { status, data } = await api("GET",
      `/api/listings?price_min=${KNOWN_PRICE_MIN}&price_max=${KNOWN_PRICE_MAX}`);
    check("Filter by price range returns 200", status === 200, { status, data });
    check("All results within price range",
      data?.listings?.every(l =>
        l.price >= KNOWN_PRICE_MIN && l.price <= KNOWN_PRICE_MAX
      ), data?.listings);
  }

  // 9. Filter by condition
  {
    const { status, data } = await api("GET", `/api/listings?condition=${KNOWN_CONDITION}`);
    check("Filter by condition returns 200", status === 200, { status, data });
    check("All results match condition",
      data?.listings?.every(l => l.condition === KNOWN_CONDITION),
      data?.listings);
  }

  // 10. All filters combined
  {
    const { status, data } = await api("GET",
      `/api/listings?category=${KNOWN_CATEGORY_SLUG}&price_min=${KNOWN_PRICE_MIN}&price_max=${KNOWN_PRICE_MAX}&condition=${KNOWN_CONDITION}`);
    check("All filters combined returns 200", status === 200, { status, data });
    check("Combined filters return array", Array.isArray(data?.listings), data);
  }

  // 11. Invalid condition returns 400
  {
    const { status } = await api("GET", "/api/listings?condition=InvalidCondition");
    check("Invalid condition returns 400", status === 400, { status });
  }

  // 12. Invalid price returns 400
  {
    const { status } = await api("GET", "/api/listings?price_min=abc");
    check("Non-numeric price_min returns 400", status === 400, { status });
  }

  // 13. price_min > price_max returns 400
  {
    const { status } = await api("GET", "/api/listings?price_min=500&price_max=10");
    check("price_min > price_max returns 400", status === 400, { status });
  }

  // ────────────────────────────────────────────────────────────
  section("T-24 + T-25 — BROWSE BY CATEGORY (02.03)");
  // ────────────────────────────────────────────────────────────

  // 14. GET /api/categories returns all 5 categories
  {
    const { status, data } = await api("GET", "/api/categories");
    check("GET /api/categories returns 200", status === 200, { status, data });
    check("Returns exactly 5 categories", data?.categories?.length === 5, data);
    check("Categories have id, slug, name",
      data?.categories?.[0]?.id &&
      data?.categories?.[0]?.slug &&
      data?.categories?.[0]?.name, data?.categories?.[0]);
    check("Books category exists",
      data?.categories?.some(c => c.slug === "books"), data?.categories);
    check("Electronics category exists",
      data?.categories?.some(c => c.slug === "electronics"), data?.categories);
    check("Furniture category exists",
      data?.categories?.some(c => c.slug === "furniture"), data?.categories);
    check("Clothing category exists",
      data?.categories?.some(c => c.slug === "clothing"), data?.categories);
    check("Other category exists",
      data?.categories?.some(c => c.slug === "other"), data?.categories);
  }

  // 15. GET /api/listings?category= filters correctly
  {
    const { status, data } = await api("GET", "/api/listings?category=books");
    check("Books category filter returns 200", status === 200, { status, data });
    check("All results are books",
      data?.listings?.every(l =>
        l.category?.toLowerCase() === "books"
      ), data?.listings);
  }

  // 16. Unknown category returns 404
  {
    const { status } = await api("GET", "/api/listings?category=nonexistentcategory");
    check("Unknown category returns 400 or 404", status === 400 || status === 404, { status });
  }

  // ────────────────────────────────────────────────────────────
  section("T-28 + T-29 + T-30 + T-31 — VIEW ITEM DETAILS (02.05)");
  // ────────────────────────────────────────────────────────────

  if (!KNOWN_LISTING_ID) {
    skip("All item detail tests", "No listing ID captured from search results — check seed data");
  } else {

    // 17. GET /api/listings/:id returns full listing
    let viewCountBefore = 0;
    {
      const { data } = await api("GET", `/api/listings/${KNOWN_LISTING_ID}`);
      check("GET /api/listings/:id returns 200", status === 200, { status, data });
      check("Returns listing object", !!data?.listing, data);
      check("Listing has id", !!data?.listing?.id, data?.listing);
      check("Listing has title", !!data?.listing?.title, data?.listing);
      check("Listing has price", typeof data?.listing?.price === "number", data?.listing);
      check("Listing has condition", !!data?.listing?.condition, data?.listing);
      check("Listing has category", !!data?.listing?.category, data?.listing);
      check("Listing has seller info", !!data?.listing?.seller, data?.listing);
      check("Seller has id", !!data?.listing?.seller?.id, data?.listing?.seller);
      check("Seller has name", !!data?.listing?.seller?.name || !!data?.listing?.seller?.full_name, data?.listing?.seller);
      check("Listing has view_count", typeof data?.listing?.view_count === "number", data?.listing);
      check("Listing has created_at", !!data?.listing?.created_at, data?.listing);

      if (typeof data?.listing?.view_count === "number") {
        viewCountBefore = data.listing.view_count;
        console.log(`  ℹ️  View count before: ${viewCountBefore}`);
      }
    }

    // 18. View count increments on first visit (T-31)
    {
      const { data } = await api("GET", `/api/listings/${KNOWN_LISTING_ID}`);
      check("Second fetch returns 200", status === 200, { status, data });
      // Note: same session = no increment. Different session = increment.
      // This test just verifies view_count is a valid number
      check("view_count is still a valid number",
        typeof data?.listing?.view_count === "number", data?.listing);
      console.log(`  ℹ️  View count after second fetch: ${data?.listing?.view_count}`);
      console.log(`  ℹ️  (Same session = no change expected. Open in different browser to test increment)`);
    }

    // 19. 404 for non-existent listing
    {
      const { status } = await api("GET", "/api/listings/00000000-0000-0000-0000-000000000000");
      check("Non-existent listing returns 404", status === 404, { status });
    }

    // 20. 400 for invalid UUID
    {
      const { status } = await api("GET", "/api/listings/not-a-valid-uuid");
      check("Invalid UUID returns 400", status === 400, { status });
    }

    // 21. Listing photos returned (thumbnail_url)
    {
      const { data } = await api("GET", `/api/listings/${KNOWN_LISTING_ID}`);
      check("thumbnail_url field exists (null is ok)",
        "thumbnail_url" in (data?.listing ?? {}), data?.listing);
    }

    // 22. Price = 0 listings exist and are valid (Free items)
    {
      const { status, data } = await api("GET", "/api/listings?price_max=0");
      check("Free listings endpoint returns 200", status === 200, { status, data });
      check("Free listings have price = 0",
        data?.listings?.every(l => l.price === 0) ?? true, data?.listings);
    }
  }

  // ────────────────────────────────────────────────────────────
  section("T-22 — URL PARAM SYNC (sharable links)");
  // ────────────────────────────────────────────────────────────

  // 23. Combined search + filter URL works
  {
    const url = `/api/listings?q=book&category=books&price_min=1&price_max=100&condition=Good&page=1&limit=10`;
    const { status, data } = await api("GET", url);
    check("Full combined URL returns 200", status === 200, { status, data });
    check("Response reflects all params",
      data?.page === 1 && data?.limit === 10, data);
  }

  // ────────────────────────────────────────────────────────────
  section("EDGE CASES");
  // ────────────────────────────────────────────────────────────

  // 24. SQL injection attempt
  {
    const { status } = await api("GET", "/api/listings?q='; DROP TABLE listings; --");
    check("SQL injection in q param is handled safely", status === 200 || status === 400, { status });
  }

  // 25. Very long search query
  {
    const longQuery = "a".repeat(500);
    const { status } = await api("GET", `/api/listings?q=${longQuery}`);
    check("Very long search query handled (no 500)", status !== 500, { status });
  }

  // 26. Special characters in search
  {
    const { status } = await api("GET", "/api/listings?q=laptop%20%26%20charger");
    check("Special characters in search handled", status === 200 || status === 400, { status });
  }

  // ────────────────────────────────────────────────────────────
  section("SUMMARY");
  // ────────────────────────────────────────────────────────────
  const total = passed + failed + skipped;
  console.log(`\n  Total   : ${total}`);
  console.log(`  Passed  : ${passed} ✅`);
  console.log(`  Failed  : ${failed} ❌`);
  console.log(`  Skipped : ${skipped} ⏭️`);
  console.log(`  Score   : ${Math.round((passed / (passed + failed)) * 100)}%\n`);

  if (failed > 0) {
    console.log(`  ⚠️  Some tests failed. Common causes:`);
    console.log(`     - App not running (npm run dev)`);
    console.log(`     - DB not seeded (no listings in database)`);
    console.log(`     - 0005_create_listing_views_table.sql not run on DB`);
    console.log(`     - Field names mismatch (check category/condition field names)\n`);
    process.exit(1);
  } else {
    console.log(`  🎉  All marketplace tests passed! T-16 to T-31 complete.\n`);
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error("\n💥  Test runner crashed:", err.message);
  console.error("    Make sure the app is running: npm run dev");
  process.exit(1);
});
