"use client";

import { SignUpButton } from "@clerk/nextjs";
import { ArrowRight, ChevronDown } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import * as React from "react";
import { GithubIcon } from "@/components/landing/github-icon";
import { EASE_OUT, revealGroup, revealItem } from "@/components/landing/reveal";
import { Button, ButtonLink } from "@/components/ui/button";
import { NewTabHint } from "@/components/ui/new-tab-hint";
import { Typography } from "@/components/ui/typography";
import { env } from "@/env";

export function Hero(): React.ReactNode {
  const hasClerk = !!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const sectionRef = React.useRef<HTMLElement>(null);

  // Drift the hero up and out as it scrolls away, so the section below feels
  // like it moves over the top of it rather than after it.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative flex min-h-[calc(100svh-4rem)] w-full items-center justify-center overflow-hidden px-6 py-24"
    >
      <BackdropGlow />

      <motion.div
        data-testid="hero-content"
        style={{ y, opacity }}
        variants={revealGroup}
        initial="hidden"
        animate="visible"
        className="relative flex max-w-4xl flex-col items-center gap-6 text-center"
      >
        <motion.div variants={revealItem}>
          <Typography
            variant="small"
            className="inline-block rounded-full bg-primary/10 px-4 py-1.5 font-semibold text-primary shadow-sm ring-1 ring-primary/20"
          >
            Production Ready Template
          </Typography>
        </motion.div>

        <motion.div variants={revealItem}>
          <Typography
            variant="h1"
            className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text pb-2 text-transparent lg:text-7xl"
          >
            The Modern Monorepo
          </Typography>
        </motion.div>

        <motion.div variants={revealItem}>
          <Typography variant="lead" className="max-w-2xl leading-relaxed">
            The ultimate type-safe, full-stack monorepo for Web, App, and
            Native. Turbostack is powered by the best-in-class tools for 2026.
          </Typography>
        </motion.div>

        <motion.div
          variants={revealItem}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          {hasClerk && (
            <SignUpButton mode="modal">
              <Button
                size="lg"
                className="group h-12 rounded-full px-8 text-base"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </SignUpButton>
          )}
          <ButtonLink
            variant="outline"
            size="lg"
            className="h-12 rounded-full px-8 text-base shadow-sm"
            href="https://github.com/cloudexible-org/turbostack"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GithubIcon className="mr-2 h-5 w-5" />
            GitHub
            <NewTabHint />
          </ButtonLink>
        </motion.div>
      </motion.div>

      <ScrollCue />
    </section>
  );
}

/**
 * Two slow, offset gradient blooms. They are the only thing on the page that
 * moves without user input, so they stay well under the fold of perception.
 */
function BackdropGlow(): React.ReactNode {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
        transition={{
          duration: 18,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        className="-translate-x-1/2 absolute top-[-10%] left-1/2 h-[32rem] w-[32rem] rounded-full bg-primary/20 blur-[120px]"
      />
      <motion.div
        animate={{ x: [0, -50, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
        transition={{
          duration: 22,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        className="absolute right-[5%] bottom-[-15%] h-[28rem] w-[28rem] rounded-full bg-accent/20 blur-[120px]"
      />
    </div>
  );
}

function ScrollCue(): React.ReactNode {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2, duration: 0.6, ease: EASE_OUT }}
      className="-translate-x-1/2 absolute bottom-8 left-1/2"
    >
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      >
        <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden />
      </motion.div>
    </motion.div>
  );
}
