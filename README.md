# My CRM

A full-stack CRM application with contact management, deal pipeline tracking, activity logging, and analytics.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: JWT (access + refresh tokens)

## Features

1. **Contact Profiles & History** – Create, view, and manage contacts with full activity history
2. **Pipeline / Deal Tracking** – Kanban board to move deals across stages (Lead → Qualified → Proposal → Negotiation → Closed Won/Lost)
3. **Email & Activity Logging** – Log calls, emails, meetings, and notes against contacts or deals
4. **Reporting & Analytics Dashboard** – Charts for revenue, deal velocity, conversion rates, and activity summaries

## Project Structure

```
my-crm/
├── backend/          # Express API
│   ├── prisma/       # Schema & seed
│   └── src/
│       ├── middleware/
│       ├── routes/
│       └── lib/
└── frontend/         # React SPA
    └── src/
        ├── api/
        ├── components/
        ├── pages/
        ├── store/
        └── types/
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- pnpm (or npm/yarn)

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT secrets
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env with VITE_API_URL if needed
npm install
npm run dev
```

The frontend runs on http://localhost:5173 and the API on http://localhost:3001.

### Seed Credentials

After seeding, log in with:
- **Email**: admin@mycrm.com
- **Password**: password123

## API Overview

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login, get JWT |
| POST | /api/auth/refresh | Refresh access token |
| GET | /api/contacts | List contacts |
| POST | /api/contacts | Create contact |
| GET | /api/contacts/:id | Get contact + history |
| PUT | /api/contacts/:id | Update contact |
| DELETE | /api/contacts/:id | Delete contact |
| GET | /api/deals | List deals |
| POST | /api/deals | Create deal |
| PATCH | /api/deals/:id/stage | Move deal to new stage |
| GET | /api/activities | List activities |
| POST | /api/activities | Log activity |
| GET | /api/analytics/summary | Revenue & pipeline summary |
| GET | /api/analytics/activities | Activity breakdown |

## Environment Variables

See `backend/.env.example` and `frontend/.env.example`.
