// No imports, on purpose: it must stay loadable from plain Node and from
// config files, before any bundler is involved.

/** PostHog US cloud's ingestion host, used when no host is configured. */
export const DEFAULT_API_HOST = "https://us.i.posthog.com";

/**
 * The same-origin path the browser sends PostHog traffic to. The app rewrites
 * it to PostHog (`relayRewrites`: `apps/www/next.config.ts`, and by hand in
 * `apps/app/vercel.json`), so analytics survive the ad blockers and
 * tracking-protection lists that block `*.posthog.com` outright, which matters
 * most for counting ad conversions. Deliberately not `/ingest`, `/posthog` or
 * `/analytics`, which blocklists match by name.
 */
export const RELAY_PATH = "/relay";

/** The three hosts PostHog runs per cloud region. */
export interface PostHogHosts {
  /** Where events, flags and recordings are sent. */
  ingest: string;
  /** Where the SDK's lazily loaded scripts are served from. */
  assets: string;
  /** The PostHog app, for links such as the toolbar. */
  ui: string;
}

/**
 * Maps a PostHog ingestion host to its region's three hosts. A host that isn't
 * PostHog cloud (self-hosted, or a managed reverse proxy) serves all three.
 */
export function posthogHosts(apiHost: string = DEFAULT_API_HOST): PostHogHosts {
  const { origin, hostname } = new URL(apiHost);
  const region = /^([a-z]+)\.i\.posthog\.com$/.exec(hostname)?.[1];
  if (!region) return { ingest: origin, assets: origin, ui: origin };
  return {
    ingest: `https://${region}.i.posthog.com`,
    assets: `https://${region}-assets.i.posthog.com`,
    ui: `https://${region}.posthog.com`,
  };
}

/**
 * A rewrite, in the `{ source, destination }` shape both `vercel.json` and
 * Next.js use. Declared here rather than imported, to stay import-free.
 */
export interface Rewrite {
  source: string;
  destination: string;
}

/**
 * Rewrites that relay `relayPath` to PostHog. Static assets come first
 * because the catch-all would otherwise send them to the ingestion host, and
 * all of them must come before an SPA's catch-all to `index.html`.
 *
 * PostHog's API paths end in a slash (`/e/`, `/flags/`, `/i/v0/e/`), so each
 * rule captures the rest of the path with `:path(.*)`, trailing slash
 * included. Vercel's `:path*` stops short of a trailing slash: `/relay/e`
 * matched but `/relay/e/` fell through to the SPA and every event POST got a
 * 405. The host must also not redirect trailing slashes away (Vercel doesn't
 * unless `trailingSlash` is set).
 */
export function relayRewrites(
  apiHost: string = DEFAULT_API_HOST,
  relayPath: string = RELAY_PATH,
): Rewrite[] {
  const { ingest, assets } = posthogHosts(apiHost);
  return [
    {
      source: `${relayPath}/static/:path(.*)`,
      destination: `${assets}/static/:path`,
    },
    {
      source: `${relayPath}/array/:path(.*)`,
      destination: `${assets}/array/:path`,
    },
    { source: `${relayPath}/:path(.*)`, destination: `${ingest}/:path` },
  ];
}
