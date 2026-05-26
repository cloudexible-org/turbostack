# Stage 1: Base
FROM node:20-alpine AS base
RUN npm install -g pnpm@10.28.1 turbo
WORKDIR /app

# Stage 2: Prune
FROM base AS pruner
COPY . .
RUN turbo prune www --docker

# Stage 3: Dependencies
FROM base AS deps
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# Stage 4: Builder
FROM base AS builder
# Define the build arguments for NEXT_PUBLIC env variables
ARG NEXT_PUBLIC_CONVEX_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

ENV NEXT_PUBLIC_CONVEX_URL=$NEXT_PUBLIC_CONVEX_URL
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

COPY --from=pruner /app/out/full/ .
COPY --from=deps /app/node_modules ./node_modules
RUN pnpm turbo run build --filter=www...

# Stage 5: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
USER nextjs

# Copy standalone output and static assets from builder
COPY --from=builder /app/apps/www/.next/standalone ./
COPY --from=builder /app/apps/www/.next/static ./apps/www/.next/static
COPY --from=builder /app/apps/www/public ./apps/www/public

EXPOSE 3000
ENV PORT 3000
ENV NODE_ENV production

# Standalone server is executed from the apps/www directory
CMD ["node", "apps/www/server.js"]
