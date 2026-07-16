"use client";

import { motion } from "motion/react";
import { Reveal } from "@/components/landing/reveal";
import { Typography } from "@/components/ui/typography";

const STACK = [
  "Next.js 16",
  "Vite",
  "Convex",
  "Turborepo",
  "React 19",
  "Clerk",
  "Tailwind v4",
  "Biome",
  "Capacitor",
  "Vercel",
  "PostHog",
  "Playwright",
] as const;

export function StackMarquee(): React.ReactNode {
  return (
    <section className="w-full border-border/40 border-y bg-muted/30 py-12">
      <Reveal className="mb-8 text-center">
        <Typography
          variant="small"
          className="font-semibold text-muted-foreground uppercase tracking-widest"
        >
          Every batteries-included piece, already wired
        </Typography>
      </Reveal>

      {/* Edges fade into the background so the loop has no visible seam. */}
      <div
        className="relative flex overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
        }}
      >
        {/* Two identical tracks: the first scrolls exactly its own width, so the
            second lands where the first began and the reset is invisible. */}
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 40,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          className="flex w-max shrink-0 gap-4 pr-4"
        >
          {[...STACK, ...STACK].map((name, index) => (
            <StackChip
              // Duplicated on purpose — index disambiguates the second pass.
              key={`${name}-${index}`}
              name={name}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function StackChip({ name }: { name: string }): React.ReactNode {
  return (
    <div className="flex shrink-0 items-center rounded-full border border-border bg-card px-5 py-2.5 shadow-sm">
      <Typography
        variant="small"
        as="span"
        className="whitespace-nowrap text-card-foreground"
      >
        {name}
      </Typography>
    </div>
  );
}
