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
- `artifacts/admin-panel` — MediQuick Admin Panel at `/admin/`
- `artifacts/mockup-sandbox` — canvas/mockup preview server at `/__mockup`

## Local Medicine Ordering System (New)

- **DB Tables**: `shopkeeper_profiles` (shop name, address, lat/lng, city, pincode) + `local_medicine_orders` (delivery details, distance, charges, status)
- **API routes**: `GET/PUT /api/shopkeeper/profile`, `GET /api/shopkeeper/nearby`, `POST /api/shopkeeper/calc-distance`, `POST /api/shopkeeper/local-orders`, `GET /api/shopkeeper/local-orders`
- **Distance**: Haversine formula — straight-line distance between shopkeeper and delivery address
- **Delivery logic**: ₹10 per 100m, ₹1 platform fee per 100m (included in ₹10), max 5km
- **Medicine page tabs**: Tab 1 = Tata 1mg (redirect), Tab 2 = Local Store (browse nearby, cart, checkout)
- **Doctor Panel / Lab Center tabs**: "Medicine Shop" tab — lets doctors/labs register their own shop + list medicines for local delivery

## Doctor Consultation System

- **DB Tables**: `doctors`, `appointments`, `doctor_reviews` (in `lib/db/src/schema/`)
- **API Routes** (`/api/doctors/...`):
  - `GET /doctors` — list doctors with search/spec/type filters
  - `GET /doctors/specializations` — list unique specializations
  - `GET /doctors/:id` — doctor profile + reviews
  - `POST /doctors/:id/book` — book appointment (Razorpay optional, auto-confirm without keys)
  - `POST /doctors/appointments/:id/verify` — verify Razorpay payment, generate Jitsi link
  - `GET /doctors/my/appointments` — user's appointments (auth required)
  - `GET /doctors/admin/all` — admin: all doctors
  - `POST /doctors/admin/create` — admin: add doctor
  - `PUT /doctors/admin/:id` — admin: edit doctor
  - `DELETE /doctors/admin/:id` — admin: deactivate doctor
  - `GET /doctors/admin/appointments` — admin: all appointments
- **Frontend**: `/consult` page with search, filters, doctor cards, profile modal, booking form, Jitsi video link
- **Admin Pages**: `/doctors` (manage), `/appointments` (view all bookings + revenue)
- **Video Calls**: Jitsi Meet — `https://meet.jit.si/mediquick-{id}-{timestamp}` (no API key needed)
- **8 seeded doctors** with specializations + reviews on first load

## Shopkeeper Subscription System

- **DB Tables**: `shopkeeper_medicines`, `shopkeeper_subscriptions`
- **API Routes** (`/api/shopkeeper/...`): medicine CRUD with plan limits, subscription Razorpay order/verify
- **Plans**: Free (10), Basic ₹199 (50), Pro ₹499 (200), Unlimited ₹999 (∞)
- **Frontend**: `/shopkeeper` page with Medicines + Plans tabs; limit-reached popup

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
