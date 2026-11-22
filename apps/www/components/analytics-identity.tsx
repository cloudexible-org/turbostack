"use client";

import { useUser } from "@clerk/nextjs";
import { type AnalyticsUser, useIdentifyUser } from "@repo/analytics";
import { useTrack } from "@/lib/analytics";

/**
 * Ties PostHog to the signed-in Clerk user: identifies them on sign-in (so the
 * ad that brought them stays on their person profile) and resets on sign-out.
 * A brand-new account also sends `user_signed_up`, the lead event for ads.
 *
 * Mounted only inside `ClerkProvider`, since `useUser` needs it.
 */
export function AnalyticsIdentity(): null {
  const { isLoaded, user } = useUser();
  const track = useTrack();

  const analyticsUser: AnalyticsUser | null | undefined = !isLoaded
    ? undefined
    : user
      ? {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress ?? null,
          name: user.fullName,
          createdAt: user.createdAt,
        }
      : null;

  useIdentifyUser(analyticsUser, () => track("user_signed_up", {}));
  return null;
}
