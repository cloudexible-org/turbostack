import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Typed, validated environment variables for the Vite app.
 *
 * Import `env` instead of reading `import.meta.env` directly: vars are validated
 * at startup and fully typed.
 */
export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    // Required: the app mounts a Convex client from this at startup.
    VITE_CONVEX_URL: z.url(),
    // Clerk is optional and not yet wired into this app.
    VITE_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
    // PostHog analytics — provider is skipped entirely when the key is absent.
    VITE_POSTHOG_KEY: z.string().min(1).optional(),
    VITE_POSTHOG_HOST: z.url().optional(),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
});
