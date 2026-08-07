import {
  Button as BaseButton,
  type ButtonProps as BaseButtonProps,
} from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  render?: BaseButtonProps["render"];
  nativeButton?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, render, nativeButton, ...props }, ref) => {
    // A rendered element that is not a <button> needs `nativeButton={false}` so
    // Base UI supplies the button semantics the tag lacks. Do NOT use `render`
    // to produce a link — use `ButtonLink` below. See the note on it.
    const isNativeButton = nativeButton ?? !render;

    return (
      <BaseButton
        ref={ref}
        render={render}
        nativeButton={isNativeButton}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export interface ButtonLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof buttonVariants> {}

/**
 * A link that is styled as a button.
 *
 * Deliberately a plain `<a>` with the button *styles*, not
 * `<Button render={<a />} />`. Base UI's Button enforces button semantics: with
 * `nativeButton={false}` it stamps `role="button"` and `tabIndex` onto whatever
 * it renders, and an explicit `role` overrides an anchor's implicit link role.
 * The result is a navigating link that assistive technology announces as a
 * button, and that `getByRole("link")` cannot find.
 *
 * Base UI's own documentation is explicit about this — links "have their own
 * semantics and should not be rendered as buttons through the `render` prop"
 * (`node_modules/@base-ui/react/docs/react/components/button.md`). Anchors
 * already carry link semantics and Enter-key activation from the browser, so
 * there is nothing for Base UI to add here beyond the class names.
 */
const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ className, variant, size, ...props }, ref) => (
    <a
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  ),
);

ButtonLink.displayName = "ButtonLink";

export { Button, ButtonLink, buttonVariants };
