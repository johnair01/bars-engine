# Plan: Push to Main and Vercel Deployment

**Branch**: `main` | **Date**: 2026-03-02 | **Type**: Release / Deployment
**Input**: Changes made today (Campaign In-Context Editing, avatar sprites, admin/config, docs, etc.)

## Summary

Prepare and execute a safe push to `main` with Vercel deployment. Covers pre-push checks, commit strategy, push flow, and post-deploy verification.

---

## 1. Pre-Push Checklist

### 1.1 Automated Gates

Run these **before** staging any commits:

```bash
# 1. Build (includes prisma migrate deploy)
npm run build

# 2. Type check
npm run build:type-check

# 3. Lint
npm run lint

# 4. Smoke (env + DB connectivity)
npm run smoke

# 5. Loop readiness (full: build, db:reset-history, feedback-cap test)
DATABASE_URL="<from .env.local>" npm run loop:ready
```

**Quick mode** (skip build, for iterative checks):

```bash
DATABASE_URL="<from .env.local>" npm run loop:ready:quick
```

- [ ] `npm run build` passes
- [ ] `npm run build:type-check` passes
- [ ] `npm run lint` passes (or known acceptable warnings)
- [ ] `npm run smoke` passes
- [ ] `npm run loop:ready` passes (or `loop:ready:quick` if build already verified)

### 1.2 Schema and Migrations

- [ ] `prisma/schema.prisma` changes (if any) have migrations in `prisma/migrations/`
- [ ] `npm run db:sync` has been run locally after schema edits (per `.cursorrules`)
- [ ] Production DB will receive migrations via `prisma migrate deploy` during Vercel build

### 1.3 Environment

- [ ] Vercel project has required env vars: `DATABASE_URL`, `OPENAI_API_KEY` (if AI features used)
- [ ] No new secrets needed for this release, or they are already set in Vercel Dashboard

---

## 2. Commit Strategy

### Option A: Single Squash Commit (simpler)

One commit with a descriptive message covering the main changes:

```bash
git add -A
git status   # review what's staged
git commit -m "feat: campaign in-context editing, avatar sprites, admin/config updates

- Campaign: admin Edit modal for passage text, choices, slide breaks (---)
- Avatar: nation/playbook sprites, canonical base, derive scripts
- Admin: config, instances, onboarding, books, avatars
- Docs: ENV_AND_VERCEL, LOOP_READINESS, SPRITE_ASSETS
- Spec kits: campaign-in-context-editing, avatar-sprite-quality, etc."
```

### Option B: Logical Commits (cleaner history)

Group by feature area:

| Commit | Files | Message |
|--------|-------|---------|
| 1 | `src/actions/campaign-passage.ts`, `CampaignPassageEditModal.tsx`, `CampaignReader.tsx`, `campaign/page.tsx`, `slide-chunker.ts` | `feat(campaign): in-context editing for admins` |
| 2 | `prisma/schema.prisma`, migrations, `src/actions/*`, `src/app/admin/*`, etc. | `feat(admin): config, instances, books, avatars` |
| 3 | `public/sprites/**`, `scripts/*sprite*`, `docs/SPRITE_ASSETS.md` | `feat(avatar): nation/playbook sprites, canonical base` |
| 4 | `.specify/**`, `docs/**`, misc | `chore: spec kits, docs, backlog` |

**Recommendation**: Option A for speed; Option B if you want granular revert points.

---

## 3. Push Flow

### 3.1 Pre-Push

```bash
git branch --show-current   # expect: main
git status --short
git log -1 --oneline        # confirm last commit
```

### 3.2 Push

```bash
git push origin main
```

### 3.3 Vercel

- Vercel auto-deploys on push to `main` (if connected)
- Check [Vercel Dashboard](https://vercel.com/dashboard) → Project → Deployments
- Build logs: `prisma migrate deploy` runs first, then `next build`

---

## 4. Post-Deploy Verification

### 4.1 Build Success

- [ ] Vercel deployment shows "Ready" (green)
- [ ] No build errors in deployment logs

### 4.2 Quick Smoke (Production URL)

```bash
npm run preview:link   # prints production URL if configured
```

- [ ] Home page loads
- [ ] `/login` loads
- [ ] `/campaign?ref=bruised-banana` loads (admin sees Edit button when logged in as admin)

### 4.3 Campaign In-Context Editing (New Feature)

- [ ] Sign in as admin
- [ ] Go to `/campaign?ref=bruised-banana`
- [ ] "Edit" button visible on a passage
- [ ] Click Edit → modal opens with text and choices
- [ ] Save → modal closes, content refreshes

### 4.4 Loop Readiness (Manual)

Per [docs/LOOP_READINESS_CHECKLIST.md](../../docs/LOOP_READINESS_CHECKLIST.md):

- [ ] Sign in works
- [ ] Quest completion mints vibeulons
- [ ] Wallet reflects balance

---

## 5. Rollback (If Needed)

If deployment fails or critical bug found:

```bash
# Revert last commit locally
git revert HEAD --no-edit
git push origin main

# Or reset to previous commit (destructive, use with care)
git reset --hard HEAD~1
git push origin main --force
```

Vercel will redeploy the previous commit. For DB migrations, consider whether a revert migration is needed.

---

## 6. File Summary (Today's Changes)

| Category | Paths |
|----------|-------|
| Campaign in-context | `src/actions/campaign-passage.ts`, `CampaignPassageEditModal.tsx`, `CampaignReader.tsx`, `campaign/page.tsx`, `slide-chunker.ts` |
| Admin | `src/app/admin/**`, `src/actions/admin*.ts`, `AdminNav`, `AdminPlayerEditor`, etc. |
| Avatar/Sprites | `public/sprites/**`, `scripts/derive-base-sprites.ts`, `scripts/generate-nation-placeholders.ts`, `avatar-utils.ts`, `Avatar.tsx` |
| Books | `src/app/admin/books/**`, `src/actions/books.ts`, `book-analyze.ts`, etc. |
| Docs | `docs/ENV_AND_VERCEL.md`, `docs/LOOP_READINESS_CHECKLIST.md`, `docs/SPRITE_ASSETS.md`, etc. |
| Spec kits | `.specify/specs/**`, `.specify/backlog/**` |

---

## Reference

- Loop readiness: [docs/LOOP_READINESS_CHECKLIST.md](../../docs/LOOP_READINESS_CHECKLIST.md)
- Env & Vercel: [docs/ENV_AND_VERCEL.md](../../docs/ENV_AND_VERCEL.md)
- Campaign spec: [.specify/specs/campaign-in-context-editing/spec.md](../campaign-in-context-editing/spec.md)
