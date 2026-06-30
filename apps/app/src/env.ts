import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Typed, validated environment variables for the Vite app.
 *
 * Import `env` instead of reading `import.meta.env` directly: vars are validated
 * at startup and fully typed.
 *
 * NOTE: the app does not consume Convex/Clerk yet, so these are optional. Once a
 * Convex provider is wired in, tighten `VITE_CONVEX_URL` to a required `z.url()`
 * so a missing URL fails fast instead of silently rendering a broken client.
 */
export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_CONVEX_URL: z.url().optional(),
    VITE_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
    // PostHog analytics — provider is skipped entirely when the key is absent.
    VITE_POSTHOG_KEY: z.string().min(1).optional(),
    VITE_POSTHOG_HOST: z.url().optional(),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
});
