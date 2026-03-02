# Prompt: Roadblock Metabolism Fixes

**Use this prompt when fixing the remaining blockers from the Roadblock Metabolism System: ai-with-cache type error, admin config Feature Flags form, and pre-commit validate-manifest.**

## Context

After implementing the Roadblock Metabolism System (F 1.2), three items remain:
1. **ai-with-cache.ts** — Type error at line 100: `GenerateObjectResult<unknown>` not assignable to `{ object: T }`. Fix by casting.
2. **admin/config/page.tsx** — Server component has `onClick` on Feature Flags form. Extract form to client component.
3. **pre-commit** — Add `validate-manifest` to the hook so both type-check and manifest validation run.

## Prompt text

> Implement the Roadblock Metabolism Fixes per [.specify/specs/roadblock-metabolism-fixes/spec.md](../specs/roadblock-metabolism-fixes/spec.md). (1) Fix `src/lib/ai-with-cache.ts` line 99–107: cast `res.object as T` when returning from the generateObject callback so the generic type flows. (2) Create `src/app/admin/config/FeatureFlagsForm.tsx` with "use client"; move the Feature Flags form (checkboxes, hidden input, submit button with onClick) into it; pass `features` as prop; use `action={updateFeatures}`. Update admin config page to render `<FeatureFlagsForm features={features} />`. (3) Update `.husky/pre-commit` to run `npm run build:type-check && npm run validate-manifest`. Verify both scripts pass.

## Checklist

- [ ] Fix ai-with-cache type error (cast res.object as T)
- [ ] Create FeatureFlagsForm.tsx client component
- [ ] Update admin config page to use FeatureFlagsForm
- [ ] Add validate-manifest to pre-commit hook
- [ ] `npm run build:type-check` passes
- [ ] `npm run validate-manifest` passes

## Reference

- Spec: [.specify/specs/roadblock-metabolism-fixes/spec.md](../specs/roadblock-metabolism-fixes/spec.md)
- Plan: [.specify/specs/roadblock-metabolism-fixes/plan.md](../specs/roadblock-metabolism-fixes/plan.md)
- Tasks: [.specify/specs/roadblock-metabolism-fixes/tasks.md](../specs/roadblock-metabolism-fixes/tasks.md)
- Roadblock Metabolism: [roadblock-metabolism](roadblock-metabolism.md)
