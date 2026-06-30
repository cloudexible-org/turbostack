# Turbostack: Convex + Next.js + Vite + Clerk + Turborepo + Vercel

![Turbostack Banner](./docs/assets/banner.png)

A premium, production-ready monorepo template for building high-performance, type-safe full-stack applications. Includes a Next.js marketing site and a Vite-powered app ready for native deployment via Capacitor.

## ✨ Features

- 🏎️ **Turborepo** - High-performance build system for JavaScript/TypeScript monorepos.
- 🎨 **Modern UI** - **Tailwind CSS v4** with **shadcn/ui** and **Base UI** primitives. No Radix UI.
- 📱 **Cross-Platform** - Shared logic and components across **Next.js** (Marketing) and **Vite React** (App), with **Capacitor** for native deployments.
- ⚡ **Reactive Backend** - **Convex** for a 100% type-safe, real-time backend and database.
- 🔐 **Optional Auth** - **Clerk** integration for user management — fully optional; the stack runs auth-free when Clerk env vars are unset.
- 🛠️ **Unified Toolchain** - **Biome** for lightning-fast linting and formatting.
- 📈 **Analytics** - **Vercel Analytics** plus a key-gated **PostHog** package (`@repo/analytics`) for product analytics.
- 🧰 **DX & Safety** - Typed/validated env (`@t3-oss/env`), Portless named `.localhost` dev URLs, git hooks (Biome + commitlint), and GitHub Actions CI.

## 🛠️ Tech Stack

- **Monorepo:** [Turborepo](https://turbo.build/)
- **Package Manager:** [pnpm](https://pnpm.io/)
- **Backend:** [Convex](https://convex.dev/)
- **Marketing (www):** [Next.js 16](https://nextjs.org/) (App Router)
- **App:** [Vite](https://vite.dev/) + [React](https://react.dev/) (SPA, Capacitor-ready)
- **Auth:** [Clerk](https://clerk.com/)
- **Toolchain:** [Biome](https://biomejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Base UI](https://base-ui.com/)
- **Analytics:** [Vercel Analytics](https://vercel.com/analytics) + [PostHog](https://posthog.com/)
- **Testing:** [Playwright](https://playwright.dev/) (E2E), [Vitest](https://vitest.dev/) + Storybook (component/unit)

## 📁 Project Structure

```text
├── apps/
│   ├── www/          # Next.js marketing site & landing pages
│   ├── app/          # Vite React app (Capacitor-ready, runs on port 5173)
│   └── e2e/          # Playwright end-to-end tests
├── packages/
│   ├── api/          # Convex backend, schema, and shared business logic
│   ├── ui/           # Shared high-performance UI components
│   ├── analytics/    # Key-gated PostHog analytics provider
│   └── config/       # Shared TypeScript & Tailwind configurations
└── docs/             # Project documentation and changelogs
```

## 🚀 Getting Started

### Prerequisites

- [Convex](https://convex.dev/) account
- [Vercel](https://vercel.com/) account
- [Clerk](https://clerk.com/) account (optional — only if you want auth)
- Node.js 26 (see `.nvmrc` — e.g. `nvm use`)
- [pnpm](https://pnpm.io/installation) (`npm install -g pnpm`)

### Quick Start

1. **Clone the repo:**
   ```bash
   git clone <repository-url>
   cd turbostack
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   ```bash
   pnpm setup:envs
   ```
   *This copies all `.env.example` files to `.env.local` across the monorepo.*

4. **(Optional) Sync Clerk Auth Keys:**
   Clerk is optional — skip this to run without auth. To enable it, go to your **Clerk Dashboard** > **API Keys**, copy the keys, and paste them into the local `.env.local` files in `apps/www`, `apps/app`, and `packages/api`.

5. **Initialize Convex:**
   ```bash
   cd packages/api && npx convex dev
   ```
   *This will link your project to Convex and generate the necessary `.env.local` files.*

6. **Run the development environment:**
   ```bash
   # From the root
   pnpm dev
   ```

## 🔐 Authentication Setup

To sync Clerk auth with your Convex backend:

1. **Clerk Dashboard:**
   - Go to **Configure** > **JWT Templates** > **New Template** > **Convex**.
   - This creates a template named `convex`.
   - Copy the **Issuer URL** (or use the **Frontend API URL** from API Keys).

2. **Convex Dashboard:**
   - Go to **Settings** > **Environment Variables**.
   - Add `CLERK_JWT_ISSUER_DOMAIN` and paste the URL.

*Note: Ensure you do this for both Production and Development environments in Clerk.*

## 🛠️ Development Workflows

- **Dev:** `pnpm dev` — runs all apps via Turbo. Portless serves stable HTTPS `.localhost` URLs (e.g. `https://www.turbostack.localhost`, `https://app.turbostack.localhost`).
- **Lint & Format:** `pnpm lint` / `pnpm format` / `pnpm check` (Biome).
- **Typecheck:** `pnpm typecheck` (per-package `tsc --noEmit`).
- **Unit tests:** `pnpm test` (Storybook component tests in a real browser; excludes e2e).
- **E2E tests:** `pnpm --filter e2e test` (Playwright; bypasses Portless via `PORTLESS=0`).
- **Storybook:** `pnpm storybook` (visualize shared components).
- **Build:** `pnpm build` (optimized production build for all apps).

> Git hooks (lefthook) run Biome on staged files and validate Conventional Commits on each commit — they install automatically on `pnpm install`.

## 🚢 Deployment

### Vercel (Full Stack)

1. **Create Vercel Project:**
   - Go to [Vercel](https://vercel.com), create a new project, and import your repository.
   - Hit **Deploy**. The first build may fail until Convex is connected (it needs a `CONVEX_DEPLOY_KEY`). Clerk is optional and not required to deploy.

2. **Connect Integrations:**
   - In your Vercel project, go to **Settings** > **Integrations**.
   - Install and connect **Clerk**.
   - Install and connect **Convex**. Vercel will automatically handle production environment variables.

3. **Configure Clerk Domains:**
   - In the **Clerk Dashboard**, go to **Configure** > **Domains**.
   - Complete the domain configuration for your Vercel URL, otherwise Vercel's production checks may fail.

4. **Add JWT Template:**
   - In **Clerk**, go to **JWT Templates** and add the **Convex** template for both `prod` and `dev`.

5. **Finalize Convex Prod Env:**
   - Go to the **Clerk Dashboard** > **API Keys** and copy the **Frontend API URL**.
   - In the **Convex Dashboard**, go to your production project > **Settings** > **Environment Variables**.
   - Add `CLERK_JWT_ISSUER_DOMAIN` with the value you copied.

6. **Redeploy:**
   - Go back to Vercel and trigger a redeploy. Your app should now be live and fully integrated!

## 🤝 Contributing

Before contributing, please read [AGENTS.md](./AGENTS.md) for our standards on:
- Conventional Commits
- Tailwind v4 & shadcn/ui patterns
- Mandatory Base UI usage (No Radix UI)
- Type safety and strict Biome checks

---

Built with ❤️ by [Cloudexible](https://cloudexible.com)
