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

## Deploy to Production (Vercel + Railway)

### 1. Deploy backend + database to Railway

1. Go to https://railway.com and sign in with GitHub.
2. Click **New Project → Deploy from GitHub repo** and select `my-crm`.
3. When prompted, set the **Root Directory** to `backend`.
4. Railway will detect Node.js via `nixpacks.toml` and start building.
5. While it builds, click **+ Create → Database → Add PostgreSQL**.
6. Open the backend service → **Variables** tab and add:
   - `DATABASE_URL` = reference variable, click `Add Reference` → `Postgres.DATABASE_URL`
   - `JWT_SECRET` = any long random string
   - `JWT_REFRESH_SECRET` = another long random string
   - `JWT_EXPIRES_IN` = `15m`
   - `JWT_REFRESH_EXPIRES_IN` = `7d`
   - `FRONTEND_URL` = (leave blank for now, fill in after Vercel deploy)
   - `NODE_ENV` = `production`
7. Under **Settings → Networking**, click **Generate Domain** to expose the API publicly. Copy the URL (e.g., `https://my-crm-backend.up.railway.app`).
8. Once deployed, open the service shell (**Settings → ... → Open Shell**) and run:
   ```bash
   npm run seed
   ```
   This populates the demo data and admin user.

### 2. Deploy frontend to Vercel

1. Go to https://vercel.com and sign in with GitHub.
2. Click **Add New → Project** and import `my-crm`.
3. Set **Root Directory** to `frontend` (Vercel auto-detects Vite).
4. Under **Environment Variables** add:
   - `VITE_API_URL` = your Railway URL from step 1.7 (e.g., `https://my-crm-backend.up.railway.app`)
5. Click **Deploy**.
6. Once deployed, copy the Vercel URL (e.g., `https://my-crm.vercel.app`).

### 3. Connect them

Go back to Railway → backend service → **Variables** and set:
- `FRONTEND_URL` = your Vercel URL from step 2.6

The backend will redeploy automatically. Visit your Vercel URL and log in with `admin@mycrm.com` / `password123`.
