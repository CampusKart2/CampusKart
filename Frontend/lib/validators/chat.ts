import { z } from "zod";

/** Response shape from POST /api/chat/token (client validates before use). */
export const chatTokenResponseSchema = z.object({
  token: z.string().min(1),
});

export type ChatTokenResponse = z.infer<typeof chatTokenResponseSchema>;
