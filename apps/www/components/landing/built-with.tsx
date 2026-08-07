"use client";

import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { Reveal, revealGroup, revealItem } from "@/components/landing/reveal";
import { Typography } from "@/components/ui/typography";
import instaclubDark from "@/public/showcase/instaclub-dark.png";
import instaclubLight from "@/public/showcase/instaclub-light.png";

const SITE_URL = "https://instaclub.app";

/** What the template gives you, phrased as what Instaclub actually ships. */
const PROOF_POINTS = [
  "One repo, three targets — marketing site, app, and native builds",
  "Real-time member and event data, type-safe end to end",
  "Shipped to the App Store and Google Play from the same codebase",
] as const;

export function BuiltWith(): React.ReactNode {
  return (
    <section data-testid="built-with" className="w-full px-6 py-24 sm:py-32">
      <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
        <Reveal className="flex flex-col items-start gap-5">
          <Typography
            variant="small"
            className="font-semibold text-primary uppercase tracking-widest"
          >
            In production
          </Typography>

          <Typography variant="h2" className="border-none pb-0 text-4xl">
            Built with Turbostack
          </Typography>

          <Typography variant="lead">
            <a
              href={SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Instaclub
            </a>{" "}
            is an AI-powered platform for clubs, teams, and organizations —
            events, members, forms, and expenses in one place. It started from
            this template.
          </Typography>

          <ul className="flex flex-col gap-3">
            {PROOF_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                />
                <Typography variant="muted" as="span">
                  {point}
                </Typography>
              </li>
            ))}
          </ul>

          <a
            href={SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 font-medium text-primary text-sm"
          >
            Visit instaclub.app
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </Reveal>

        <BrowserFrame />
      </div>
    </section>
  );
}

/**
 * The screenshot is captured in both themes and swapped with `dark:` so the
 * embed never fights the surrounding page.
 */
function BrowserFrame(): React.ReactNode {
  return (
    <motion.a
      href={SITE_URL}
      target="_blank"
      rel="noopener noreferrer"
      variants={revealGroup}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="group block overflow-hidden rounded-xl border border-border bg-card shadow-lg"
      aria-label="Instaclub — opens in a new tab"
    >
      <motion.div
        variants={revealItem}
        className="flex items-center gap-2 border-border/60 border-b bg-secondary/50 px-4 py-3"
      >
        <span className="h-3 w-3 rounded-full bg-destructive/60" />
        <span className="h-3 w-3 rounded-full bg-primary/40" />
        <span className="h-3 w-3 rounded-full bg-accent/60" />
        <div className="ml-2 flex-1 truncate rounded-md bg-background/60 px-3 py-1">
          <Typography variant="muted" as="span" className="font-mono text-xs">
            instaclub.app
          </Typography>
        </div>
      </motion.div>

      <motion.div variants={revealItem} className="relative">
        <Image
          src={instaclubLight}
          alt="The Instaclub landing page, an AI-powered club management platform built with Turbostack"
          placeholder="blur"
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="block h-auto w-full dark:hidden"
        />
        <Image
          src={instaclubDark}
          alt=""
          aria-hidden
          placeholder="blur"
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="hidden h-auto w-full dark:block"
        />
      </motion.div>
    </motion.a>
  );
}
