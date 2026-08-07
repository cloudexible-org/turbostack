# E2E Test Architecture

How the Playwright suite in `apps/e2e` is meant to work, what is actually true
today, and the failure modes worth knowing before writing a spec.

Adapted from an external playbook written for a Next.js + Clerk + multi-tenant
app. The parts that assumed that stack have been dropped — see
[Deliberately out of scope](#deliberately-out-of-scope) for what was cut and
what would bring it back.

---

## 1. Scope

| | |
|---|---|
| Runner | Playwright (`apps/e2e`, package name `e2e`) |
| Project `app` | `apps/app` — Vite + React — on `http://127.0.0.1:5173` |
| Project `www` | `apps/www` — Next.js — on `http://127.0.0.1:3100` |
| Project `app-convex` | `apps/app` against a real, seeded Convex local backend |
| Backend | Convex (`packages/api/convex`), local deployment only |
| Auth | None. `auth.config.ts` ships `providers: []` on purpose |
| Page objects | `apps/e2e/page-objects/<app>/` |
| Specs | `apps/e2e/specs/<app>/` |

Each project pins its own `baseURL` and has its own `webServer` entry, rather
than sharing a single top-level one. That is deliberate: a shared `baseURL` is
what let defect (1) below happen — a spec asserting against the wrong app while
looking perfectly reasonable. **Put a spec in the directory of the app it
asserts against**; `testDir` is what routes it to the right server.

`apps/www` came under test on 2026-08-07, alongside the `motion` 12 → 13
upgrade. Before that it had no runtime coverage at all, which is why that
upgrade was held back from the routine dependency sweep — see §9.

Run it:

```bash
pnpm test:e2e                              # every project
pnpm --filter e2e exec playwright test --project=www
E2E_CONVEX=0 pnpm test:e2e                 # skip the backend (how CI runs)
pnpm --filter e2e convex:local             # just the backend, for poking at data
```

**Stop `pnpm dev` first.** Next 16 keeps a per-project dev lockfile, so a
running `next dev` makes the suite's own Next server die at startup with
*"Another next dev server is already running"*. A different port does not help —
the lock is per project directory — and the error never mentions e2e, so it
reads as a mystery the first time.

---

## 1a. The Convex backend

The `app-convex` project runs against a **local** Convex deployment, never a
cloud one: global setup wipes the database to reseed it, and the local backend
is the only one that is disposable. It is also anonymous — no Convex account —
so anyone who clones this template can run the suite.

`E2E_CONVEX=0` drops the backend, its webServer and the `app-convex` project.
CI sets it: provisioning a backend on a cold runner for every push is not worth
it, and the `app` and `www` projects assert only statically-rendered chrome and
client-side behaviour, so they still run there.

### The port is not 3210, and assuming it is can wipe another project

Convex allocates a `(cloud, site)` port pair **per local deployment** and
records it in that deployment's own `.convex/local/default/config.json`.
Whoever boots first keeps 3210; the second Convex project on the machine gets
3212/3213, the third 3214/3215.

Hard-coding 3210 is a data-loss bug, not a shortcut. Playwright's
`webServer.url` health check only asks *"is something answering here?"* — it
cannot tell one Convex backend from another. So: the other project's backend
answers on 3210 → `reuseExistingServer` sees a live server, so ours never
starts → the app under test is handed that URL → global setup wipes the
database to seed it. Every step succeeds, and the run goes green while pointed
at, and destroying, the wrong database.

`apps/e2e/local-backend.ts` therefore reads the port from `config.json` and is
the single place that does. `CONVEX_URL` overrides it but has **no default** —
a default in a `.env` is what let the right answer and the wrong one coexist in
the project this pattern came from, and `apps/e2e/.env` is not even loaded when
Playwright evaluates its config.

### Two guards, because a name is not enough

`assertLocalBackendIdentity()` runs before anything writes:

1. **`/instance_name` vs `config.json`.** Fast and readable, and catches a
   *named* deployment (`local-<team>-<project>`) on the wrong port.
2. **An admin-key `ping` against our own internal function.** This is the half
   that actually holds. The Convex CLI names *every* anonymous agent-mode
   deployment `anonymous-agent`, so two projects built from this template would
   agree on the name while being different databases. Admin keys are
   per-deployment, so a foreign backend rejects ours.

Guard 2 retries for 45s, because `/version` answers as soon as the backend
process is up and before `convex dev` has finished pushing functions. That wait
is only ever paid on the error path.

### `convex dev` rewrites `packages/api/.env.local`

Configuring a local deployment rewrites `CONVEX_DEPLOYMENT` to the local one and
injects `CONVEX_URL` / `CONVEX_SITE_URL` — silently repointing an ordinary
`pnpm dev` at the disposable e2e backend. The file is gitignored, so nothing
flags it, and the failure it causes later (a dev app on an empty database) looks
unrelated. Observed here on 2026-08-07, not assumed.

`scripts/convex-local.mjs` snapshots the file, `fs.watchFile`s it and restores
on change, and restores again on exit. Restoring only on exit would leave it
wrong for the whole run — exactly when someone might restart `pnpm dev`.

### Verifying the guards

Do **not** verify by running the suite and seeing green — green is what the bug
produces. Test the guard directly with a stub standing in for a foreign backend
(one was used at `.scratch/convex-guard/` on 2026-08-07):

| Case | Setup | Expected |
|---|---|---|
| A | Stub reporting a foreign name | refused, naming expected **and** found |
| A2 | Stub reporting `anonymous-agent` | refused by the admin-key ping |
| B | Nothing listening | refused, quoting **your** allocated port |
| C | Your real backend | passes, proceeds to seed |

Set `SKIP_SEED_IMPORT=true` while testing, as a second net: if the guard fails
to fire, nothing is seeded and no data is destroyed.

---

## 2. Known defects — all fixed 2026-07-28

Measured by running the suite on 2026-07-28, and fixed the same day. Kept here
rather than deleted: each entry records a trap that is easy to reintroduce, and
the fix only holds while the reasoning is visible.

1. ~~**The only spec is red.**~~ **Fixed 2026-07-28.** The spec asserted
   `"The Modern Monorepo"`, which lives in `apps/www` — the *other* app.
   `specs/home.spec.ts` and `page-objects/page.ts` now assert against what
   `apps/app` actually renders (`<h1>TurboStack</h1>`, the tagline, and the
   message composer), verified by running them. See §4.

2. ~~**The suite hangs at teardown.**~~ **Fixed 2026-07-28.** `webServer.command`
   is now `pnpm exec vite --port 5173 --strictPort` with `cwd: "../app"`, so
   Vite is a direct child of Playwright rather than a grandchild behind
   pnpm → portless. A full run now exits on its own in ~2s leaving port 5173
   free. Cause in §3.

3. ~~**`reuseExistingServer: !process.env.CI`**~~ **Fixed 2026-07-28.** Now
   `false` unconditionally, paired with `--strictPort`. See §3.

4. ~~**`playwright-report/` is not gitignored.**~~ **Already resolved.** Both
   `test-results/` and `playwright-report/` are in `.gitignore`; this entry was
   stale when written. The reporter is additionally set to
   `[["html", { open: "never" }], ["list"]]` — the default `open: "on-failure"`
   serves the report and blocks the process, hanging any non-interactive run.

5. ~~**No execution path.**~~ **Fixed 2026-07-28.** Root now has
   `test:e2e` (`turbo test --filter=e2e`), and `.github/workflows/ci.yml` has a
   dedicated `e2e` job running it on every push and PR. `pnpm test` still
   excludes the suite, so the unit-test loop stays fast. The `e2e#test` turbo
   task is `cache: false` on purpose — `e2e` does not depend on `app` in the
   workspace graph, so apps/app's sources are absent from the task hash and a
   cached pass would survive a UI regression.

**Standing constraint:** CI supplies `VITE_CONVEX_URL` as a *placeholder* that
never connects, so every spec must pass with the backend unreachable — assert
only on statically-rendered chrome. Pointing CI at a real deployment is a
prerequisite for any spec that reads or writes messages, along with the
namespacing rules in §8.

---

## 3. Web server lifecycle

Playwright's `webServer` config has two traps. This repo was in both; the
current config avoids them, and the reasoning is kept here so it is not undone.

### Orphaned process trees

If the dev command is a wrapper that spawns the real server, Playwright kills
the wrapper and the grandchild survives, keeps the port, and teardown hangs —
after every test has passed.

The config used to be exactly that shape:

```ts
command: "PORTLESS=0 pnpm --filter app dev",
```

`apps/app`'s `dev` script is `portless app.turbostack --app-port 5173 vite`, so
the chain was **pnpm → portless → vite**. Verified at the time: after a run, a
`vite.js` process remained with `PPID 1`.

The server is now a **direct child**:

```ts
command: "pnpm exec vite --port 5173 --strictPort",
cwd: "../app",
```

Portless is a local-convenience proxy. The test environment should talk to Vite
on its raw port — fewer moving parts, no TLS trust, and the readiness check
points at the server rather than at a proxy in front of it.

### `reuseExistingServer` is a correctness setting, not a convenience one

If the reused server was started with different env — a different
`VITE_CONVEX_URL`, most importantly — the suite runs against a different backend
than the one it thinks it seeded, and a fully green run proves nothing. Prefer
`reuseExistingServer: false` plus `--strictPort`, so a developer's running
`pnpm dev` produces a loud "port in use" error instead of a quiet wrong answer.

Give the entry a generous `timeout` and point the health check at the raw port.
Both are applied: `reuseExistingServer: false` and `timeout: 120_000`.

---

## 4. Page Object Models drift silently

This repo's POM was written and never executed, and it was fiction: it asserted
against a page in a different app. It has since been rewritten against the real
DOM and is now executed on every push, which is the only thing that keeps it
honest.

- **An unexecuted POM is documentation of an intention, not of the app.** Treat
  any untested POM as unverified.
- **Verify against real DOM before writing locators.** Guessing costs a full
  test-run cycle per wrong guess. Reading the component source costs seconds.
- **Keep `page-objects/` mirroring the route tree** of `apps/app`, and fix it
  when routes move.
- **Prefer `data-testid`** over text or CSS classes for anything structural, per
  `CLAUDE.md` §5. Note there is currently **no `data-testid` anywhere in the
  repo** — adding them is part of the cost of the first real spec, not a
  freebie.

---

## 5. Reading the DOM efficiently

**Playwright's failure snapshots.** On failure Playwright writes
`test-results/<test>/error-context.md` containing an accessibility-tree snapshot
of the page. It is the fastest way to see what actually rendered — it is what
diagnosed defect (1) above in one read. Check it before changing a locator.

**The a11y tree collapses wrappers.** It omits non-semantic `div`s, so XPath
like `../..` derived from a snapshot may not match the real DOM. When structure
matters, query the real DOM.

**Throwaway probe specs.** For anything structural, write a temporary spec that
navigates and dumps what you need, run it once, then delete it. Put it in
`.scratch/` if it is worth keeping around for a session.

```ts
const info = await page.evaluate(() => {
  const label = [...document.querySelectorAll("*")]
    .find((el) => el.textContent?.trim() === "Send" && el.children.length === 0);
  let node = label, chain = [];
  for (let i = 0; i < 6 && node; i++) {
    chain.push(`${i}: <${node.tagName}> children=${node.children.length}`);
    node = node.parentElement;
  }
  return chain.join("\n");
});
console.log("PROBE::" + info);
```

**Reading React state directly.** `apps/app` is React. When a control is
disabled and *no error is displayed anywhere*, stop guessing and read the state
off the fiber:

```ts
const key = Object.keys(btn).find((k) => k.startsWith("__reactFiber$"));
// walk fiber.return upward, searching memoizedProps/memoizedState for the
// state object you care about, then JSON.stringify it
```

A debugging tool, not something that ships in a test.

---

## 6. Locator pitfalls

- **Nested identical roles.** A card that renders a `<button>` inside a
  `<button>` double-counts when counted by role. Count by a **one-per-item
  anchor** — a checkbox, or content like a formatted ID — rather than by
  structure.

- **Labels not associated with inputs.** If a form renders labels as loose text
  beside nameless inputs, `getByLabel` matches nothing. Fallback:
  `getByText(label, { exact: true }).locator("xpath=following::input[1]")`.
  This is also a **real accessibility defect** — screen-reader users get the same
  unnamed fields. Fix the app rather than only working around it.

- **Visually-hidden inputs inside labels.** `.check()` fails on an `sr-only`
  input — a common shape in shadcn/Base UI radio and checkbox primitives. Click
  the wrapping label's text, which is what a user does anyway.

- **Prefer exact names over substring patterns**, especially for short generic
  words. `getByRole("link", { name: /send/i })` will find more than you meant.

- **Regex over-matching in bulk edits.** A find/replace that strips a path
  segment will also strip an identically-named directory in an import path.
  Re-run `pnpm typecheck` after any scripted rewrite.

---

## 7. Automation-hostile UI

When a UI affordance resists automation — drag-and-drop libraries that ignore
the HTML5 drag API, comboboxes with an overlaid input that swallows clicks —
**stop automating the affordance**. Look for a second supported path to the same
mutation (a detail page, a menu item, a keyboard route), drive that, and assert
the hostile UI merely *reflects* the change. Same business coverage, without
testing whether your pointer simulation satisfies a third-party library.

Prefer this over `test.fixme`. Where `fixme` is genuinely necessary, write the
explanation in it so the gap stays visible.

---

## 8. Parallel safety

`fullyParallel: true` means spec **files** run concurrently, against **one
Convex deployment**. Today `packages/api/convex/schema.ts` has a single
`messages` table and `messages.list` returns the newest 50 rows globally — there
is no tenant boundary to hide behind.

So, for any spec that writes:

- **Namespace the data you create** with something derived from the spec
  filename, and assert only on rows carrying that namespace. Two files then
  cannot collide by both picking `"hello"`.
- **Never assert on a global count** (`messages.list` length). It is shared, and
  another spec's writes will land in it.
- **`test.describe.configure({ mode: "serial" })`** is right for a spec whose
  steps build on each other. The namespace is what keeps it safe from *other*
  files.

This is the minimum that the current data model requires. A real seeding tier
comes later — see below.

---

## 9. Assertions worth having

- **Assert the business outcome, not just the UI transition.** A test named
  "sending a message persists it" that only checks the input clearing is
  overclaiming. Read your own test names back and ask whether the assertions
  justify them.
- **Assert contrasts, not just presence.** "the new row appears" is weak alone;
  "the new row appears **and** the previous one is still there" catches more.
- **Re-read from the backend.** After a mutation, reload so you are testing
  persisted state, not optimistic local state. This matters more with Convex
  than with a REST app: a reactive query updates the UI before you have any
  proof the write survived.
- **Prove the negative space.** Assert the empty state before creating a record
  — otherwise "record appears" can pass by matching pre-existing data.
- **Derive expected values from what the test created**, never hard-code names
  or IDs.

### Animation state (`apps/www`)

`apps/www` runs ~70 `motion` usages across nine landing components. Asserting
them needs care:

- **`toBeVisible()` ignores `opacity`.** It checks for a non-empty bounding box
  and `visibility`/`display`, so an element whose reveal never fired — still at
  `opacity: 0` — reads as visible. Assert `toHaveCSS("opacity", "1")` when the
  point of the test is that an animation ran.
- **Scroll with `page.mouse.wheel`, never `window.scrollTo`.** Lenis runs in
  root mode and eases the real document scroll; a programmatic `scrollTo` fights
  it, and a synthetic `WheelEvent` is untrusted and ignored outright. Use
  `LandingPage.wheel()`, which also waits for the easing to settle.
- **Never measure animation in a backgrounded tab.** A hidden page throttles
  `requestAnimationFrame` and suppresses IntersectionObserver, so every
  scroll-linked value freezes and every `whileInView` reveal stays hidden — which
  looks exactly like a broken animation library. This cost real time on
  2026-08-07 while verifying the `motion` upgrade.
- **Assert thresholds for springs, exact values only at rest.** The
  reading-progress bar settles asymptotically; `toBeGreaterThan` is honest where
  an equality assertion would be flaky.
- **A blocked dev origin looks like broken motion.** If every animation assertion
  fails at once, check the Next dev server output for `Blocked cross-origin
  request to Next.js dev resource` before suspecting the library — the page ships
  HTML and never hydrates. `allowedDevOrigins` in `apps/www/next.config.ts` must
  list whatever host the suite serves from.

---

## 10. When tests find app bugs

They will. Handle it like this:

1. **Report it precisely** — exact file/line, the measured evidence, a suggested
   fix.
2. **Keep the suite green in the meantime, but make the workaround loud.**
   Document *at the workaround* what bug it is for and what to delete once
   fixed. Otherwise it becomes folklore nobody dares touch.
3. **Write the assertion so it fails on the specific defect.** A count-based
   test passes straight through a bug that silently drops a field.
4. **After the fix lands, verify by removing the workaround** and re-running.
   That is what proves the fix — not the suite merely still being green.

---

## 11. Working practices

- **Run headed while developing a spec** (`--headed --workers=1`). Watching it is
  how you notice a step that "passed" but did nothing.
- **Don't pipe a run's output through `tail`.** It buffers until EOF, so a
  running suite looks hung. Write to a file under `.scratch/` and read it — and
  note a pipeline's exit code is the *last* command's, so `playwright | tail`
  always exits 0. Capture Playwright's own exit code or you will report a red
  run as green.
- **Check for orphaned servers at the end of a session** (`lsof -ti :5173`)
  until §3 is fixed.
- **Scratch files go in `.scratch/<task-name>/`**, per `CLAUDE.md` §2.

---

## 12. Order of work

1. Fix the web server command and `reuseExistingServer` (§3) — until teardown
   works, every run costs a manual process kill.
2. Point the POM and spec at what `apps/app` actually renders (§4).
3. Give the suite an execution path — a CI job, or drop it from
   `--filter=!e2e`. Without this, (2) rots again.
4. Add `data-testid` to `apps/app` as specs need them.
5. One read-only spec to shake out POM drift cheaply.
6. Namespaced write specs (§8), one flow at a time.

---

## Deliberately out of scope

Cut from the source playbook because this repo does not have the stack it
assumed. Listed with the trigger that would make each relevant again.

| Dropped | Would matter once |
|---|---|
| Two-tier seeding (shared read-only base + per-spec tenant fixtures) | The schema grows a top-level tenant/org entity that specs can own |
| Namespaced fixture manifests, accessors that throw on a miss | There is a fixture large enough that hard-coded IDs hurt |
| A meta-test for the seeding mechanism | A seeder exists at all |
| Clerk `storageState` setup project, testing tokens, `+clerk_test` identities | `auth.config.ts` gets a provider and `apps/app` gates on sign-in |
| `ConvexHttpClient.setAdminAuth` for HTTP-speed seeding | Per-spec seeding exists **and** is slow. Note this method is absent from Convex's public typings and would need a cast — which collides with `CLAUDE.md` §4 (no `any`). Decide deliberately, don't inherit it |
| Auth-provider redirect-URI allow-lists constraining `baseURL` | The suite targets an app behind an OAuth provider |

---

## Quick reference: symptoms → causes

| Symptom | Likely cause |
|---|---|
| Suite hangs after the last test passes | Orphaned webServer process tree (§3) |
| `EADDRINUSE` / stale content on 5173 | Orphan from a previous run (§3) |
| Test passes alone, fails in parallel | Shared `messages` rows (§8) |
| Everything green but proving nothing | Reused dev server on a different `VITE_CONVEX_URL` (§3) |
| `getByLabel` finds nothing | Labels not associated with inputs (§6) |
| Row counts are exactly double | Nested identical roles (§6) |
| `.check()` fails on a visible control | Visually-hidden input inside a label (§6) |
| Locator matches one element too many | Substring pattern where exact was meant (§6) |
| Submit disabled, no error message anywhere | Read the React fiber (§5) |
