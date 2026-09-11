# Smart Attendance

**School timetable management and intelligent teacher substitution system.**

> [Live Demo](https://smart-attendance-two-pi.vercel.app/)

---

## Overview

Smart Attendance is a full-stack web application built for school administrators and schedulers to manage weekly timetables, track teacher absences, and automatically assign substitute teachers using a weighted scoring algorithm. The system detects scheduling conflicts in real time, generates printable daily sheets, and provides a public read-only timetable view for teachers and students.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 16 (App Router), React 19 |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 4 |
| **ORM** | Prisma 7 |
| **Database** | Neon Postgres (serverless) |
| **Auth** | NextAuth v5 (beta), bcryptjs |
| **Validation** | Zod 4 |
| **Forms** | Server Actions + `useActionState` |
| **Icons** | Lucide React |
| **Notifications** | Sonner (toast) |
| **Deployment** | Vercel (frontend), Neon (database) |

---

## Features

### Timetable Management
- Weekly timetable builder with **three day-type schedules** (Mon-Thu, Friday, Saturday) each with distinct period timings
- Assign subjects, teachers, rooms, and co-teachers to any class/period slot
- **Real-time conflict detection** — prevents teacher and class double-bookings before saving
- Bulk timetable view with per-class and per-teacher perspectives

### Teacher Absence & Substitution
- Mark a teacher absent on any date — the system auto-creates pending substitution records for every affected timetable slot
- **AI-powered substitute recommendations** using a weighted scoring algorithm that considers:
  - Day workload (number of classes already assigned)
  - Number of other substitutions covering that day
  - Teacher availability preferences
  - Department match with the absent teacher
- Conflict-aware substitution assignment — blocks substitutes who are already teaching at that period or already assigned elsewhere

### Reporting & Analytics
- **Master timetable** view across all classes
- **Daily sheets** with absence and substitution overlays
- **Teacher workload** dashboard showing per-day class counts
- **Class schedules** and **teacher schedules** with weekly breakdown
- Print-optimized output via `@media print` CSS

### Collaboration & UX
- **Public read-only timetable** accessible without login (landing page)
- **Audit logging** — every create/update/delete action recorded with user, timestamp, and description
- **Role-based access control** — `admin` (full access) and `scheduler` (timetable and substitution management)
- **School settings** — configurable school name, logo, academic session, and working days

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENT (React 19)                      │
│  Next.js App Router · Server Components · Server Actions │
└───────────────────────┬──────────────────────────────────┘
                        │ Server Actions (useActionState)
                        ▼
┌──────────────────────────────────────────────────────────┐
│                    SERVER LAYER                          │
│                                                          │
│  ┌────────────┐  ┌──────────────────┐  ┌─────────────┐  │
│  │ Auth       │  │ Actions          │  │ Services    │  │
│  │ NextAuth   │  │ Form handling    │  │ Conflict    │  │
│  │ RBAC       │  │ Zod validation   │  │ Recommend.  │  │
│  │ Guards     │  │ Audit logging    │  │ Absence     │  │
│  └────────────┘  └──────────────────┘  └─────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Prisma ORM → Neon Postgres                         │  │
│  │ 13 tables · composite unique constraints · indexes  │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- Node.js 22+ (see `.nvmrc`)
- pnpm
- A Neon Postgres database (or any PostgreSQL instance)

### 1. Clone and install

```bash
git clone https://github.com/Wasiqashfaq23/smart-attendance.git
cd smart-attendance
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in your values:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon pooled connection string (postgresql://...) |
| `AUTH_SECRET` | Generate with `npx auth secret` |
| `AUTH_TRUST_HOST` | Set to `"true"` for Vercel |

### 3. Set up the database

```bash
pnpm db:push      # Push Prisma schema to database
pnpm db:seed      # Seed teachers, classes, subjects, periods, and breaks
```

### 4. Create an admin user

```bash
OWNER_USERNAME=admin OWNER_PASSWORD=your_secure_password pnpm tsx scripts/set-owner-user.mts
```

### 5. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Production build (runs `prisma generate` first) |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run Vitest unit tests |
| `pnpm db:push` | Push Prisma schema to database |
| `pnpm db:seed` | Seed demo data (teachers, classes, timetable) |
| `pnpm db:generate` | Regenerate Prisma client |
| `pnpm db:migrate` | Run SQLite-to-Neon migration script |

---

## Project Structure

```
smart-attendance/
├── prisma/
│   ├── schema.prisma          # 13 models with relations, indexes, enums
│   └── seed.ts                # Demo data seeder
├── scripts/
│   ├── set-owner-user.mts     # Create initial admin user
│   ├── migrate-sqlite-to-neon.mts
│   └── backfill-break-all-classes.mts
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── (app)/             # Authenticated routes
│   │   │   ├── dashboard/     # Stats overview + recent audit log
│   │   │   ├── timetable/     # Weekly timetable builder
│   │   │   ├── classes/       # ClassRoom CRUD
│   │   │   ├── teachers/      # Teacher CRUD
│   │   │   ├── subjects/      # Subject CRUD
│   │   │   ├── periods/       # Period timing configuration
│   │   │   ├── absences/      # Teacher absence tracking
│   │   │   ├── substitutions/ # Substitute assignment + recommendations
│   │   │   ├── availability/  # Teacher availability preferences
│   │   │   ├── reports/       # Workload + schedule reports
│   │   │   ├── settings/      # School profile + user management
│   │   │   └── master/        # Master timetable view
│   │   └── api/auth/[...nextauth]/  # NextAuth route handler
│   ├── components/            # Shared UI components
│   │   └── managers/          # CRUD manager panels per entity
│   ├── lib/
│   │   ├── actions.ts         # Server actions (680+ lines)
│   │   ├── validation.ts      # Zod schemas for all entities
│   │   ├── guards.ts          # Auth + RBAC guard helpers
│   │   ├── audit.ts           # Audit log writer
│   │   ├── weekdays.ts        # Day-of-week utilities
│   │   └── services/
│   │       ├── conflict.ts    # Timetable conflict detection
│   │       ├── recommendation.ts  # Substitute scoring engine
│   │       ├── substitution.ts    # Assign/cancel substitutions
│   │       ├── absence.ts        # Absence CRUD + auto-substitution
│   │       ├── dashboard.ts      # Dashboard stats aggregation
│   │       └── report.ts         # Report data queries
│   └── types/
│       └── next-auth.d.ts     # NextAuth type augmentation
├── vitest.config.ts           # Test configuration
└── .github/workflows/ci.yml   # CI pipeline
```

---

## Substitution Scoring Algorithm

When a teacher is absent, the system recommends substitutes by computing a score (0–100) for each eligible teacher:

| Factor | Points | Condition |
|---|---|---|
| Base score | 50 | All eligible teachers start here |
| Low workload | +15 | Teacher has ≤2 classes on that day |
| High workload | −10 | Teacher has ≥6 classes on that day |
| Today's substitutions | −5 each | Per substitution already assigned today |
| Marked available | +10 | Teacher explicitly marked available for this period |
| Same department | +8 | Same department as the absent teacher |

Teachers who are already teaching at that period, already assigned to another substitution, or marked unavailable are excluded from recommendations.

---

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import repository on [vercel.com/new](https://vercel.com/new)
3. Set environment variables (`DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST=true`)
4. Vercel auto-detects Next.js and deploys on every push to `main`

### Database

Neon Postgres is the recommended database. Free tier available at [neon.tech](https://neon.tech).

---

## Highlights

- Built a **full-stack timetable management system** using Next.js 16 App Router, TypeScript, Prisma, and Neon Postgres
- Designed a **weighted substitution scoring algorithm** that considers workload, availability, department match, and existing substitution load to recommend optimal substitute teachers
- Implemented **real-time conflict detection** preventing teacher and class double-bookings with detailed user-facing error messages
- Created **role-based access control** (admin/scheduler) with NextAuth v5 and Zod-validated server actions
- Built **print-optimized reporting** including daily sheets with absence/substitution overlays, teacher workload dashboards, and master timetable views
- Implemented **audit logging** across all mutations for administrative accountability
- Deployed on **Vercel** with a **Neon serverless Postgres** database

---

**MIT License**
