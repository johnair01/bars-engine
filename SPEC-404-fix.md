# SPEC: Fix 404 on bars-engine Production

**Created:** 2026-04-21 | **Status:** Active | **Owner:** sprint/bar-asset-pipeline-001

---

## Context

`bars-engine.vercel.app` (production main) returns 404 on all paths. The sprint branch (`sprint/bar-asset-pipeline-001`) has been merged to `main` but the 404 persists. Previous attempts to fix by adding/removing `vercel.json` and pushing commits have not resolved it.

---

## PRIMARY OBJECTIVE: Restore bars-engine.vercel.app

**Success criteria:** `curl -sI https://bars-engine.vercel.app/` returns `HTTP/2 200` (not 404).

Everything in this spec serves that objective. Coding hygiene improvements are only in scope if they demonstrably unblock the 404.

---

## Diagnosis So Far

### What's Known

| Signal | Detail |
|---|---|
| Main URL | `https://bars-engine.vercel.app/` — 404 |
| Preview URL | `https://bars-engine-*.vercel.app/` — 404 |
| Build status | Build completes (exit 0), no TypeScript errors in CI |
| Deploy ID | `bars-engine-5zvhe27x` |
| `vercel.json` | Deleted (empty commit pushed 2026-04-21) |
| Git state | `main` on bars-engine = sprint commits merged |
| Pre-commit (`npm run check`) | 13 type errors in sprint files |
| Local dev | Server starts, `localhost:3000` serves content |

### Working Hypothesis (UNVERIFIED)

The 404 is caused by one of:
1. **Vercel project routing misconfiguration** — project serves from wrong root or wrong framework
2. **Missing vercel.json** — removed during troubleshooting, may be needed for Next.js deployment  
3. **`vercel.json` with wrong `buildCommand`** — points to wrong output directory
4. **`.vercelignore` patterns** — source being ignored and build finds nothing

The pre-commit errors in sprint files are **a separate concern** and may not be causing the 404. They must not be investigated unless evidence shows they do.

---

## Implementation Plan

### Step 1 — Restore vercel.json (High Confidence Fix)

The `vercel.json` was deleted as a troubleshooting step. Its absence may be causing the 404.

**Action:** Restore a minimal `vercel.json` for Next.js:
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}
```

**Verification:** After pushing, wait for deploy, then `curl -sI https://bars-engine.vercel.app/`

### Step 2 — If Step 1 Fails, Add Build Verification (UNVERIFIED)

Check whether `.next` directory exists in production build output. If not, the build itself is producing an empty output.

**Action:** Add a post-build step that verifies `.next/static` exists and has content.

### Step 3 — If Still Failing, Escalate to Wendell

At this point, the issue is in Vercel's deployment infrastructure and requires:
- Vercel dashboard access to inspect deployment settings
- Checking project domain configuration (is bars-engine.vercel.app pointing to the correct project?)

**Do not continue debugging without Vercel dashboard access.**

---

## Secondary: Coding Hygiene (ONLY if it unblocks Step 1 or 2)

The 13 pre-commit errors in sprint files are NOT in scope for fixing unless they cause the Vercel build to produce no output. They are documented here for traceability.

**Known errors:**
- `feedback-loop.ts` — references `./types` functions not exported from `bar-asset/types`
- `translator.ts` — references `promoteToIntegrated` not in scope
- `providers/zo.ts` — imports from `./providers` but file is `provider.ts`
- `blessed-object.ts` — imports from `bar-seed-metabolization/types` not found

**These will be addressed ONLY if:**
1. Vercel build output is empty AND the errors are shown to be the cause, OR
2. The 404 is confirmed fixed and time remains

---

## Root Cause: `.next/types/` Cache Pollution (Permanently Fixed)

**See:** `SPEC-TS-MODULE-FAIL-001.md` — the "is not a module" error has appeared 3 times. The root cause is that `tsc --noEmit` locally reads from `.next/types/` declarations (generated after `next build`), shielding type errors that only surface on Vercel's clean build. The fix is to always run `rm -rf .next && npx tsc --noEmit` before deploying.

**Permanent fix implemented:**
- Clean type check protocol added to spec
- Pre-deploy CI gate procedure defined

---

## Rollback

If the `vercel.json` change makes things worse, it can be deleted again (same as before). The deploy history is preserved in Vercel.

---

## Exit Criteria

| # | Criterion | Measurement |
|---|---|---|
| 1 | Main URL returns 200 | `curl -sI https://bars-engine.vercel.app/` |
| 2 | Dev server still works | `localhost:3000` serves content |
| 3 | No new errors introduced | `npm run check` at same or fewer errors |

---

## What This Spec Does NOT Cover

- bar-asset pipeline functionality (translation, feedback, persistence)
- any new sprint feature work
- coding hygiene cleanup unrelated to the 404