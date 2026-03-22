# Tasks: Typed Quest (BAR) — Building Blocks & Quality

## Research & spec

- [x] **T1** Competitive / OSS research (Trello, Asana, Wekan, Kanboard, Planka, Focalboard) — [RESEARCH.md](./RESEARCH.md)
- [x] **T2** Spec kit scaffold (`spec.md`, `plan.md`, `tasks.md`)

## ADR & schema

- [ ] **T3** ADR: storage shape (normalized vs JSON + Zod) + edge taxonomy
- [ ] **T4** Prisma: `QuestRevision` / `QuestEdge` (or chosen equivalent) + migration
- [ ] **T5** Backfill strategy: map existing `parentId` + `isKeyUnblocker` to new model

## Engine

- [ ] **T6** `assertCanPlace` + completion hooks updating unblock state
- [ ] **T7** Tests: graph invariants, Tetris key compatibility

## Integration

- [ ] **T8** Wire `quest-placement` / `attachQuestToSlot` to typed placement
- [ ] **T9** Audit events for fork / merge

## UI

- [ ] **T10** Eligible-parent picker for unblock from hand/vault
- [ ] **T11** Steward merge / reject (campaign scope)

## Verification

- [ ] **T12** `npm run build` + `npm run check`
- [ ] **T13** Manual: create quest → attach → complete → parent unblocks per rules
