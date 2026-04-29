const fs = require("fs");
const path = require("path");
const { StreamChat } = require("stream-chat");

const MESSAGE_EVENT_TYPES = ["message.new"];

function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;

    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

function normalizeWebhookUrl(rawUrl) {
  if (!rawUrl) {
    throw new Error(
      "Usage: node scripts/configure-getstream-webhook.js https://your-public-url.example.com"
    );
  }

  const url = new URL(rawUrl);
  if (url.protocol !== "https:") {
    throw new Error("GetStream webhooks must use a public HTTPS URL.");
  }

  url.pathname = `${url.pathname.replace(/\/+$/, "")}/api/webhooks/getstream`;
  url.search = "";
  url.hash = "";
  return url.toString();
}

function readBaseUrlsFromArgsOrEnv() {
  const argUrls = process.argv.slice(2).filter(Boolean);
  if (argUrls.length > 0) return argUrls;

  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.PUBLIC_URL;
  return envUrl ? [envUrl] : [];
}

function sameEventTypes(a, b) {
  return (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((eventType) => b.includes(eventType))
  );
}

async function main() {
  loadEnvFile();

  const apiKey =
    process.env.GETSTREAM_API_KEY || process.env.NEXT_PUBLIC_GETSTREAM_API_KEY;
  const apiSecret = process.env.GETSTREAM_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error(
      "Missing GETSTREAM_API_KEY/NEXT_PUBLIC_GETSTREAM_API_KEY or GETSTREAM_API_SECRET."
    );
  }

  const webhookUrls = readBaseUrlsFromArgsOrEnv().map(normalizeWebhookUrl);
  if (webhookUrls.length === 0) {
    throw new Error(
      "Provide a public HTTPS base URL as an argument or set NEXT_PUBLIC_APP_URL/NEXT_PUBLIC_BASE_URL."
    );
  }

  const client = StreamChat.getInstance(apiKey, apiSecret);
  const settings = await client.getAppSettings();
  let nextHooks = settings.event_hooks || [];

  for (const webhookUrl of webhookUrls) {
    nextHooks = nextHooks.filter((hook) => {
      return !(
        hook.hook_type === "webhook" &&
        hook.webhook_url === webhookUrl &&
        sameEventTypes(hook.event_types, MESSAGE_EVENT_TYPES)
      );
    });

    nextHooks.push({
      enabled: true,
      hook_type: "webhook",
      webhook_url: webhookUrl,
      event_types: MESSAGE_EVENT_TYPES,
    });
  }

  await client.updateAppSettings({ event_hooks: nextHooks });

  console.log("Configured GetStream webhook(s):");
  for (const webhookUrl of webhookUrls) {
    console.log(webhookUrl);
  }
  console.log("Events:", MESSAGE_EVENT_TYPES.join(", "));
}

main().catch((err) => {
  console.error("GetStream webhook configuration failed.");
  console.error(err && err.message ? err.message : err);
  process.exit(1);
});
