/** The signed-in person, as analytics needs them. */
export interface AnalyticsUser {
  /** A stable id from the auth provider, used as the PostHog distinct id. */
  id: string;
  email?: string | null;
  name?: string | null;
  /** When the account was created, to tell a sign-up from a sign-in. */
  createdAt?: Date | null;
}

/**
 * How recently an account must have been created for its first identify to
 * count as a sign-up. Generous enough to cover entering the emailed code,
 * short enough that a returning user on a new device doesn't look new.
 */
export const NEW_ACCOUNT_WINDOW_MS = 10 * 60 * 1000;

/** What the browser's analytics identity should do for the current user. */
export type IdentityAction =
  | { kind: "none" }
  | { kind: "reset" }
  | {
      kind: "identify";
      /** Another person was identified in this browser: forget them first. */
      resetFirst: boolean;
      /** This is the account's first identify, moments after it was made. */
      signedUp: boolean;
    };

/**
 * Decides how to bring PostHog's identity in line with who is signed in.
 *
 * `user` is `undefined` while auth is still loading (do nothing yet) and
 * `null` when signed out. Identifying an already-identified browser again is
 * skipped, so this is safe to run on every render.
 */
export function identityAction({
  user,
  distinctId,
  isIdentified,
  now,
}: {
  user: AnalyticsUser | null | undefined;
  /** PostHog's current distinct id. */
  distinctId: string;
  /** Whether PostHog has already identified this browser as someone. */
  isIdentified: boolean;
  now: number;
}): IdentityAction {
  if (user === undefined) return { kind: "none" };
  if (user === null) return isIdentified ? { kind: "reset" } : { kind: "none" };
  if (isIdentified && distinctId === user.id) return { kind: "none" };
  return {
    kind: "identify",
    resetFirst: isIdentified,
    signedUp: isNewAccount(user.createdAt, now),
  };
}

/** Whether an account was created within `NEW_ACCOUNT_WINDOW_MS` of `now`. */
export function isNewAccount(
  createdAt: Date | null | undefined,
  now: number,
): boolean {
  if (!createdAt) return false;
  const age = now - createdAt.getTime();
  return age >= 0 && age <= NEW_ACCOUNT_WINDOW_MS;
}
