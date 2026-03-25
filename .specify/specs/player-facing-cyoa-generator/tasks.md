# Tasks: Player-facing CYOA generator

## Spec kit

- [x] `spec.md` (Purpose/Practice, premises, use cases, API sketch, phased MVP, Verification Quest stub)
- [x] `plan.md`
- [x] `tasks.md`
- [x] Register in [BACKLOG.md](../../backlog/BACKLOG.md) (row **PFCG**)
- [x] After BACKLOG edit: `npm run backlog:seed`
- [x] Backlog prompt: [player-facing-cyoa-generator.md](../../backlog/prompts/player-facing-cyoa-generator.md)

## Phase 0 — Spec-only / design locks

- [ ] **Dominion matrix** — Document which `InstanceMembership` / campaign roles may submit CYOA proposals (table in spec or plan).
- [ ] **Artifact choice** — Lock: `Adventure` draft vs `QuestProposal` vs new model (ADR paragraph in `plan.md`).
- [ ] **Reader technology** — Choose preview path: JSON event-invite style vs Twine micro-module vs hybrid; cite in `plan.md`.

## Phase 1 — Private draft + validate (implementation future)

- [ ] Prisma models + migration for draft graph storage
- [ ] `createCyoaGeneratorDraft` server action
- [ ] `validateCyoaGeneratorGraph` deterministic rules
- [ ] Player UI: create draft from BAR (authenticated)

## Phase 2 — Unlisted share

- [ ] Token URL + play route; rate limit middleware or action guard

## Phase 3 — Campaign proposal queue

- [ ] `submitCyoaProposalToCampaign` + steward list/approve/reject
- [ ] Promotion to `Adventure` or campaign attachment per Phase 0 decision

## Phase 4 — AI fill (optional)

- [ ] Opt-in fill inside validated nodes; provenance fields

## Verification quest (when UI ships)

- [ ] `cert-player-facing-cyoa-generator-v1` story + seed + npm script

## Final

- [ ] `npm run check` / `npm run build` after implementation phases
