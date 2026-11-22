import { DEFAULT_API_HOST, relayRewrites } from "@repo/analytics/hosts";
import { describe, expect, it } from "vitest";
import vercel from "../vercel.json";

describe("vercel.json", () => {
  it("relays PostHog to US cloud, as main.tsx expects", () => {
    // `vercel.json` is static, so it can't call `relayRewrites`; this keeps
    // the two in step. An SPA fallback to `index.html`, if one is added,
    // goes after these.
    expect(vercel.rewrites.slice(0, 3)).toEqual(
      relayRewrites(DEFAULT_API_HOST),
    );
  });
});
