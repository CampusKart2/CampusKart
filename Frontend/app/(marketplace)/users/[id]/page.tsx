import { notFound, redirect } from "next/navigation";

import { userIdParamsSchema } from "@/lib/validators/users";

/**
 * Legacy URL: /users/:id → canonical seller profile at /sellers/:id (T-34).
 */
export default async function LegacyUserProfileRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const rawParams = await params;
  const parsed = userIdParamsSchema.safeParse(rawParams);
  if (!parsed.success) {
    notFound();
  }
  redirect(`/sellers/${parsed.data.id}`);
}
