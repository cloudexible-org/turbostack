"use client";

import { ReactLenis } from "lenis/react";
import { MotionConfig, useReducedMotion } from "motion/react";

/**
 * Single client boundary for the two motion concerns on the marketing site.
 *
 * `MotionConfig reducedMotion="user"` makes every `motion` component below drop
 * transform animations while keeping opacity, so individual sections never have
 * to branch on the media query themselves. Lenis is skipped entirely for those
 * users, since smoothing is the thing they asked not to have.
 */
export function MotionProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  const prefersReducedMotion = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
      {prefersReducedMotion ? (
        children
      ) : (
        // `root` targets document scroll, so no wrapper element is rendered and
        // the sticky nav keeps working.
        <ReactLenis root options={{ lerp: 0.1, duration: 1.2 }}>
          {children}
        </ReactLenis>
      )}
    </MotionConfig>
  );
}
