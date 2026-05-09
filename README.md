# My CRM

A full-stack CRM application with contact management, deal pipeline tracking, activity logging, and analytics. Deploys to Vercel as a single project — frontend, API, and database.

<!-- Deploy: 2026-05-09 -->

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **API**: Express (deployed as a Vercel serverless function)
- **Database**: PostgreSQL via Prisma ORM (Vercel Marketplace / Neon in production)
- **Auth**: JWT (access + refresh tokens)

## Features

1. **Contact Profiles & History** – Create, view, and manage contacts with full activity history
2. **Pipeline / Deal Tracking** – Kanban board to move deals across stages (Lead → Qualified → Proposal → Negotiation → Closed Won/Lost)
3. **Email & Activity Logging** – Log calls, emails, meetings, and notes against contacts or deals
4. **Reporting & Analytics Dashboard** – Charts for revenue, deal velocity, conversion rates, and activity summaries

## Project Structure

```
my-crm/
├── api/               # Vercel serverless function (entry point)
│   └── index.ts
├── server/            # Express app (routes, middleware, lib)
│   ├── app.ts         # createApp() factory used by both api/ and dev server
│   ├── index.ts       # local dev entry point (app.listen)
│   ├── routes/
│   ├── middleware/
│   ├── lib/
│   └── types/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/               # React app
│   ├── App.tsx
│   ├── api/
│   ├── components/
│   ├── pages/
│   ├── store/
│   └── types/
├── public/
├── index.html
├── vercel.json        # routing for /api → function, SPA fallback
├── vite.config.ts
└── package.json
```

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally

### Setup

```bash
git clone https://github.com/guelory/my-crm.git
cd my-crm
cp .env.example .env
# Edit .env with your local DATABASE_URL
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev
```

`npm run dev` runs Vite (http://localhost:5173) and the Express API (http://localhost:3001) in parallel. Vite proxies `/api/*` to Express so the frontend hits the same paths in dev as in prod.

Login with `admin@mycrm.com` / `password123`.

## Deploy to Vercel (one-click)

### 1. Import on Vercel
1. Go to https://vercel.com/new and select your `my-crm` GitHub repo.
2. Leave Root Directory as `./` and framework as **Vite**.
3. Click **Deploy**. The first deploy will fail because there's no database yet — that's fine.

### 2. Add a Postgres database
1. In your Vercel project, go to **Storage → Create Database → Neon (Postgres)**.
2. Connect it to the project. Vercel injects `DATABASE_URL` automatically.

### 3. Add the remaining env vars
Project → **Settings → Environment Variables**, add:
- `JWT_SECRET` → any long random string
- `JWT_REFRESH_SECRET` → another long random string
- `JWT_EXPIRES_IN` → `15m`
- `JWT_REFRESH_EXPIRES_IN` → `7d`
- `NODE_ENV` → `production`

### 4. Redeploy
Trigger a redeploy (Deployments → ⋯ → Redeploy). The build runs `prisma migrate deploy` automatically and creates the schema.

### 5. Seed the database (one-time)
Open the project's **Logs → Functions** or run via Vercel CLI:
```bash
npx vercel env pull .env.local
npm run seed
```
The seed script is idempotent — safe to run multiple times.

### Done
Visit your Vercel URL and log in with `admin@mycrm.com` / `password123`.

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login, returns JWT |
| POST | /api/auth/refresh | Refresh access token |
| GET | /api/contacts | List contacts (search/status filters) |
| POST | /api/contacts | Create contact |
| GET | /api/contacts/:id | Get contact + history |
| PUT | /api/contacts/:id | Update contact |
| DELETE | /api/contacts/:id | Delete contact |
| GET | /api/deals | List deals |
| POST | /api/deals | Create deal |
| PATCH | /api/deals/:id/stage | Move deal to new stage |
| GET | /api/activities | List activities |
| POST | /api/activities | Log activity |
| GET | /api/analytics/summary | Pipeline + revenue summary |
| GET | /api/analytics/activities | Activity breakdown |
| GET | /api/analytics/deals/monthly | Monthly closed revenue |

## Environment Variables

See `.env.example`. In Vercel, `VITE_API_URL` is left blank so the frontend hits `/api/*` on the same origin.
