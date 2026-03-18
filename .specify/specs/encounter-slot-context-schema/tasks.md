# Tasks: Encounter Slot Context Schema

## Phase 1: Type + Seed Extension (No AI, No Schema Change)

- [ ] **1.1** Extend `PassageSlot` interface in `src/lib/template-library/index.ts` with optional context fields: `gameMasterFace`, `campaignFunction`, `requiredContext`, `outputArtifact`, `choiceCount`.
- [ ] **1.2** Add `SlotContextKey` type to `src/lib/template-library/index.ts`.
- [ ] **1.3** Extend `GenerateOptions` interface with: `campaignGoal`, `kotterStage`, `domainContext`, `playerArchetype`, `playerNation`, `blockers`, `hexagramTone`, `completionEffectHint`.
- [ ] **1.4** Update `getPlaceholderForSlot` to use `campaignFunction` from slot context when slot is passed (overloaded or second param); fall back to current face guidance when absent.
- [ ] **1.5** Update `scripts/seed-adventure-templates.ts` — add slot context to `encounter-9-passage` using the GATHERING_RESOURCES grammar (gameMasterFace + campaignFunction + requiredContext + outputArtifact per slot).
- [ ] **1.6** Seed a new `gather-resources-encounter` template with canonical GATHERING_RESOURCES grammar.
- [ ] **1.7** `npm run build` and `npm run check` — fail-fix.

## Phase 2: Backend Generation Contract

- [ ] **2.1** Add `EncounterGenerationContext` type to `src/lib/template-library/index.ts`.
- [ ] **2.2** Backend: add `generate_encounter_passages(context: EncounterGenerationContext)` endpoint in `backend/app/routes/` — stub returning `{ [nodeId]: face_placeholder }` using slot context (no AI yet).
- [ ] **2.3** Extend `generateFromTemplate` to accept `contentPerSlot?: Record<string, string>` in options — when provided, uses that text for matching nodeIds instead of placeholder.
- [ ] **2.4** Frontend: "Generate with AI" button in `/admin/templates` — wires to backend stub; passes `EncounterGenerationContext` from admin form; populates `contentPerSlot`.
- [ ] **2.5** Admin form: expose `campaignGoal`, `kotterStage`, `blockers` inputs when generating for a campaign.
- [ ] **2.6** `npm run build` and `npm run check` — fail-fix.

## Phase 3: GM Agent Wiring (AI)

- [ ] **3.1** Backend: wire each slot's `gameMasterFace` to the corresponding agent in `backend/app/agents/` — shaman for context_*, challenger for anomaly_*, diplomat for choice, regent for response, architect for artifact.
- [ ] **3.2** Backend: each agent generates passage text using slot `campaignFunction` + `requiredContext` fields from the generation context.
- [ ] **3.3** Seed templates for remaining allyship domains: RAISE_AWARENESS, DIRECT_ACTION, SKILLFUL_ORGANIZING (grammar TBD).
- [ ] **3.4** Admin templates page: default template selector to `gather-resources-encounter` when `subcampaignDomain = GATHERING_RESOURCES`.
- [ ] **3.5** `npm run build` and `npm run check` — fail-fix.

## Verification

- [ ] **V1** Generate from `gather-resources-encounter` template — each passage shows face-specific placeholder using `campaignFunction` text.
- [ ] **V2** Generate with AI (phase 2+) — each passage contains meaningful campaign-specific content; remains DRAFT until admin promotes.
- [ ] **V3** Campaign goal flows: complete artifact slot quest → `completionEffects` fire → Instance progress moves.
- [ ] **V4** Hexagram → portal → encounter: player picks a GATHERING_RESOURCES portal → enters encounter → slots reference hexagram tone.
