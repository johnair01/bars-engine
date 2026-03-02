# Spec: Roadblock Metabolism Fixes

## Purpose

Fix the three remaining blockers from the Roadblock Metabolism System implementation so that `build:type-check` and `validate-manifest` pass, and the pre-commit hook runs both checks.

## User Stories

### P1: Fix ai-with-cache type error
**As a developer**, I want the type error in `ai-with-cache.ts` resolved, so `npm run build:type-check` passes and commits are not blocked.

**Acceptance**: `src/lib/ai-with-cache.ts` line 99–107: the `generateObject` callback returns `GenerateObjectResult<unknown>` but the generic expects `Promise<{ object: T }>`. Fix by casting `res.object` to `T` when returning, e.g. `return { object: res.object as T }`, so the type flows correctly.

### P2: Extract admin config Feature Flags form to client component
**As a developer**, I want the Feature Flags form (which uses `onClick`) extracted into a client component, so the admin config page remains a server component and `validate-manifest` passes.

**Acceptance**: Create `src/app/admin/config/FeatureFlagsForm.tsx` with `"use client"`. Move the Feature Flags form (checkboxes, hidden input, submit button with onClick) into it. The server component passes `features` and the `updateFeatures` server action. The client component handles the onClick that collects checkbox state into `#featuresJson` before submit. Admin config page imports and renders `<FeatureFlagsForm features={features} />`.

### P3: Add validate-manifest to pre-commit
**As a developer**, I want the pre-commit hook to run both type-check and validate-manifest, so all roadblock checks run before commit.

**Acceptance**: `.husky/pre-commit` runs `npm run build:type-check && npm run validate-manifest`. Both must pass for commit to succeed.

## Functional Requirements

- **FR1**: `npm run build:type-check` exits 0.
- **FR2**: `npm run validate-manifest` exits 0.
- **FR3**: `.husky/pre-commit` runs both scripts.
- **FR4**: Admin config page remains a server component (async, server-side data fetching).
- **FR5**: Feature Flags form behavior unchanged (checkboxes → JSON → hidden input → server action).

## Reference

- Roadblock Metabolism: [.specify/specs/roadblock-metabolism/spec.md](../roadblock-metabolism/spec.md)
- ai-with-cache: [src/lib/ai-with-cache.ts](../../../src/lib/ai-with-cache.ts)
- Admin config: [src/app/admin/config/page.tsx](../../../src/app/admin/config/page.tsx)
