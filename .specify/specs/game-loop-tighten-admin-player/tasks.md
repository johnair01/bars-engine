# Tasks: Game Loop Tighten — Admin vs Player

## Phase 1: Audit + Unified API

### Audit

- [x] **T0.1** Create `.specify/specs/game-loop-tighten-admin-player/ADMIN_QUEST_PATHS.md`. Document each path: upsertQuest (admin.ts), Quest Grammar (/admin/quest-grammar), generateQuestFromReading (hexagram), generateQuestProposalFromBar (BAR), book analysis (book-analyze.ts), gameboard handleCreateQuestForAid, Quest Proposals (/admin/quest-proposals). For each: input, output, grammar, edit surface, campaign linkage, one-click?.
- [x] **T0.2** Identify shared vs divergent logic across paths. Note blockers: context input, grammar choice, editable output, campaign linkage, OPENAI_API_KEY.

### Unified API

- [x] **T1.1** Define `GenerateQuestFromContextInput` type in spec or `src/lib/quest-generation/types.ts`. Fields: campaignRef, kotterStage?, slotId?, slotQuestId?, allyshipDomain?, template?, moveType?.
- [x] **T1.2** Create `generateQuestFromContext(input)` Server Action. Location: `src/actions/quest-generation.ts` (new) or extend `quest-grammar.ts`. Check admin via `checkAdmin()`.
- [x] **T1.3** Implement `generateQuestFromContext`: build context from input, call `compileQuestWithAI` (reuse existing), when slotId/slotQuestId provided call `publishGameboardAlignedQuestToPlayer`, else create draft CustomBar and return questId.
- [x] **T1.4** Handle `QUEST_GRAMMAR_AI_ENABLED=false` and missing OPENAI_API_KEY: return error with clear message.

### Wire UI

- [x] **T2.1** Wire gameboard slot "Generate grammatical quest" (or equivalent) to `generateQuestFromContext`. If `generateGameboardAlignedQuest` already does this, consider replacing with unified API or delegating.
- [x] **T2.2** Optional: Add admin panel page `/admin/quest-from-context` with form: campaignRef, slotId (optional), allyshipDomain, template. Submit → `generateQuestFromContext`.

### Unlock Contract

- [x] **T3.1** Document `onPlayerQuestCompletion(questId, playerId, campaignRef)` in spec.md. Define: when called (completeQuestForPlayer, passage completion), downstream effects (funding, stage, slot). No implementation yet.

### Verification (Phase 1)

- [x] **T4.1** `npm run build` and `npm run check` pass.
- [ ] **T4.2** Manual: Admin generates quest from gameboard slot via one click → quest appears under slot.
- [ ] **T4.3** Manual: Admin generates from campaign + domain (no slot) → draft returned for manual placement.

---

## Phase 2: Unlock Hook + Separation

### Unlock Hook

- [x] **T5.1** Implement `onPlayerQuestCompletion(questId, playerId, campaignRef)` in `src/actions/quest-completion.ts` or `gameboard.ts`. Export for use by completion flows.
- [x] **T5.2** Call `onPlayerQuestCompletion` from `completeQuestForPlayer` (or equivalent) when quest has `campaignRef`. Pass questId, playerId, campaignRef.
- [x] **T5.3** Implement downstream effects: instance funding, Kotter stage advance, or new slot availability (per product decision). Start with event/log; extend to DB updates as needed.

### Separation

- [x] **T6.1** Audit gameboard, dashboard, Hand for admin-only controls. Ensure "Generate grammatical quest" and similar are gated by `isAdmin` or moved to `/admin/*`.
- [x] **T6.2** Move admin generation from gameboard to admin panel, or add clear admin-only badge. Player flows stay clean when not admin.
- [x] **T6.3** Revalidate paths after changes.

### Verification Quest

- [x] **T7.1** Create verification quest `cert-game-loop-tighten-v1`: steps (1) Admin generates quest from slot, (2) Quest under slot, (3) Admin edits via Quest Grammar, (4) Player completes quest, (5) Unlock hook fires (or stub). Narrative: Bruised Banana Fundraiser.
- [x] **T7.2** TwineStory + CustomBar with `isSystem: true`, `visibility: 'public'`, idempotent seed.
- [x] **T7.3** Add `seed:cert:game-loop-tighten` script.

### Verification (Phase 2)

- [x] **T8.1** `npm run build` and `npm run check` pass.
- [ ] **T8.2** Manual: Player completes campaign quest → unlock hook fires.
- [ ] **T8.3** Manual: Non-admin sees no admin generation controls on gameboard/dashboard.
