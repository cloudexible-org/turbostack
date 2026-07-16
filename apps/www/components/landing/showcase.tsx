"use client";

import { motion } from "motion/react";
import {
  EASE_OUT,
  Reveal,
  revealGroup,
  revealItem,
} from "@/components/landing/reveal";
import { Typography } from "@/components/ui/typography";

const STEPS = [
  { command: "pnpm install", output: "Done in 2.7s" },
  { command: "pnpm setup:envs", output: "✨ Setup complete!" },
  { command: "pnpm dev", output: "www · app · api  ready" },
] as const;

export function Showcase(): React.ReactNode {
  return (
    <section className="w-full border-border/40 border-t bg-muted/30 px-6 py-24 sm:py-32">
      <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
        <Reveal className="flex flex-col gap-4">
          <Typography
            variant="small"
            className="font-semibold text-primary uppercase tracking-widest"
          >
            Three commands
          </Typography>
          <Typography variant="h2" className="border-none pb-0 text-4xl">
            From clone to running stack
          </Typography>
          <Typography variant="lead">
            No per-app env hunting, no manual linking. The setup script walks
            the workspace and configures every package for you.
          </Typography>
        </Reveal>

        <Terminal />
      </div>
    </section>
  );
}

function Terminal(): React.ReactNode {
  return (
    <motion.div
      variants={revealGroup}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      className="overflow-hidden rounded-xl border border-border bg-card shadow-lg"
    >
      <div className="flex items-center gap-2 border-border/60 border-b bg-secondary/50 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-destructive/60" />
        <span className="h-3 w-3 rounded-full bg-primary/40" />
        <span className="h-3 w-3 rounded-full bg-accent/60" />
        <Typography
          variant="muted"
          as="span"
          className="ml-2 font-mono text-xs"
        >
          turbostack
        </Typography>
      </div>

      <div className="flex flex-col gap-3 p-5 font-mono text-sm">
        {STEPS.map((step) => (
          <motion.div key={step.command} variants={revealItem}>
            <div className="flex gap-2">
              <span className="text-primary" aria-hidden>
                $
              </span>
              <span className="text-card-foreground">{step.command}</span>
            </div>
            <div className="pl-4 text-muted-foreground">{step.output}</div>
          </motion.div>
        ))}

        <motion.div
          variants={revealItem}
          className="flex gap-2 text-card-foreground"
        >
          <span className="text-primary" aria-hidden>
            $
          </span>
          <motion.span
            aria-hidden
            animate={{ opacity: [1, 1, 0, 0] }}
            transition={{
              duration: 1.1,
              repeat: Number.POSITIVE_INFINITY,
              ease: EASE_OUT,
              times: [0, 0.5, 0.5, 1],
            }}
            className="inline-block h-4 w-2 bg-primary"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
