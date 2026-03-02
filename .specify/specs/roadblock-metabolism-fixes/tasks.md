# Tasks: Roadblock Metabolism Fixes

## Phase 1: ai-with-cache Type Fix

- [ ] Fix type error in `src/lib/ai-with-cache.ts` line 99–107 (cast `res.object as T`)
- [ ] Run `npm run build:type-check` — must pass

## Phase 2: Feature Flags Client Component

- [ ] Create `src/app/admin/config/FeatureFlagsForm.tsx` with "use client"
- [ ] Move Feature Flags form (checkboxes, hidden input, button with onClick) into FeatureFlagsForm
- [ ] Update `src/app/admin/config/page.tsx` to import and render FeatureFlagsForm
- [ ] Run `npm run validate-manifest` — must pass

## Phase 3: Pre-commit Hook

- [ ] Update `.husky/pre-commit` to run both `build:type-check` and `validate-manifest`

## Verification

- [ ] `npm run build:type-check` exits 0
- [ ] `npm run validate-manifest` exits 0
- [ ] Feature Flags form works (toggle checkboxes, save, verify audit log)
- [ ] Pre-commit rejects commit with intentional type error
