# Tasks: 321 Shadow Process

## Phase 1 — Unpacking Refactor (done)

- [x] Move unpacking-constants.ts to src/lib/quest-grammar/
- [x] Re-export from quest-grammar/index.ts
- [x] Update UnpackingForm, GenerationFlow, UpgradeQuestToCYOAFlow imports

## Phase 2 — Spec Kit (done)

- [x] Create spec.md
- [x] Create plan.md
- [x] Create tasks.md
- [x] Create backlog prompt

## Phase 3 — BAR Creator Mint (done)

- [x] In `completeQuestForPlayer`, after minting to completer: query CustomBar where `parentId = questId`, `visibility = 'public'`, `creatorId != playerId`
- [x] For each BAR: mint 1 vibeulon to creatorId; log VibulonEvent with `source: 'bar_creator_quest_completion'`
- [x] Run `npm run build` and `npm run check` — fail-fix

## Phase 4 — deriveMetadata321 (done)

- [x] Create `src/lib/quest-grammar/deriveMetadata321.ts`
- [ ] Export `deriveMetadata321(phase3, phase2, phase1): Metadata321`
- [ ] Rules: title from q1+q5; description from concatenated answers; tags from q2/q4/q6 options
- [ ] Add unit test if test pattern exists

## Phase 5 — createCustomBar Extension

- [ ] Accept `metadata321` in FormData (JSON string)
- [x] When present: parse and use to pre-fill title, description, tags; linkedQuestId takes precedence over form field
- [x] Run `npm run build` and `npm run check`

## Phase 6 — 321 UI (done)

- [x] Create 321 form page at /shadow/321
- [ ] Phase 3: taxonomic fields (nation/archetype, developmental lens, gender)
- [ ] Phase 2: render UNPACKING_QUESTIONS from @/lib/quest-grammar
- [ ] Phase 1: identification/integration (textarea or structured)
- [ ] Post-321: prompt with "Create BAR" / "Import metadata" / "Skip"
- [ ] Wire "Import metadata" to create-bar flow with pre-filled metadata321
