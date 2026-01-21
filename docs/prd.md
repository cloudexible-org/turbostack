# PRD: The Ultimate Full-Stack Monorepo Starter

## 1. Project Overview
A high-performance, type-safe, and opinionated monorepo template designed for rapid product development. This starter provides a "Batteries-Included" experience for building cross-platform applications using a "Web-First" approach, where a single Next.js codebase powers the Web, PWA, and Mobile (via a WebView shell).

## 2. Core Stack
* **Monorepo Management:** Turborepo + pnpm
* **Frontend Framework:** Next.js 15 (App Router)
* **Backend / Database:** Convex (Real-time sync, serverless functions)
* **Mobile:** React Native (Expo) + `react-native-webview`
* **Styling:** Tailwind CSS v4
* **UI Components:** Base UI (Headless)
* **Authentication:** Clerk (Optional/Environment-driven)
* **Tooling:** * **Biome:** Linting and Formatting (Single tool)
    * **Playwright:** E2E Testing
    * **Vite:** Unit Testing
* **Analytics:** Vercel Analytics

---

## 3. Technical Architecture

### A. Monorepo Structure
The project follows a standard Turborepo workspace pattern:
* `apps/web`: The Next.js application (The source of truth).
* `apps/native`: Expo-based wrapper that points to the web URL.
* `packages/api`: Shared Convex schemas, server functions, and types.
* `packages/ui`: Shared component library (Base UI + Tailwind v4).
* `packages/config`: Centralized configurations for Biome, TypeScript, and Vite.

### B. Mobile & PWA Strategy
* **WebView Shell:** The React Native app is a thin client. It includes a native splash screen and a full-screen WebView.
* **PWA Ready:** `apps/web` includes a Web Manifest and Service Worker configuration for offline support and "Add to Home Screen" capabilities.
* **Vercel Integration:** Built-in `.vercel` configuration and Vercel Analytics injected into the root layout of the web app.

### C. Conditional Authentication (Clerk)
To ensure the template is flexible, Clerk is implemented as a conditional dependency:
* The `ClerkProvider` only wraps the application if `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is detected.
* If keys are missing, the app defaults to an "unauthenticated" state or a simplified mock state, preventing runtime crashes.

---

## 4. Key Features & DX
* **Unified Tooling:** Biome replaces Prettier and ESLint for significantly faster CI and local development.
* **Type Safety:** Shared types between the Convex backend and all frontends.
* **Optimized Styling:** Tailwind v4 (CSS-first) reduces build times and simplifies the setup.
* **One-Command Dev:** A single `pnpm dev` starts the Convex dev server, the Next.js local server, and the Expo bundler.

---

## 5. Development Requirements
* **Node.js:** v20+ 
* **Package Manager:** pnpm
* **Environment Variables:**
    * `CONVEX_DEPLOYMENT_KEY`
    * `NEXT_PUBLIC_CONVEX_URL`
    * `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (Optional)

---

## 6. Implementation Phases
1.  **Phase 1:** Workspace initialization (pnpm + Turbo) and Biome/TS configuration.
2.  **Phase 2:** `apps/web` setup with Tailwind v4 and Vercel Analytics.
3.  **Phase 3:** `packages/api` Convex integration.
4.  **Phase 4:** `apps/native` Expo WebView shell implementation.
5.  **Phase 5:** PWA configuration and testing suite (Vite/Playwright) setup.