"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import {
  BarChart3,
  Code2,
  Database,
  Globe,
  Layout,
  Rocket,
  ShieldCheck,
  Smartphone,
  Zap,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-label="GitHub"
    {...props}
  >
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

export default function Home(): React.ReactNode {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="rounded-lg bg-primary p-1.5 text-primary-foreground shadow-sm">
              <Rocket className="h-5 w-5" />
            </div>
            <Typography
              variant="large"
              as="span"
              className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
            >
              Turbostack
            </Typography>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="h-6 w-px bg-border/50 hidden sm:block" />
            <SignedOut>
              <div className="flex items-center gap-3">
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm" className="font-medium">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm" className="rounded-full px-6">
                    Get Started
                  </Button>
                </SignUpButton>
              </div>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center gap-4">
                <Typography
                  variant="small"
                  className="hidden text-muted-foreground sm:inline-block font-medium"
                >
                  Welcome back
                </Typography>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox:
                        "h-9 w-9 border border-border shadow-sm hover:ring-2 hover:ring-primary/20 transition-all",
                    },
                  }}
                />
              </div>
            </SignedIn>
          </div>
        </div>
      </nav>

      <main className="flex flex-1 flex-col items-center justify-center gap-12 p-8 text-center sm:gap-24">
        {/* Hero Section */}
        <section className="flex max-w-4xl flex-col items-center gap-6 animate-in fade-in zoom-in duration-700">
          <Typography
            variant="small"
            className="rounded-full bg-primary/10 px-4 py-1.5 font-semibold text-primary shadow-sm ring-1 ring-primary/20"
          >
            Production Ready Template
          </Typography>
          <Typography
            variant="h1"
            className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent pb-2 lg:text-7xl"
          >
            The Modern Monorepo
          </Typography>
          <Typography variant="lead" className="max-w-2xl leading-relaxed">
            The ultimate type-safe, full-stack monorepo for Web and Mobile.
            Turbostack is powered by the best-in-class tools for 2026.
          </Typography>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-8 text-base shadow-sm"
              render={
                <a
                  href="https://github.com/cloudexible-org/turbostack"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GithubIcon className="mr-2 h-5 w-5" />
                  GitHub
                </a>
              }
            />
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Zap className="h-6 w-6" />}
            title="Instant Setup"
            description="Run 'pnpm setup:envs' to automatically configure your environment files across the monorepo."
          />
          <FeatureCard
            icon={<Database className="h-6 w-6" />}
            title="Convex Backend"
            description="Real-time database and backend functions. Type-safe and reactive by default."
          />
          <FeatureCard
            icon={<Globe className="h-6 w-6" />}
            title="Next.js Web"
            description="The React framework for the web. Server Components, Routing, and Optimization."
          />
          <FeatureCard
            icon={<Smartphone className="h-6 w-6" />}
            title="Expo Native"
            description="Build native mobile apps for iOS and Android using React Native."
          />
          <FeatureCard
            icon={<Zap className="h-6 w-6" />}
            title="Turborepo"
            description="High-performance build system for JavaScript and TypeScript monorepos."
          />
          <FeatureCard
            icon={<ShieldCheck className="h-6 w-6" />}
            title="Clerk Auth"
            description="Complete user management and authentication for modern applications."
          />
          <FeatureCard
            icon={<Layout className="h-6 w-6" />}
            title="Shared UI"
            description="Share components and generics across platforms. Fully shadcn-friendly."
          />
          <FeatureCard
            icon={<Rocket className="h-6 w-6" />}
            title="Vercel Optimized"
            description="Instant deployments, Edge functions, and built-in Analytics ready for production."
          />
          <FeatureCard
            icon={<Code2 className="h-6 w-6" />}
            title="Biome Toolchain"
            description="High-performance linter and formatter. One tool to rule them all."
          />
        </section>
      </main>

      <footer className="border-t border-border/40 py-8 text-center text-sm text-muted-foreground">
        <Typography variant="muted">
          Built with ❤️ by{" "}
          <a
            href="https://cloudexible.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground hover:underline"
          >
            Cloudexible
          </a>
        </Typography>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}): React.ReactNode {
  return (
    <div className="group rounded-lg border border-border bg-card p-6 text-left shadow-sm transition-all hover:shadow-md">
      <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-secondary p-2 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
        {icon}
      </div>
      <Typography
        variant="h3"
        className="mb-2 text-lg font-semibold text-card-foreground"
      >
        {title}
      </Typography>
      <Typography variant="muted" className="leading-normal">
        {description}
      </Typography>
    </div>
  );
}
