# Switching Between Synthetic and Real Databases

BARs Engine supports two development modes: **synthetic (local)** and **real (Vercel)**.

## Quick Switch

### Synthetic Mode (Local)
```bash
npm run dev:local
```
Starts with local Docker Postgres + 40 test players (all nations × archetypes).
- No Vercel access needed
- All synthetic data auto-seeded
- Test emails: `test.{nation}.{playbook}@conclave.local` / password `password`
- Requires Docker running

### Real Mode (Vercel)
```bash
npm run dev:vercel
```
Uses Vercel production database directly.
- Requires Vercel project link (`vercel link` done once)
- Uses `.env.local` pulled from Vercel (`npm run env:pull`)
- Real backend, same as production
- No Docker needed

## Manual Switch

If `dev:local` or `dev:vercel` don't work, switch manually:

```bash
# Switch to synthetic
npm run switch -- local

# Then start
docker compose up postgres   # In another terminal
npm run db:seed
npm run dev

# Switch to real
npm run switch -- vercel
npm run dev
```

## How It Works

- **Synthetic**: DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/bars_engine`
- **Real**: DATABASE_URL = (Vercel Postgres connection from `.env.local`)
- Switching backs up/restores your Vercel URL automatically

## When to Use Each

| Mode | Use when | Setup time |
|------|----------|-----------|
| **Synthetic** | Testing features, no external dependencies needed, working offline | 2 min (Docker + seed) |
| **Real** | Testing production behavior, coordinating with team, before deploy | 1 min (just run it) |

## Verify Current Mode

Check which database you're using:
```bash
grep DATABASE_URL .env.local | head -1
```
- `localhost:5432` → Synthetic (local)
- `prisma.io` or other host → Real (Vercel)

## Troubleshooting

### "Database is unreachable" with synthetic
- Ensure Docker is running: `docker compose up postgres -d`
- Check connection: `npm run smoke`

### "Connection refused" with real
- Ensure you've linked: `vercel link` (once)
- Pull env: `npm run env:pull`
- Check access to Vercel project

### Lost Vercel DATABASE_URL
- Restore from backup: `.env.local.backup` was created when switching to local
- Or re-pull: `npm run env:pull`
