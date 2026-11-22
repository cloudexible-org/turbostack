"use client";

import type { PostHogConfig } from "posthog-js";
import posthog from "posthog-js";
import { PostHogProvider, usePostHog } from "posthog-js/react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { DEFAULT_API_HOST } from "./hosts";
import { type AnalyticsUser, identityAction } from "./identity";

export { usePostHog } from "posthog-js/react";
export {
  type AnalyticsUser,
  type IdentityAction,
  identityAction,
  isNewAccount,
  NEW_ACCOUNT_WINDOW_MS,
} from "./identity";
export { posthog };

/**
 * Opts into PostHog's current default behaviours rather than the legacy ones.
 * The one that matters most here is `capture_pageview: 'history_change'` — with
 * the legacy default a pageview fires only on a hard document load, so every
 * client-side navigation (App Router, or an SPA's router) goes uncounted.
 *
 * Safe to move forward, but read PostHog's notes first: each date flips more
 * defaults, and bumping it mid-stream makes data before and after incomparable.
 */
const CONFIG_DEFAULTS = "2026-06-25" as const;

/**
 * Whether PostHog was initialized. Without a key the provider is skipped, and
 * `usePostHog()` then hands back the global client uninitialized, which
 * warns on `capture` and throws on reading the distinct id. The hooks below
 * check this instead.
 */
const AnalyticsEnabled = createContext(false);

export interface AnalyticsProviderProps {
  /** PostHog project API key. When absent, analytics is not initialized. */
  apiKey?: string;
  /**
   * Where the browser sends events: a PostHog ingestion host, or a same-origin
   * relay path (`RELAY_PATH`) that the app rewrites to one. Defaults to
   * PostHog US cloud.
   */
  apiHost?: string;
  /**
   * The PostHog app's URL. Required when `apiHost` is a relay path, so links
   * such as the toolbar still point at PostHog (`posthogHosts(...).ui`).
   */
  uiHost?: string;
  /**
   * The product sending the event, stamped onto every event as `product`.
   * Several products report into one shared PostHog project, so this is what
   * splits them apart — `$host` only works for as long as no two of them ever
   * share a domain.
   */
  product: string;
  /**
   * The part of the product doing the sending (`www`, `app`, `admin`), stamped
   * onto every event as `surface`. Server-side capture uses `server`.
   */
  surface: string;
  children: ReactNode;
}

/**
 * Mounts the PostHog provider only when an API key is present. With no key the
 * provider is skipped entirely and the hooks below no-op, keeping local and CI
 * runs silent without any conditional logic at call sites.
 *
 * Tip: for custom events tied to UI transitions, diff state in a hook rather
 * than firing from a reducer, so business logic stays free of side effects.
 */
export function AnalyticsProvider({
  apiKey,
  apiHost = DEFAULT_API_HOST,
  uiHost,
  product,
  surface,
  children,
}: AnalyticsProviderProps): ReactNode {
  const options = useMemo<Partial<PostHogConfig>>(
    () => ({
      api_host: apiHost,
      ...(uiHost && { ui_host: uiHost }),
      defaults: CONFIG_DEFAULTS,
      // `before_send` rather than `register`: super-properties are persisted
      // in the PostHog cookie, so a browser could keep sending a stale
      // `product`/`surface` left behind by an earlier build. Stamping at send
      // time is derived from nothing and cannot drift.
      before_send: (event) =>
        event && {
          ...event,
          properties: { ...event.properties, product, surface },
        },
    }),
    [apiHost, uiHost, product, surface],
  );

  if (!apiKey) {
    return children;
  }

  return (
    <PostHogProvider apiKey={apiKey} options={options}>
      <AnalyticsEnabled.Provider value={true}>
        {children}
      </AnalyticsEnabled.Provider>
    </PostHogProvider>
  );
}

/** A property value PostHog can filter and break down on. */
export type EventPropertyValue = string | number | boolean | null;

/** An app's event catalog: each event name and the properties it carries. */
export type EventCatalog = Record<string, Record<string, EventPropertyValue>>;

/** Captures one of the catalog's events with exactly its properties. */
export type Capture<Events extends EventCatalog> = <
  Name extends keyof Events & string,
>(
  event: Name,
  properties: Events[Name],
) => void;

/**
 * A typed `capture` for an app's own event catalog, so an event can't be sent
 * with a misspelt name or the wrong properties. A no-op without analytics.
 *
 *     type Events = { project_created: { project_id: string } };
 *     const capture = useCapture<Events>();
 *     capture("project_created", { project_id: id });
 */
export function useCapture<Events extends EventCatalog>(): Capture<Events> {
  const enabled = useContext(AnalyticsEnabled);
  const client = usePostHog();
  return useCallback<Capture<Events>>(
    (event, properties) => {
      if (enabled) client.capture(event, properties);
    },
    [enabled, client],
  );
}

/**
 * Keeps PostHog's identity in step with who is signed in: identifies them on
 * sign-in, so their first-touch UTMs and ad click ids (which PostHog holds
 * for an anonymous visitor) land on their person profile, and resets on
 * sign-out, so the next person on a shared device starts fresh.
 *
 * Pass `undefined` while auth is loading and `null` when signed out.
 * `onSignUp` runs once, right after the first identify of a brand-new account.
 */
export function useIdentifyUser(
  user: AnalyticsUser | null | undefined,
  onSignUp?: () => void,
): void {
  const enabled = useContext(AnalyticsEnabled);
  const client = usePostHog();
  // Kept in a ref so a new callback each render doesn't re-run the effect.
  const onSignUpRef = useRef(onSignUp);
  onSignUpRef.current = onSignUp;

  const id = user === undefined ? undefined : (user?.id ?? null);
  const email = user?.email ?? null;
  const name = user?.name ?? null;
  const createdAt = user?.createdAt?.getTime() ?? null;

  useEffect(() => {
    if (!enabled) return;
    const current: AnalyticsUser | null | undefined =
      id === undefined || id === null
        ? id
        : {
            id,
            email,
            name,
            createdAt: createdAt === null ? null : new Date(createdAt),
          };
    const action = identityAction({
      user: current,
      distinctId: client.get_distinct_id(),
      isIdentified: client.get_property("$user_state") === "identified",
      now: Date.now(),
    });
    if (action.kind === "reset") {
      client.reset();
    } else if (action.kind === "identify" && current) {
      if (action.resetFirst) client.reset();
      client.identify(current.id, {
        ...(email && { email }),
        ...(name && { name }),
      });
      if (action.signedUp) onSignUpRef.current?.();
    }
  }, [enabled, client, id, email, name, createdAt]);
}
