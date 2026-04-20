# Plan: CYOA Composer Build Contract

## Scope

Implement the missing Issue #36 spec-kit slice that standardizes composer payload persistence and resume behavior.

## Milestones

1. Define canonical data contract and validation schema.
2. Add persistence + resume APIs with revalidation.
3. Integrate hub/spoke handoff and test paths.

## Work Breakdown

### M1 — Contract

- Confirm `CyoaBuild` fields and typing boundaries.
- Define schema-level validation for required composer outputs.
- Document canonical face/template constraints.

### M2 — Persistence and Resume

- Implement save action for terminal composer step.
- Implement load/resume route with checkpoint + revalidate.
- Add deterministic error states for stale/invalid branches.

### M3 — Hub/Spoke Handoff

- Merge `CyoaBuild` into spoke startup payload.
- Preserve campaign context (`ref`, phase, domain metadata).
- Ensure legacy entry paths still function.

### M4 — Verification and Hardening

- Add integration tests for save/resume/handoff.
- Add a verification quest flow for UI validation.
- Run check pipeline and migration discipline steps.

## Implementation Notes

- Use API-first sequencing: contracts before UI behavior changes.
- Keep Sifu/NPC mapping out of canonical face keys.
- Avoid introducing parallel template registries.

## Risks

- Branch revalidation can invalidate user progress unexpectedly.
- Schema drift between existing flows and `CyoaBuild` model.
- Hidden dependency on old string-based face values.

## Mitigations

- Explicit checkpoint fallback behavior with user-facing messaging.
- Compatibility layer for legacy records.
- One parser/normalizer for face values at boundaries.

## Exit Criteria

- `.specify/specs/cyoa-composer-build-cyoa/spec.md` + `tasks.md` accepted.
- Save/resume path operational and tested.
- Issue #36 body references an existing spec-kit path (no dead link).
