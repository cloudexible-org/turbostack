"use client";

import { SignUpButton } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import * as React from "react";
import { GithubIcon } from "@/components/landing/github-icon";
import { revealGroup, revealItem } from "@/components/landing/reveal";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { env } from "@/env";

export function Cta(): React.ReactNode {
  const hasClerk = !!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const sectionRef = React.useRef<HTMLElement>(null);

  // The glow grows as the section arrives — a scroll-linked payoff for reaching
  // the end of the page.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "center center"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [0.6, 1]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section
      ref={sectionRef}
      data-testid="cta"
      className="relative w-full overflow-hidden px-6 py-32"
    >
      <motion.div
        aria-hidden
        style={{ scale, opacity }}
        className="-translate-x-1/2 pointer-events-none absolute bottom-0 left-1/2 h-[30rem] w-[45rem] rounded-full bg-primary/20 blur-[130px]"
      />

      <motion.div
        variants={revealGroup}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        className="relative mx-auto flex max-w-2xl flex-col items-center gap-6 text-center"
      >
        <motion.div variants={revealItem}>
          <Typography
            variant="h2"
            className="border-none pb-0 text-4xl lg:text-5xl"
          >
            Ship on day one
          </Typography>
        </motion.div>

        <motion.div variants={revealItem}>
          <Typography variant="lead">
            Clone the template, run three commands, and start building the part
            that is actually yours.
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
          <Button
            variant="outline"
            size="lg"
            className="h-12 rounded-full px-8 text-base shadow-sm"
            render={
              <a
                href="https://github.com/cloudexible-org/turbostack"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GithubIcon className="mr-2 h-5 w-5" />
                Star on GitHub
              </a>
            }
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
