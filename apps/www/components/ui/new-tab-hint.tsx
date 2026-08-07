/**
 * A visually hidden "(opens in a new tab)" suffix for links that carry
 * `target="_blank"`.
 *
 * Sighted users get the context from the browser itself — a new tab appears.
 * Screen reader users get nothing unless the link says so, and an unannounced
 * context switch is disorienting because Back no longer returns them where they
 * were. WCAG 3.2.5 (Change on Request) is the reason this exists.
 *
 * Rendered as an appended `sr-only` span rather than an `aria-label` on the
 * anchor: a label *replaces* the accessible name, so it has to restate the
 * visible text and then silently drifts when that text changes — and if the
 * restatement is imperfect it breaks WCAG 2.5.3 (Label in Name) for voice
 * control. Appending composes with whatever the link already says instead.
 * `sr-only` is `position: absolute`, so it never affects layout.
 *
 * The exception is an image-only link, which needs an `aria-label` regardless
 * because it has no text to append to — see `BrowserFrame` in
 * `components/landing/built-with.tsx`. Keep the wording identical there.
 */
export function NewTabHint(): React.ReactNode {
  // The leading space keeps the computed name as "GitHub (opens in a new tab)"
  // rather than running the two together.
  return <span className="sr-only"> (opens in a new tab)</span>;
}
