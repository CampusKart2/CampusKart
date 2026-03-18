// ============================================================
// CampusKart — Auth Integration Test Suite
// Tests: Register, Login, Cookie Session, Verify/Resend routes,
//        Unverified write protection, Logout
//
// Run:
//   APP_URL=http://YOUR_HOST:3000 node test-auth-integration.js
//
// Notes:
// - This is an integration test, not a unit test
// - Assumes Next.js app is running
// - Uses cookie-based auth (httpOnly session cookie)
// ============================================================

const BASE_URL = process.env.APP_URL || "http://localhost:3000";

// ------------------------------------------------------------
// Minimal cookie jar for Node fetch
// ------------------------------------------------------------
class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  storeFromResponse(res) {
    // Node fetch may expose getSetCookie()
    const setCookies =
      typeof res.headers.getSetCookie === "function"
        ? res.headers.getSetCookie()
        : splitSetCookieHeader(res.headers.get("set-cookie"));

    for (const raw of setCookies || []) {
      const firstPart = raw.split(";")[0];
      const eqIndex = firstPart.indexOf("=");
      if (eqIndex === -1) continue;

      const name = firstPart.slice(0, eqIndex).trim();
      const value = firstPart.slice(eqIndex + 1).trim();

      // delete cookie if server expires/clears it
      if (value === "" || /max-age=0/i.test(raw) || /expires=/i.test(raw) && /1970/i.test(raw)) {
        this.cookies.delete(name);
      } else {
        this.cookies.set(name, value);
      }
    }
  }

  header() {
    if (this.cookies.size === 0) return "";
    return [...this.cookies.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }

  hasAny() {
    return this.cookies.size > 0;
  }

  clear() {
    this.cookies.clear();
  }
}

function splitSetCookieHeader(header) {
  if (!header) return [];
  // Handles multiple Set-Cookie values joined in one string
  return header.split(/,(?=\s*[^;,\s]+=)/g);
}

// ------------------------------------------------------------
// tiny fetch wrapper
// ------------------------------------------------------------
async function api(method, path, body, jar, extraHeaders = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  if (jar?.hasAny()) {
    headers["Cookie"] = jar.header();
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });

  if (jar) jar.storeFromResponse(res);

  let data = {};
  const contentType = res.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      data = { text: await res.text() };
    }
  } catch {
    data = {};
  }

  return { status: res.status, data, headers: res.headers };
}

// ------------------------------------------------------------
// logger
// ------------------------------------------------------------
let passed = 0;
let failed = 0;

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

