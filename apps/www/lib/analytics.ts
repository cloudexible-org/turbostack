"use client";

import { type Capture, useCapture } from "@repo/analytics";

/**
 * Every custom event this app sends to PostHog, and its properties. A fork
 * adds its own funnel here: the lead and the conversion its ads are bought
 * for (for example `project_created`), and any viral-loop events. Forward the
 * lead and conversion to Meta and OpenAI with PostHog's ads conversion
 * destinations rather than adding their pixels to the app.
 *
 * No event may carry an email, a name, or anything else a person typed:
 * ids, counts, booleans and enums only. Names are `object_verb`, past tense.
 * Pageviews, autocapture, `product` and `surface` come for free.
 */
export type AppEvents = {
  /** An account was created, moments ago: the lead event for ads. */
  user_signed_up: Record<string, never>;
};

/** `capture`, typed to this app's events. A no-op without a PostHog key. */
export function useTrack(): Capture<AppEvents> {
  return useCapture<AppEvents>();
}
