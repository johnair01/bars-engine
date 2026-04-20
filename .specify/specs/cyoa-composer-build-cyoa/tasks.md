# Tasks: CYOA Composer Build Contract

## T1 — Contract Definition

- [ ] Define canonical `CyoaBuild` type and shared validation schema.
- [ ] Normalize `GameMasterFace` parsing at API boundary.
- [ ] Define template registry lookup interface for composer usage.

## T2 — Persistence

- [ ] Implement server action to persist terminal composer output.
- [ ] Persist emotional vector provenance and branch path metadata.
- [ ] Return stable response shape `{ success, buildId?, error? }`.

## T3 — Resume + Revalidate

- [ ] Implement resume route loading prior composer state.
- [ ] Revalidate branch eligibility from current emotional state.
- [ ] Add fallback redirect to nearest valid checkpoint passage.

## T4 — Hub/Spoke Integration

- [ ] Update spoke entry flow to consume merged campaign + `CyoaBuild`.
- [ ] Preserve `campaignRef` and prior context during transitions.
- [ ] Verify no regression on non-composer entry points.

## T5 — Tests

- [ ] Add integration tests for save, resume, and revalidation logic.
- [ ] Add regression tests for canonical face and template resolution.
- [ ] Add runtime checks for malformed legacy payloads.

## T6 — Verification Quest

- [ ] Seed `cert-cyoa-composer-build-v1` walkthrough.
- [ ] Validate fresh build completion path.
- [ ] Validate interrupted run resume path after emotional-state change.

## T7 — Data and Migration Discipline

- [ ] If schema changes are required: create migration via `npx prisma migrate dev --name cyoa-build-contract`.
- [ ] Commit migration files and updated Prisma schema.
- [ ] Run `npm run db:sync` and `npm run check`.
- [ ] Review migration SQL for additive safety.

## T8 — Issue Hygiene

- [ ] Confirm Issue #36 spec link resolves to existing directory.
- [ ] Add/confirm explicit spec links on Issue #38 for sprite pipeline scope.
