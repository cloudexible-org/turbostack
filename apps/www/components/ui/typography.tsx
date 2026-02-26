import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const typographyVariants = cva("text-foreground", {
  variants: {
    variant: {
      h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
      h2: "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
      h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
      h4: "scroll-m-20 text-xl font-semibold tracking-tight",
      p: "leading-7 [&:not(:first-child)]:mt-6",
      blockquote: "mt-6 border-l-2 pl-6 italic",
      ul: "my-6 ml-6 list-disc [&>li]:mt-2",
      inlineCode:
        "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
      lead: "text-xl text-muted-foreground",
      large: "text-lg font-semibold",
      small: "text-sm font-medium leading-none",
      muted: "text-sm text-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "p",
  },
});

type TypographyElement =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "p"
  | "span"
  | "div"
  | "blockquote"
  | "code";

export interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  as?: TypographyElement;
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant, as, ...props }, ref) => {
    const Component =
      as ||
      (variant === "inlineCode"
        ? "code"
        : variant === "muted" ||
            variant === "small" ||
            variant === "large" ||
            variant === "lead"
          ? "p"
          : (variant as any) || "p");

    return (
      <Component
        className={cn(typographyVariants({ variant, className }))}
        ref={ref as any}
        {...props}
      />
    );
  },
);

Typography.displayName = "Typography";

export { Typography, typographyVariants };
