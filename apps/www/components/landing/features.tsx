"use client";

import {
  Code2,
  Database,
  Globe,
  Layout,
  Rocket,
  ShieldCheck,
  Smartphone,
  Zap,
} from "lucide-react";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import { Reveal, revealGroup, revealItem } from "@/components/landing/reveal";
import { Typography } from "@/components/ui/typography";

const FEATURES = [
  {
    icon: Zap,
    title: "Instant Setup",
    description:
      "Run 'pnpm setup:envs' to automatically configure your environment files across the monorepo.",
  },
  {
    icon: Database,
    title: "Convex Backend",
    description:
      "Real-time database and backend functions. Type-safe and reactive by default.",
  },
  {
    icon: Globe,
    title: "Next.js Marketing",
    description:
      "Landing pages and marketing site powered by the React framework. Server Components and SEO built-in.",
  },
  {
    icon: Smartphone,
    title: "Vite App",
    description:
      "Lightning-fast SPA with Vite + React. Capacitor-ready for native iOS and Android deployments.",
  },
  {
    icon: Zap,
    title: "Turborepo",
    description:
      "High-performance build system for JavaScript and TypeScript monorepos.",
  },
  {
    icon: ShieldCheck,
    title: "Clerk Auth",
    description:
      "Complete user management and authentication for modern applications.",
  },
  {
    icon: Layout,
    title: "Shared UI",
    description:
      "Share components and generics across platforms. Fully shadcn-friendly.",
  },
  {
    icon: Rocket,
    title: "Vercel Optimized",
    description:
      "Instant deployments, Edge functions, and built-in Analytics ready for production.",
  },
  {
    icon: Code2,
    title: "Biome Toolchain",
    description:
      "High-performance linter and formatter. One tool to rule them all.",
  },
] as const;

export function Features(): React.ReactNode {
  return (
    <section id="features" className="w-full px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mb-16 flex flex-col items-center gap-4 text-center">
          <Typography variant="h2" className="border-none pb-0 text-4xl">
            Everything, already decided
          </Typography>
          <Typography variant="lead" className="max-w-2xl">
            The choices you would spend a week making, made and wired together.
          </Typography>
        </Reveal>

        <motion.div
          variants={revealGroup}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}): React.ReactNode {
  // Track the pointer within the card to light a spotlight at the cursor.
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spotlight = useMotionTemplate`radial-gradient(18rem circle at ${mouseX}px ${mouseY}px, var(--color-primary), transparent 70%)`;

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>): void {
    const bounds = event.currentTarget.getBoundingClientRect();
    mouseX.set(event.clientX - bounds.left);
    mouseY.set(event.clientY - bounds.top);
  }

  return (
    <motion.div
      variants={revealItem}
      onMouseMove={handleMouseMove}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="group relative overflow-hidden rounded-lg border border-border bg-card p-6 text-left shadow-sm transition-shadow duration-300 hover:shadow-lg"
    >
      <motion.div
        aria-hidden
        style={{ background: spotlight }}
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-[0.07]"
      />

      <div className="relative">
        <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-secondary p-2 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <Typography
          variant="h3"
          className="mb-2 font-semibold text-card-foreground text-lg"
        >
          {title}
        </Typography>
        <Typography variant="muted" className="leading-normal">
          {description}
        </Typography>
      </div>
    </motion.div>
  );
}
