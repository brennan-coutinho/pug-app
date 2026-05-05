# Workspace

## Overview

**PUG – Personal Viewing Log** — a personal viewing log app for film and TV enthusiasts. Users track what they've watched, want to watch, or haven't watched across movies and TV shows.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + wouter routing

## Artifacts

- **`artifacts/pug-app`** — React + Vite web app (landing page + viewing log), preview at `/`
- **`artifacts/api-server`** — Express 5 API server, preview at `/api`

## App Structure

### Landing Page (`/`)
Marketing page with CTA to start logging.

### App (`/app/swipe`)
- **Swipe screen** — Tinder-style drag card to log titles. Wikipedia API for movie search, TVMaze for TV search.
- **Movies/Watched** — list of watched movies
- **Movies/Want to Watch** — list with JustWatch "Find streaming" links per title
- **TV Shows/Watched** — list of watched TV shows
- **TV Shows/Want to Watch** — list with streaming platform badges auto-fetched via TVMaze
- **Recommendations** (`/app/recommendations`) — curated movie picks (Wikipedia-enriched) + popular TV shows from TVMaze with streaming info, genre tags, direct Watchlist/Watched buttons

### Theme
- Black & orange color scheme throughout (`#0d0d0d` background, `#f97316` orange accent)
- Dark CSS variables set as default in `index.css` (no dark class toggle needed)

## Authentication

- **Clerk** auth (email + Google OAuth). Provisioned via `setupClerkWhitelabelAuth()`.
- Unauthenticated users see the landing page; all `/app/*` routes redirect to `/sign-in`.
- Sign-in / sign-up pages at `/sign-in` and `/sign-up` with branded dark/orange Clerk appearance.
- API server uses `clerkMiddleware()` from `@clerk/express` + `requireAuth` middleware that gates all `/api/entries` routes.
- `ClerkCacheInvalidator` component in `App.tsx` clears React Query cache on user change.

## Database Schema

- **`entries`** table: `id`, `user_id` (Clerk userId), `title`, `media_type` (movie|tv), `status` (watched|want_to_watch|not_watched), `created_at`, `updated_at`
- All queries are scoped by `user_id` so each account has its own log.

## API Routes

- `GET /api/entries` — list entries (filterable by mediaType, status)
- `POST /api/entries` — create entry (prevents duplicates)
- `GET /api/entries/:id` — get single entry
- `PATCH /api/entries/:id` — update status/title
- `DELETE /api/entries/:id` — delete entry
- `GET /api/entries/stats/summary` — counts by media type and status

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
