import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Typed, validated environment variables for the Next.js app.
 *
 * Import `env` instead of reading `process.env` directly: missing or malformed
 * vars fail fast at startup/build with a clear message, and access is fully typed.
 *
 * Set `SKIP_ENV_VALIDATION=1` to bypass validation (e.g. for lint/Docker steps
 * that build without runtime env).
 */
export const env = createEnv({
  server: {
    // Clerk is optional — auth is bypassed when these are absent.
    CLERK_SECRET_KEY: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_CONVEX_URL: z.url(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
    // PostHog analytics — provider is skipped entirely when the key is absent.
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.url().optional(),
  },
  // Next.js inlines NEXT_PUBLIC_* at build time, so client vars must be
  // referenced explicitly rather than spread from process.env.
  experimental__runtimeEnv: {
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
