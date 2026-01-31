# Bars Engine MVP — Deployment & Operations Runbook

**Goal**: Deploy for the Feb 21 Party.
**Status**: MVP Logic Implemented.

## 1. Prerequisites (Local & Vercel)
Ensure you have the following Environment Variables set:
```env
DATABASE_URL="file:./dev.db"  # For Local
# DATABASE_URL="..."          # For Vercel (Postgres Connection String)
```

## 2. Initialization Commands
Since `npx` was not available in the agent environment, you must run these commands manually to initialize the project:

```bash
# 1. Install Dependencies
npm install

# 2. Initialize Database (Run Migrations)
npx prisma migrate dev --name init

# 3. Seed Initial Data (Roles, Bars, Admin Invite)
npx tsx prisma/seed.ts
```

## 3. Deployment Steps (Vercel)
1.  **Push code to Git**.
2.  **Import Project in Vercel**.
    - Framework Preset: Next.js
    - Root Directory: `bars-engine/web` (if applicable)
3.  **Configure Database**:
    - **CRITICAL**: Do NOT use `file:./dev.db` for Vercel unless you want data to be lost on every deploy.
    - Create a Vercel Postgres store (or use Supabase/Neon).
    - Set `DATABASE_URL` in Vercel Project Settings.
4.  **Build Command**: `next build` (default)
5.  **Install Command**: `npm install` (default)

## 4. Admin Manual
**Access**: `/admin`
*No authentication is enforced on /admin for this MVP version. Share URL secretly.*

### Creating an Invite
Currently, invites are created via Seed or DB access.
**To create a new invite manually via Console**:
```bash
npx tsx -e 'import {db} from "./src/lib/db"; db.invite.create({ data: { token: "PARTY_GUEST_1", status: "active" } }).then(console.log)'
```
*(Or use the Admin Dashboard if "Create Invite" feature is added)*

### Admin Actions
- **Grant Vibulons**: Enter amount and click `+V`.
- **Assign Quest**: Select Quest and click `+Q`.
