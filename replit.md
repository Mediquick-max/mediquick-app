# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

The workspace includes **MediQuick**, a React web app for daily healthcare: medicine reminders, nearby pharmacy discovery, doctor consultation booking, lab test booking, medicine delivery ordering, and a Hindi/Hinglish AI medical assistant. The app uses the shared Express API server and Replit PostgreSQL database for reminder, care request, and AI conversation persistence. Pharmacy directions/search use keyless Google Maps URLs.

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
- **AI**: Replit-managed OpenAI integration for medical chat and voice playback

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
- `GET /api/care/options` — list available doctors, lab tests, and medicine catalog items
- `GET /api/care/activity` — list booked consultations, lab bookings, and medicine orders
- `POST /api/care/consultations` — book doctor consultation
- `POST /api/care/lab-bookings` — book home lab test collection
- `POST /api/care/medicine-orders` — create medicine delivery request
- `POST /api/ai/health-chat` — ask Medi AI Assistant a general health question in Hindi/Hinglish
- `POST /api/ai/symptom-check` — check selected symptoms and get precautions plus doctor timing guidance
- `POST /api/ai/health-speech` — convert an AI answer into spoken MP3 audio

## Database Schema

- `reminders` table in `lib/db/src/schema/reminders.ts`
  - `id`, `medicine_name`, `time`, `taken`, `created_at`, `updated_at`
- `care_requests` table in `lib/db/src/schema/care.ts`
  - `id`, `type`, `item_id`, `title`, `patient_name`, `phone`, `notes`, `address`, `mode`, `date_slot`, `status`, `amount`, `created_at`
- `conversations` and `messages` tables in `lib/db/src/schema/`
  - Store AI health chat exchanges for conversation history/auditing

## MediQuick Notes

- Pharmacy locator uses curated pharmacy seed data plus optional browser geolocation for nearby ranking.
- The frontend includes quick medicine search chips, an embedded map preview, map/directions links, and phone call links.
- Reminder notifications use browser notifications when allowed, with an alert fallback.
- Medi AI Assistant includes sample health questions, smart symptom checker, emergency keyword handling, nearby help map shortcuts, and AI-generated voice playback.
- AI answers are always general information and include a doctor consultation safety warning.
- Emergency symptoms such as chest pain, breathing issue, unconsciousness, or heavy bleeding bypass normal AI advice and return immediate emergency guidance.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
