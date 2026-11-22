import { describe, expect, it } from "vitest";
import {
  DEFAULT_API_HOST,
  posthogHosts,
  RELAY_PATH,
  relayRewrites,
} from "./hosts";

describe("posthogHosts", () => {
  it("maps US cloud to its assets and app hosts", () => {
    expect(posthogHosts("https://us.i.posthog.com")).toEqual({
      ingest: "https://us.i.posthog.com",
      assets: "https://us-assets.i.posthog.com",
      ui: "https://us.posthog.com",
    });
  });

  it("maps EU cloud the same way", () => {
    expect(posthogHosts("https://eu.i.posthog.com/")).toEqual({
      ingest: "https://eu.i.posthog.com",
      assets: "https://eu-assets.i.posthog.com",
      ui: "https://eu.posthog.com",
    });
  });

  it("defaults to US cloud", () => {
    expect(posthogHosts()).toEqual(posthogHosts(DEFAULT_API_HOST));
  });

  it("uses a self-hosted origin for all three", () => {
    expect(posthogHosts("https://ph.example.com/path")).toEqual({
      ingest: "https://ph.example.com",
      assets: "https://ph.example.com",
      ui: "https://ph.example.com",
    });
  });
});

describe("relayRewrites", () => {
  it("sends assets to the assets host before the ingestion catch-all", () => {
    expect(relayRewrites("https://us.i.posthog.com")).toEqual([
      {
        source: `${RELAY_PATH}/static/:path(.*)`,
        destination: "https://us-assets.i.posthog.com/static/:path",
      },
      {
        source: `${RELAY_PATH}/array/:path(.*)`,
        destination: "https://us-assets.i.posthog.com/array/:path",
      },
      {
        source: `${RELAY_PATH}/:path(.*)`,
        destination: "https://us.i.posthog.com/:path",
      },
    ]);
  });

  it("honours a custom relay path", () => {
    expect(relayRewrites(undefined, "/x").map((r) => r.source)).toEqual([
      "/x/static/:path(.*)",
      "/x/array/:path(.*)",
      "/x/:path(.*)",
    ]);
  });
});
