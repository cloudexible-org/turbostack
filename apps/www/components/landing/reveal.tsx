"use client";

import { motion, type Variants } from "motion/react";

/** Standard ease-out curve shared by every reveal on the page. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/**
 * Pair these on a parent/child: the parent drives timing, each child animates
 * itself. Children must use `revealItem` for `staggerChildren` to reach them.
 */
export const revealGroup: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.1 },
  },
};

export const revealItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_OUT },
  },
};

/**
 * Reveals a block once it scrolls into view. `once` keeps the page calm on the
 * way back up — re-animating on every pass reads as noise, not polish.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}): React.ReactNode {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
