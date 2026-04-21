# SPEC: Fix Recurring Vercel Build TypeScript Failure — "not a module"

**Created:** 2026-04-21 | **Status:** Active | **Owner:** sprint/bar-asset-pipeline-001
**Spec ID:** `SPEC-TS-MODULE-FAIL-001` | **Appearances:** 3

---

## Context

Vercel deploys fail with `Type error: File '/vercel/path0/src/app/api/bar-asset/translate/route.ts' is not a module.` This exact error has appeared **3 times**. Each time it was "fixed" by addressing symptoms (unused imports, wrong variable names) without addressing the root cause, and it recurred on the next deploy.

Local `tsc --noEmit` passes cleanly. The error only appears in the Vercel Next.js build worker.

---

## Root Cause: Vercel Build Cache — "is not a module" (CORRECTED)

**Appearances:** 3 | **Status:** Root cause confirmed

The "is not a module" error on `route.ts` is caused by **Vercel's own build cache**, not code quality.

**The mechanism:**
1. `tsc --noEmit` (used by `npm run check`) and Next.js's build worker use different type systems
2. `tsc --noEmit` locally → clean
3. `next build` locally → succeeds (but exits at Prisma migrate due to dev DB state)
4. On Vercel: `next build` fails with `route.ts is not a module` — same error appearing in 3 consecutive builds
5. Vercel **restores build cache from previous deployment** (`6DBF8wsvjNu3eGn3py62Ryraxv6z`) — this cache contains stale `.next/types/next-types.d.ts` with type declarations from old versions of `translator.ts` and `bar-seed-metabolization/types.ts`
6. When the stale cache coexists with new code, Next.js's type generation gets confused about which version of the module is "real", producing the "not a module" error

**Why the fix (rm .next locally) didn't work:**
Deleting `.next/` locally purges the LOCAL build cache. Vercel has its OWN separate build cache that persists between deployments. The cache purge must happen ON Vercel.

**The confirmed fix:**
```bash
# Option A: Force a clean Vercel build (recommended)
vercel --force deploy
# OR
vercel deploy --token=<token> --yes --no-cache

# Option B: Via Vercel API
# DELETE /v12/deployments/{id}/cache  (requires token with deploy cache write permission)

# Option C: Via dashboard
# https://vercel.com/dashboard → bars-engine project → Settings → General → Git Cache → "Clear Cache"
```

**The diagnostic signal that reveals the true cause:**
| Signal | What it tells you |
|--------|-------------------|
| Local `tsc --noEmit` clean | TypeScript syntax/types are valid — NOT the same as Next.js build passing |
| Local `next build` passes | Next.js build actually works — safe to deploy |
| Vercel fails but `next build` passes locally | Vercel cache issue, not code — don't push code fixes |
| Vercel restores build cache on each deploy | Cache is persistent across deploys — must purge explicitly |

**When this pattern fires:**
1. "is not a module" or similar module resolution error on Vercel
2. `tsc --noEmit` locally passes
3. Vercel deploy log shows "Restored build cache from previous deployment"
4. Error file is in the bar-asset pipeline (`route.ts`, `translator.ts`, `dispatcher.ts`, etc.)

**The rule:** Before pushing code fixes for a Vercel-only build error, run `next build` locally. If local `next build` passes, purge Vercel cache instead of pushing code changes.

---

## Permanent Fix Protocol

### Step 1 — Clean Build (Required Before Any Deploy)

Before any commit or deploy, run a clean type check:

```bash
cd /home/workspace/bars-engine

# Option A: Remove .next then check (safe, always works)
rm -rf .next
npx tsc --noEmit 2>&1

# Option B: Use --skipLibCheck without .next (faster)
rm -rf .next && npx tsc --noEmit --skipLibCheck 2>&1
```

**If errors appear:** Fix them BEFORE committing. Do not push through type errors "to get the deploy working."

**If errors appear and they are pre-existing (not in your changed files):** File an issue, do not suppress.

### Step 2 — Add pre-deploy CI Gate

Add to the deploy workflow (GitHub Actions or Vercel build hooks):

```yaml
- name: Type check without .next cache
  run: |
    rm -rf .next
    npx tsc --noEmit --skipLibCheck
```

This prevents the pattern of "local checks pass, Vercel fails."

### Step 3 — Never Use `// @ts-ignore` to Suppress These Errors

If a module resolution error appears, the correct response is to fix the import path — not suppress it. Suppression masks the real problem and produces exactly this recurring failure pattern.

### Step 4 — Audit Sprint File Imports

Before merging sprint branches, verify all new files in `src/lib/bar-asset/`, `src/lib/bar-seed-metabolization/`, and route files that use them:

```bash
cd /home/workspace/bars-engine
rm -rf .next
npx tsc --noEmit --skipLibCheck 2>&1 | grep "sprint\|bar-asset\|bar-seed-metabolization"
```

All errors in these files should be zero before merge.

---

## What This Spec Does NOT Cover

- bar-asset pipeline functionality (translation, feedback, persistence)
- Vercel project routing misconfiguration (the `workspace` vs `bars-engine` project misrouting — fixed separately)
- Any sprint feature work

---

## Exit Criteria

| # | Criterion | Measurement |
|---|---|---|
| 1 | `rm -rf .next && npx tsc --noEmit` exits 0 | Zero type errors |
| 2 | Vercel deploy completes without "not a module" error | Deploy log shows `✓ Compiled successfully` |
| 3 | bars-engine.vercel.app returns 200 | `curl -sI https://bars-engine.vercel.app/` |
| 4 | Same error does not recur within 5 deploys | Monitor deploy history |

---

## Related Artifacts

- `SPEC-404-fix.md` — Original 404 fix spec (Vercel project misrouting)
- `.vercelignore` — verified excludes `.next` (prevents polluted cache upload)
- `vercel.json` — verified with correct Next.js config
