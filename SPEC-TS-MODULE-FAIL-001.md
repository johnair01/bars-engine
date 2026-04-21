# SPEC: Fix Recurring Vercel Build TypeScript Failure — "not a module"

**Created:** 2026-04-21 | **Status:** Active | **Owner:** sprint/bar-asset-pipeline-001
**Spec ID:** `SPEC-TS-MODULE-FAIL-001` | **Appearances:** 3

---

## Context

Vercel deploys fail with `Type error: File '/vercel/path0/src/app/api/bar-asset/translate/route.ts' is not a module.` This exact error has appeared **3 times**. Each time it was "fixed" by addressing symptoms (unused imports, wrong variable names) without addressing the root cause, and it recurred on the next deploy.

Local `tsc --noEmit` passes cleanly. The error only appears in the Vercel Next.js build worker.

---

## Root Cause Diagnosis

### What's Actually Happening

The error message is misleading. `route.ts is not a module` does NOT mean `route.ts` is broken — it means one of its **dependencies** failed to resolve or compile, and the Next.js build system cascades that failure upstream.

The chain for `/api/bar-asset/translate/route.ts`:
```
route.ts
  └── @/lib/bar-asset/translator
        ├── @/lib/bar-asset/dispatcher
        │     └── @/lib/bar-asset/providers/index  ✓ (exists, exports resolveProviderFromEnv)
        ├── @/lib/bar-asset/types
        │     └── @/lib/bar-seed-metabolization/types  ✓ (exists)
        └── @/lib/bar-asset/prompts/blessed-object
              └── ./prompts/blessed-object.ts  ✓ (exists)
```

All files exist and import paths are syntactically correct. So why does Vercel fail?

### The Actual Root Cause: `.next/types/` Cache Pollution

**Mechanism:**

1. `tsc --noEmit` (used in local dev) resolves modules through `moduleResolution: "bundler"` + `paths: { "@/*": ["./src/*"] }`. TypeScript follows the `@/` alias to the actual `.ts` files. All imports resolve correctly.
2. BUT: after a successful `next build`, Next.js generates `.next/types/**/*.ts` — type declarations for every route and module, including a large `validator.ts`.
3. When `tsc --noEmit` runs again, it uses the previously generated `.next/types/` declarations INSTEAD of re-resolving the source files. The `.next/types/` directory acts as a shield: even if source imports are temporarily broken, the cached declarations pass.
4. On Vercel, `.next` is NOT preserved between the `tsc --noEmit` check (in `npm run validate:routes`) and the full `next build`. The build starts fresh. TypeScript then discovers the real broken imports.
5. The broken import chain in the sprint files causes cascading "is not a module" errors that surface in files that appear to be fine (like `route.ts`).

**The 3rd-party `.next/types/validator.ts` file (2294 lines) is the smoking gun.** It exists only after a local `next build` and shields type errors from local `tsc --noEmit`.

### What Was Actually Broken (3rd occurrence, 2026-04-21)

Two genuine type errors in sprint files (which `.next/types/` was shielding locally):

1. `src/app/api/iching-stats/route.ts:102` — `playerFaceCounts` used but variable is named `faceCounts`
2. `src/lib/bar-asset/prompts/blessed-object.ts:46` — `${seed.contextNote}` but `contextNote` lives at `seed.metadata?.contextNote`

Both were "fixed" by addressing the symptoms. Both were symptoms of the same underlying problem: the sprint files were added to a codebase with existing type errors that local tooling was hiding.

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
