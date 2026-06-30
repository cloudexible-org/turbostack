"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import type { ReactNode } from "react";

export { usePostHog } from "posthog-js/react";
export { posthog };

const DEFAULT_API_HOST = "https://us.i.posthog.com";

export interface AnalyticsProviderProps {
  /** PostHog project API key. When absent, analytics is not initialized. */
  apiKey?: string;
  /** PostHog API host. Defaults to PostHog US cloud. */
  apiHost?: string;
  children: ReactNode;
}

/**
 * Mounts the PostHog provider only when an API key is present. With no key the
 * provider is skipped entirely, so `usePostHog()` cleanly no-ops in consumers —
 * keeping local and CI runs silent without any conditional logic at call sites.
 *
 * Tip: for custom events tied to UI transitions, diff state in a hook rather
 * than firing from a reducer, so business logic stays free of side effects.
 */
export function AnalyticsProvider({
  apiKey,
  apiHost = DEFAULT_API_HOST,
  children,
}: AnalyticsProviderProps): ReactNode {
  if (!apiKey) {
    return children;
  }

  return (
    <PostHogProvider apiKey={apiKey} options={{ api_host: apiHost }}>
      {children}
    </PostHogProvider>
  );
}
