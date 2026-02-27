# Environment Variables and Vercel

The app uses **Vercel** as the single source of truth for secrets (e.g. `DATABASE_URL`, `OPENAI_API_KEY`). Local development should pull from Vercel when possible so env stays in sync and no secrets live in the repo.

## If you have Vercel project access (preferred)

1. **Install Vercel CLI**  
   `npm i -g vercel` or use `npx vercel` when running commands.

2. **Link the project once**  
   In the repo root: `vercel link`  
   Follow the prompts to select the correct team and project if needed.

3. **Pull env into a local file**  
   `vercel env pull .env.local`  
   This creates or overwrites `.env.local` with the project’s environment variables (including `DATABASE_URL`). No copy-paste of URLs; no secrets in the repo; same vars as Production/Preview.

4. **Stay in sync**  
   When env vars are added or changed in the Vercel dashboard, run `vercel env pull .env.local` again.  
   You can also use the npm script: `npm run env:pull`.

Next.js loads `.env.local` automatically. Then run `npm run dev` as usual.

## If you don’t have Vercel access

1. Copy the template: `cp .env.example .env`
2. Get `DATABASE_URL` (and any other required vars) from your team lead or your team’s password manager.
3. Put the values into `.env`. Do not commit `.env`.

## Vercel dashboard

- **Where**: [Vercel Dashboard](https://vercel.com/dashboard) → your project → **Settings** → **Environment Variables**.
- **What to set**: At minimum, `DATABASE_URL` (PostgreSQL connection string) and `OPENAI_API_KEY` if you use AI features. Set them for the environments you use (Production, Preview, and optionally Development if you use a separate dev database).
- **Sync**: Production and Preview deployments use these values. Local dev uses whatever you pulled with `vercel env pull .env.local` or put in `.env`.

No secrets or real URLs belong in the repo; only this doc and `.env.example` (with placeholders).

---

## Troubleshooting

If `DATABASE_URL` errors appear in build or Prisma commands (e.g. `npm run build`, `npm run db:push`), ensure you've run `npm run env:pull` (or have `.env` with `DATABASE_URL`). The app loads `.env.local` first; all scripts now do the same.

## GitHub Codespaces

In GitHub Codespaces, run `vercel link` then `npm run env:pull` once to populate `.env.local`. If you don't have Vercel access, copy `.env.example` to `.env` and add `DATABASE_URL` from your team.

---

## Confirm you have database access

Use this checklist to confirm `DATABASE_URL` is set and the app can reach the database.

1. **Get env locally**
   - **With Vercel access:** In the repo root run `vercel link` (once), then `npm run env:pull`. This creates/overwrites `.env.local` with `DATABASE_URL` and other vars from the project.
   - **Without Vercel access:** Copy `.env.example` to `.env` and add the real `DATABASE_URL` value you received from your team (e.g. from a password manager). Do not commit `.env`.

2. **Verify env and database**
   - From the repo root run: `npm run smoke`
   - The script loads `.env.local` then `.env` and checks for `DATABASE_URL` and DB connectivity. You should see `✓ DATABASE_URL is present` and `✓ Database is reachable`.
   - If `DATABASE_URL` is reported missing, ensure `.env.local` (or `.env`) exists in the repo root and contains a line `DATABASE_URL=...`.
   - If the database is unreachable, check the URL (typos, network, firewall) or confirm you are using the same source as the Vercel project (e.g. the URL from the Vercel dashboard).

3. **Run the app**
   - `npm run dev` then open http://localhost:3000. Next.js loads `.env.local` automatically. The front page should load without `Environment variable not found: DATABASE_URL`.

If any step fails, fix it before the next. The most common cause of the front-page error is step 1 not done (no `.env.local` or `.env` with `DATABASE_URL`).

---

## Running seed scripts

Seed scripts (e.g. `npm run seed:cert:cyoa`, `npm run seed:onboarding`, `npm run db:seed`) use the database and **require `DATABASE_URL`** to be set. If you run a seed without it, the script will exit with a short message pointing here and to `npm run env:pull` / `npm run smoke`.

1. **Get env first**: Run `npm run env:pull` (if you have Vercel access) or copy `.env.example` to `.env` and add the URL from your team.
2. **Optional check**: Run `npm run smoke` to confirm `DATABASE_URL` is present and the database is reachable.
3. **Then run the seed**: e.g. `npm run seed:cert:cyoa` or `npm run seed:onboarding`.
