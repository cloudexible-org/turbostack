import { AnalyticsProvider } from "@repo/analytics";
import {
  DEFAULT_API_HOST,
  posthogHosts,
  RELAY_PATH,
} from "@repo/analytics/hosts";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
// Validates environment variables at startup (see ./env.ts).
import { env } from "./env";

const convex = new ConvexReactClient(env.VITE_CONVEX_URL);

/**
 * Where PostHog events go. A production build sends them to `RELAY_PATH` on
 * this origin, which `vercel.json` rewrites to PostHog US cloud, so the ad
 * blockers that block `*.posthog.com` don't hide visitors and ad conversions.
 * Elsewhere there is no relay: the Vite dev server has no such rewrite, and a
 * host other than US cloud isn't the one `vercel.json` relays to. Those send
 * to PostHog directly. (A native build, such as Capacitor, has no web origin
 * and must send directly too.)
 */
const posthogApiHost =
  import.meta.env.PROD &&
  posthogHosts(env.VITE_POSTHOG_HOST).ingest === DEFAULT_API_HOST
    ? RELAY_PATH
    : env.VITE_POSTHOG_HOST;

// Register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered:", registration.scope);
      })
      .catch((error) => {
        console.error("SW registration failed:", error);
      });
  });
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <AnalyticsProvider
      apiKey={env.VITE_POSTHOG_KEY}
      apiHost={posthogApiHost}
      uiHost={posthogHosts(env.VITE_POSTHOG_HOST).ui}
      // Product name in the shared PostHog project: forks rename it (AGENTS.md §8).
      product="turbostack"
      surface="app"
    >
      <ConvexProvider client={convex}>
        <App />
      </ConvexProvider>
    </AnalyticsProvider>
  </StrictMode>,
);
