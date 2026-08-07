"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Rocket } from "lucide-react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
} from "motion/react";
import * as React from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { env } from "@/env";
import { cn } from "@/lib/utils";

export function SiteNav(): React.ReactNode {
  const hasClerk = !!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const [isScrolled, setIsScrolled] = React.useState(false);

  const { scrollYProgress, scrollY } = useScroll();
  // Spring the raw progress so the bar trails the scroll slightly instead of
  // snapping, which matches the weight Lenis gives the page itself.
  const progress = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 30,
    restDelta: 0.001,
  });

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 8);
  });

  return (
    <motion.nav
      data-testid="site-nav"
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/70 backdrop-blur transition-colors duration-300",
        isScrolled ? "border-border/60" : "border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
        <a href="#top" className="flex items-center gap-2 font-bold text-xl">
          <motion.div
            whileHover={{ rotate: -12, scale: 1.08 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="rounded-lg bg-primary p-1.5 text-primary-foreground shadow-sm"
          >
            <Rocket className="h-5 w-5" />
          </motion.div>
          <Typography
            variant="large"
            as="span"
            className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
          >
            Turbostack
          </Typography>
        </a>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          {hasClerk && (
            <>
              <div className="hidden h-6 w-px bg-border/50 sm:block" />
              <Show when="signed-out">
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
              </Show>
              <Show when="signed-in">
                <div className="flex items-center gap-4">
                  <Typography
                    variant="small"
                    className="hidden font-medium text-muted-foreground sm:inline-block"
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
              </Show>
            </>
          )}
        </div>
      </div>

      {/* Reading progress for the full page. */}
      <motion.div
        data-testid="reading-progress"
        style={{ scaleX: progress }}
        className="absolute bottom-0 left-0 h-px w-full origin-left bg-gradient-to-r from-primary to-accent"
      />
    </motion.nav>
  );
}
