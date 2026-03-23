# Tasks: CYOA blueprint → BAR metabolism

Source: [.specify/specs/cyoa-blueprint-bar-metabolism/spec.md](./spec.md) · [.specify/specs/cyoa-blueprint-bar-metabolism/plan.md](./plan.md)

## Phase 1 — Auth & CTA gating

- [x] **1.1** Document `AuthContext` in a shared types module (or reuse existing auth helpers).
- [x] **1.2** Thread `playerId` / `isAuthenticated` into CYOA/adventure render pipeline (where passage HTML or JSON is built).
- [x] **1.3** Audit `compileQuestCore` / GM packet defaults for `Create my account` / signup links; gate on auth (`QuestCompileInput.isAuthenticated`, `compileMovesGMPacket`, server actions pass session).
- [x] **1.4** Add tests: authenticated render omits signup choice; anonymous retains it (fixture-based).

## Phase 2 — Cardinality & labels

- [ ] **2.1** Introduce body variant or slot model keyed by `choices.length` (or explicit `cardinality` in content).
- [ ] **2.2** Migrate worst-offending templates (developmental lens, orientation branches) to variants.
- [x] **2.3** Extend choice schema with `buttonLabel` + optional `voiceLine` distinct from `blueprintKey` (choice `blueprintKey` optional on passage JSON).
- [ ] **2.4** Storybook or snapshot test: 1 vs 3 choices render expected body shape.

## Phase 3 — Blueprint & BAR emission

- [x] **3.1** Create `blueprintKey` → prompt library mapping (file or DB seed).
- [x] **3.2** Implement `commitCyoaChoice({ runId, nodeId, choiceId })` → BAR create + ledger append (via existing `emitBarFromPassage` / `createBarFromMoveChoice` + `appendCyoaArtifactBar`).
- [x] **3.3** Persist **artifact ledger** (`PlayerAdventureProgress.stateData.cyoaArtifactLedger`).
- [x] **3.4** Error handling: log + user-safe message if BAR create fails; do not corrupt ledger (append best-effort after BAR create).

## Phase 4 — Modal & Transcendence

- [x] **4.1** Build bottom **CyoaBarLedgerSheet** listing BARs from ledger.
- [x] **4.2** Transcendence node/section: full list + links to BAR detail if product requires (auto-expand when `metadata.beat === 'transcendence'` or body title matches).
- [ ] **4.3** Mobile + keyboard accessibility pass on modal.

## Phase 5 — Hexagram

- [x] **5.1** Persist hexagram draw into `cyoaState` on cast/select (`stateData.cyoaHexagramState` via `saveCyoaHexagramSnapshot`).
- [ ] **5.2** Expose state to passage renderer (Twine vars or adapter map).
- [ ] **5.3** Optional: filter prompt library by hexagram tags; document limits.

## Phase 6 — Milestones (stretch)

- [ ] **6.1** Emit deterministic tags (`hexagram:`, `blueprint:`) for milestone guidance consumer.
- [ ] **6.2** Wire to `getCampaignMilestoneGuidance` only where BB instance active.

## Verify

- [ ] `npm run check`
- [ ] `npm run build`
- [ ] Manual: dashboard → I Ching / orientation path → no signup CTA; modal shows BARs; transcendence lists all
