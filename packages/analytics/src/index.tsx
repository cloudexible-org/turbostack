"use client";

import type { PostHogConfig } from "posthog-js";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { type ReactNode, useMemo } from "react";

export { usePostHog } from "posthog-js/react";
export { posthog };

const DEFAULT_API_HOST = "https://us.i.posthog.com";

/**
 * Opts into PostHog's current default behaviours rather than the legacy ones.
 * The one that matters most here is `capture_pageview: 'history_change'` — with
 * the legacy default a pageview fires only on a hard document load, so every
 * client-side navigation (the App Router's, and the app's client routing) goes
 * uncounted. This date also makes scripts inject into `<head>`, which avoids
 * hydration mismatches in the Next app.
 *
 * Safe to move forward, but read PostHog's notes first: each date flips more
 * defaults, and bumping it mid-stream makes data before and after incomparable.
 */
const CONFIG_DEFAULTS = "2026-06-25" as const;

export interface AnalyticsProviderProps {
  /** PostHog project API key. When absent, analytics is not initialized. */
  apiKey?: string;
  /** PostHog API host. Defaults to PostHog US cloud. */
  apiHost?: string;
  /**
   * The product sending the event (e.g. `"turbostack"`), stamped onto every
   * event as `product`. Products share one PostHog project, so this is the
   * only reliable way to split them apart — `$host` works only for as long as
   * no two of them ever share a domain. Forks must change it.
   */
  product: string;
  /**
   * Which part of the product sent the event (e.g. `"www"`, `"app"`), stamped
   * onto every event as `surface`.
   */
  surface: string;
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
  product,
  surface,
  children,
}: AnalyticsProviderProps): ReactNode {
  const options = useMemo<Partial<PostHogConfig>>(
    () => ({
      api_host: apiHost,
      defaults: CONFIG_DEFAULTS,
      // `before_send` rather than `register`: super-properties are persisted,
      // and the cookie is shared across subdomains by default, so one surface
      // could inherit a stale `product`/`surface` from whichever site was
      // visited last. Stamping at send time is derived from nothing persisted
      // and cannot drift.
      before_send: (event) =>
        event && {
          ...event,
          properties: { ...event.properties, product, surface },
        },
    }),
    [apiHost, product, surface],
  );

  if (!apiKey) {
    return children;
  }

  return (
    <PostHogProvider apiKey={apiKey} options={options}>
      {children}
    </PostHogProvider>
  );
}
