# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:24-slim AS builder

# Enable corepack so pnpm is available
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace manifests first so dependency installs are cached
COPY pnpm-lock.yaml pnpm-workspace.yaml .npmrc package.json ./
COPY tsconfig.base.json tsconfig.json ./

# Copy all source packages
COPY lib/ lib/
COPY artifacts/api-server/ artifacts/api-server/
COPY artifacts/pug-app/ artifacts/pug-app/
COPY scripts/ scripts/

# Install all dependencies (dev + prod)
RUN pnpm install --frozen-lockfile

# ── Build frontend ──
# VITE_CLERK_PUBLISHABLE_KEY must be passed as a build-arg since Vite
# embeds it at compile time. Get the value from your Clerk dashboard.
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

# BASE_PATH=/ means the app is served from the root on Azure App Service.
# PORT is required by vite.config.ts even during a build (not used at runtime here).
ENV BASE_PATH=/
ENV PORT=8080
ENV NODE_ENV=production

RUN pnpm --filter @workspace/pug-app run build

# ── Build API server (esbuild bundles everything into dist/) ──
RUN pnpm --filter @workspace/api-server run build


# ─── Stage 2: Production image ────────────────────────────────────────────────
FROM node:24-slim AS production

WORKDIR /app

# Copy only the compiled output — esbuild bundles all dependencies so
# no node_modules are needed at runtime.
COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=builder /app/artifacts/pug-app/dist/public ./artifacts/pug-app/dist/public

ENV NODE_ENV=production
# Azure App Service sets PORT automatically; default to 8080 locally.
ENV PORT=8080

EXPOSE 8080

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