function section(title) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"═".repeat(60)}`);
}

// ------------------------------------------------------------
// test data
// ------------------------------------------------------------
const VALID_USER = {
  full_name: "Test Student",
  email: `testuser_${Date.now()}@pace.edu`,
  password: "SecurePass123!",
};

const DUP_CASE_USER = {
  full_name: "Case Test",
  email: VALID_USER.email.toUpperCase(),
  password: "SecurePass123!",
};

const NON_EDU_USER = {
  full_name: "Not A Student",
  email: `notstudent_${Date.now()}@gmail.com`,
  password: "SecurePass123!",
};

const WEAK_PASSWORD_USER = {
  full_name: "Weak Pass",
  email: `weak_${Date.now()}@pace.edu`,
  password: "123",
};

// ------------------------------------------------------------
// tests
// ------------------------------------------------------------
async function runTests() {
  console.log(`\n🧪 CampusKart Auth Integration Test Suite`);
  console.log(`   Base URL : ${BASE_URL}`);
  console.log(`   Test user: ${VALID_USER.email}`);

  const jar = new CookieJar();

  // ----------------------------------------------------------
  section("1 — REGISTER");
  // ----------------------------------------------------------

  {
    const { status, data } = await api("POST", "/api/auth/register", VALID_USER, null);
    check("Valid .edu signup returns 201", status === 201, { status, data });
    check("Response has user id", !!data?.user?.id, data);
    check("email_verified is false on signup", data?.user?.email_verified === false, data);
    check(
      "Password/hash not returned in response",
      !data?.user?.password_hash && !data?.user?.password,
      data
    );
  }

  {
    const { status, data } = await api("POST", "/api/auth/register", VALID_USER, null);
    check("Duplicate exact email returns 409", status === 409, { status, data });
  }

  {
    const { status, data } = await api("POST", "/api/auth/register", DUP_CASE_USER, null);
    check(
      "Duplicate email with different case is rejected",
      status === 409,
      { status, data }
    );
  }

  {
    const { status, data } = await api("POST", "/api/auth/register", NON_EDU_USER, null);
    check("Non-.edu email returns 400", status === 400, { status, data });
  }

  {
    const { status, data } = await api("POST", "/api/auth/register", WEAK_PASSWORD_USER, null);
    check("Weak password returns 400", status === 400, { status, data });
  }

  {
    const { status, data } = await api("POST", "/api/auth/register", { email: "a@pace.edu" }, null);
    check("Missing fields returns 400", status === 400, { status, data });
  }

  // ----------------------------------------------------------
  section("2 — LOGIN + SESSION COOKIE");
  // ----------------------------------------------------------

  {
    const { status, data, headers } = await api("POST", "/api/auth/login", {
      email: VALID_USER.email,
      password: VALID_USER.password,
    }, jar);

    check("Valid login returns 200", status === 200, { status, data });
    check("Session cookie set on login", jar.hasAny(), {
      status,
      setCookie: headers.get("set-cookie"),
    });

    // This check is intentionally flexible because response body shape may vary
    check(
      "No password/hash returned on login",
      !data?.user?.password_hash && !data?.user?.password,
      data
    );
  }

  {
    const { status, data } = await api("POST", "/api/auth/login", {
      email: VALID_USER.email,
      password: "WrongPassword!",
    }, null);

    check("Wrong password returns 401", status === 401, { status, data });
  }

  {
    const { status, data } = await api("POST", "/api/auth/login", {
      email: "nobody@pace.edu",
      password: "SomePass123!",
    }, null);

    check("Non-existent user returns 401", status === 401, { status, data });
  }

  {
    const { status, data } = await api("POST", "/api/auth/login", {
      email: VALID_USER.email,
    }, null);

    check("Missing password returns 400", status === 400, { status, data });
  }

  // ----------------------------------------------------------
  section("3 — UNVERIFIED USER RESTRICTIONS");
  // ----------------------------------------------------------

  {
    const { status, data } = await api("POST", "/api/listings", {
      title: "Test listing",
      price: 10,
      condition: "Good",
      category_id: 1,
    }, jar);

    check(
      "Unverified user blocked from write API with 401",
      status === 401,
      { status, data }
    );
  }

  {
    const { status, data } = await api("POST", "/api/auth/verify-email/resend", null, jar);
    check("Resend verification returns 200 for logged-in user", status === 200, { status, data });
  }

  // ----------------------------------------------------------
  section("4 — VERIFY EMAIL ROUTE");
  // ----------------------------------------------------------

  {
    const { status, data } = await api(
      "GET",
      "/api/auth/verify-email/confirm?token=invalid-token-123",
      null,
      jar
    );

    check(
      "Invalid verification token returns 400 or 404",
      status === 400 || status === 404,
      { status, data }
    );
  }

  {
    const { status, data } = await api(
      "GET",
      "/api/auth/verify-email/confirm?token=expired-fake-token",
      null,
      jar
    );

    check(
      "Expired/fake token returns 400 or 404",
      status === 400 || status === 404,
      { status, data }
    );
  }

  console.log(`\n  ℹ️ Manual verification step still required for full positive confirm-flow test.`);
  console.log(`     1. Open inbox for ${VALID_USER.email}`);
  console.log(`     2. Copy the token from the verification link`);
  console.log(`     3. Run:`);
  console.log(`        curl "${BASE_URL}/api/auth/verify-email/confirm?token=YOUR_TOKEN"`);
  console.log(`     4. Then retry a protected write route with the same session/browser context`);

  // ----------------------------------------------------------
  section("5 — LOGOUT");
  // ----------------------------------------------------------

  {
    const { status, data, headers } = await api("DELETE", "/api/auth/logout", null, jar);

    check("Logout returns 200", status === 200, { status, data });
    check(
      'Logout response includes redirectUrl "/login"',
      data?.redirectUrl === "/login",
      data
    );

    check(
      "Logout clears session cookie",
      !jar.hasAny() || /max-age=0|expires=/i.test(headers.get("set-cookie") || ""),
      { setCookie: headers.get("set-cookie") }
    );
  }

  {
    const { status, data } = await api("DELETE", "/api/auth/logout", null, jar);
    check("Logout when already unauthenticated returns 401", status === 401, { status, data });
  }

  // ----------------------------------------------------------
  section("6 — SUMMARY");
  // ----------------------------------------------------------

  const total = passed + failed;
  console.log(`\n  Total  : ${total}`);
  console.log(`  Passed : ${passed} ✅`);
  console.log(`  Failed : ${failed} ❌`);
  console.log(`  Score  : ${total ? Math.round((passed / total) * 100) : 0}%\n`);

  if (failed > 0) {
    console.log(`  ⚠️ Some tests failed.`);
    console.log(`     Check route paths, status codes, cookie handling, and middleware behavior.\n`);
    process.exit(1);
  } else {
    console.log(`  🎉 All integration auth tests passed.\n`);
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("\n💥 Test runner crashed:", err);
  process.exit(1);
});