import { BuiltWith } from "@/components/landing/built-with";
import { Cta } from "@/components/landing/cta";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { Showcase } from "@/components/landing/showcase";
import { SiteNav } from "@/components/landing/site-nav";
import { StackMarquee } from "@/components/landing/stack-marquee";
import { NewTabHint } from "@/components/ui/new-tab-hint";
import { Typography } from "@/components/ui/typography";

export default function Home(): React.ReactNode {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteNav />

      <main className="flex flex-1 flex-col items-center">
        <Hero />
        <StackMarquee />
        <Features />
        <Showcase />
        <BuiltWith />
        <Cta />
      </main>

      <footer className="border-border/40 border-t py-8 text-center">
        <Typography variant="muted">
          Built with ❤️ by{" "}
          <a
            href="https://cloudexible.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground hover:underline"
          >
            Cloudexible
            <NewTabHint />
          </a>
        </Typography>
      </footer>
    </div>
  );
}
