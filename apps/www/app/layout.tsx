import { AnalyticsProvider } from "@repo/analytics";
import { Analytics } from "@vercel/analytics/react";
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
            apiHost={env.NEXT_PUBLIC_POSTHOG_HOST}
          >
            <ConvexClientProvider>
              <MotionProvider>{children}</MotionProvider>
            </ConvexClientProvider>
          </AnalyticsProvider>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
