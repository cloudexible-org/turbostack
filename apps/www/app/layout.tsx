import { AnalyticsProvider } from "@repo/analytics";
// The server-safe entry: the package root is a client module.
import { posthogHosts, RELAY_PATH } from "@repo/analytics/hosts";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MotionProvider } from "@/components/motion-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { env } from "@/env";
import { ConvexClientProvider } from "./ConvexClientProvider";
import "lenis/dist/lenis.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Turbostack | Modern Monorepo",
  description: "The high-performance full-stack monorepo starter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactNode {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AnalyticsProvider
            apiKey={env.NEXT_PUBLIC_POSTHOG_KEY}
            // Relayed through this origin (next.config.ts) so ad blockers
            // don't drop events; the toolbar still links to PostHog itself.
            apiHost={RELAY_PATH}
            uiHost={posthogHosts(env.NEXT_PUBLIC_POSTHOG_HOST).ui}
            // Product name in the shared PostHog project: forks rename it (AGENTS.md §8).
            product="turbostack"
            surface="www"
          >
            <ConvexClientProvider>
              <MotionProvider>{children}</MotionProvider>
            </ConvexClientProvider>
          </AnalyticsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
