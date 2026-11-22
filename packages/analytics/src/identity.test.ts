import { describe, expect, it } from "vitest";
import {
  identityAction,
  isNewAccount,
  NEW_ACCOUNT_WINDOW_MS,
} from "./identity";

const NOW = Date.UTC(2026, 10, 14, 12);
const minutesAgo = (m: number): Date => new Date(NOW - m * 60_000);
const anonymous = { distinctId: "019a-anon", isIdentified: false, now: NOW };

describe("identityAction", () => {
  it("waits while auth is loading", () => {
    expect(identityAction({ ...anonymous, user: undefined })).toEqual({
      kind: "none",
    });
  });

  it("leaves an anonymous visitor alone", () => {
    expect(identityAction({ ...anonymous, user: null })).toEqual({
      kind: "none",
    });
  });

  it("resets on sign-out", () => {
    expect(
      identityAction({
        user: null,
        distinctId: "user_1",
        isIdentified: true,
        now: NOW,
      }),
    ).toEqual({ kind: "reset" });
  });

  it("counts a brand-new account as a sign-up", () => {
    expect(
      identityAction({
        ...anonymous,
        user: { id: "user_1", createdAt: minutesAgo(1) },
      }),
    ).toEqual({ kind: "identify", resetFirst: false, signedUp: true });
  });

  it("counts an older account as a sign-in", () => {
    expect(
      identityAction({
        ...anonymous,
        user: { id: "user_1", createdAt: minutesAgo(60 * 24) },
      }),
    ).toEqual({ kind: "identify", resetFirst: false, signedUp: false });
  });

  it("skips a browser already identified as this user", () => {
    expect(
      identityAction({
        user: { id: "user_1", createdAt: minutesAgo(1) },
        distinctId: "user_1",
        isIdentified: true,
        now: NOW,
      }),
    ).toEqual({ kind: "none" });
  });

  it("forgets the previous person before identifying another", () => {
    expect(
      identityAction({
        user: { id: "user_2", createdAt: minutesAgo(60 * 24) },
        distinctId: "user_1",
        isIdentified: true,
        now: NOW,
      }),
    ).toEqual({ kind: "identify", resetFirst: true, signedUp: false });
  });
});

describe("isNewAccount", () => {
  it("is true inside the window, including its edge", () => {
    expect(isNewAccount(minutesAgo(0), NOW)).toBe(true);
    expect(isNewAccount(new Date(NOW - NEW_ACCOUNT_WINDOW_MS), NOW)).toBe(true);
  });

  it("is false outside it, in the future, or without a date", () => {
    expect(isNewAccount(new Date(NOW - NEW_ACCOUNT_WINDOW_MS - 1), NOW)).toBe(
      false,
    );
    expect(isNewAccount(new Date(NOW + 60_000), NOW)).toBe(false);
    expect(isNewAccount(null, NOW)).toBe(false);
    expect(isNewAccount(undefined, NOW)).toBe(false);
  });
});
