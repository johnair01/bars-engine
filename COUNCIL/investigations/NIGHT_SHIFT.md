# bars-engine Deployment Crisis — Night Shift Investigation

**Opened:** 2026-04-18 01:50 UTC  
**Status:** RESOLVED — Migrated to Render (April 18, 2026)
**Resolution:** Backend moved to Render (`https://bars-backend-5fhb.onrender.com`). Railway endpoint (`bars-enginecore-production.up.railway.app`) is deprecated and should not be used.
**Jump-off target:** `SPEC.md` (superseded by render migration)

---

## Agent Roster

| Agent | Face | Domain | Output |
|-------|------|--------|--------|
| `gm-architect` | 🧠 | Infrastructure topology, component map | `01-architect.md` |
| `gm-regent` | 🏛 | Failure mode analysis, priority ranking | `02-regent.md` |
| `gm-challenger` | ⚔️ | Assumption auditing, what we're wrong about | `03-challenger.md` |
| `gm-diplomat` | 🎭 | Service contracts, API boundaries | `04-diplomat.md` |
| `gm-shaman` | 🌊 | Hidden dependencies, background processes | `05-shaman.md` |
| `gm-sage` | 📖 | Solution paths, ranked by risk/reward | `06-sage.md` |

## Timeline (known facts)

| Time (UTC) | Event |
|------------|-------|
| 2026-04-14 | `registry.json` last valid state |
| 2026-04-18 00:53 | `registry.json` regenerated during env refresh (`d0df9fb`) |
| 2026-04-18 ~01:00 | Railway deployment triggered |
| 2026-04-18 ~01:15 | GitHub Actions deployment fires |
| 2026-04-18 01:50 | Railway returns 502 on `/api/` |

## Known symptoms

1. `curl https://bars-enginecore-production.up.railway.app/api/` → 502
2. Railway healthchecks active but failing
3. GitHub Actions deployment in progress
4. Vercel frontend — unknown state (needs log inspection)
5. `backend/Dockerfile` CMD changed from `python -m uvicorn` to bare `uvicorn`

## Key files

- `/home/workspace/bars-engine/src/app/page.tsx` — homepage, 500+ lines, 15+ DB queries
- `/home/workspace/bars-engine/backend/` — Railway Python backend
- `/home/workspace/bars-engine/src/actions/onboarding.ts`
- `/home/workspace/bars-engine/src/actions/instance.ts`
- `/home/workspace/bars-engine/src/lib/campaign-player-home.ts`
- `/home/workspace/bars-engine/prisma/schema.prisma`
- `/home/workspace/bars-engine/public/registry.json`

---

*Agent outputs below this line — each agent appends their report*
