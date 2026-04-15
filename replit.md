# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

The workspace now includes **MediQuick**, a React web app for medicine reminders and nearby pharmacy discovery. The app uses the shared Express API server and Replit PostgreSQL database for reminder persistence, with a keyless Google Maps search URL flow for pharmacy directions/search in the MVP.

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
- **Web app**: React + Vite + Tailwind CSS

## Artifacts

- `artifacts/mediquick-app` — MediQuick web app at `/`
- `artifacts/api-server` — shared API server at `/api`
- `artifacts/mockup-sandbox` — canvas/mockup preview server at `/__mockup`

## MediQuick API Surface

- `GET /api/reminders` — list all reminders
- `POST /api/reminders` — create a reminder with `medicineName` and `time`
- `GET /api/reminders/today` — list today's reminders
- `GET /api/reminders/summary` — summary totals and next reminder
- `PATCH /api/reminders/:id/taken` — mark a reminder taken/not taken
- `DELETE /api/reminders/:id` — delete a reminder
- `GET /api/pharmacies/search?medicine=...&lat=...&lng=...` — search nearby pharmacy seed data, rank by medicine availability and distance, and return a Google Maps search URL

## Database Schema

- `reminders` table in `lib/db/src/schema/reminders.ts`
  - `id`, `medicine_name`, `time`, `taken`, `created_at`, `updated_at`

## MediQuick MVP Notes

- Pharmacy locator uses curated pharmacy seed data plus optional browser geolocation for nearby ranking.
- The frontend includes quick medicine search chips, an embedded map preview, map/directions links, and phone call links.
- Reminder notifications use browser notifications when allowed, with an alert fallback.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
