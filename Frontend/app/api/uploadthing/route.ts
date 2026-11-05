import { createRouteHandler } from "uploadthing/next";
import { appPath } from "@/lib/routes";
import { ourFileRouter } from "@/lib/uploadthing";

// UploadThing derives its callback URL from the request by default, and that URL
// loses the basePath. On the shared host, /api belongs to a different app.
const publicAppUrl = process.env.NEXT_PUBLIC_APP_URL;

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: publicAppUrl
    ? { callbackUrl: new URL(appPath("/api/uploadthing"), publicAppUrl).toString() }
    : undefined,
});
