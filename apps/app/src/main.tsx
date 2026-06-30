import { AnalyticsProvider } from "@repo/analytics";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
// Validates environment variables at startup (see ./env.ts).
import { env } from "./env";

const convex = new ConvexReactClient(env.VITE_CONVEX_URL);

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
      apiHost={env.VITE_POSTHOG_HOST}
    >
      <ConvexProvider client={convex}>
        <App />
      </ConvexProvider>
    </AnalyticsProvider>
  </StrictMode>,
);
