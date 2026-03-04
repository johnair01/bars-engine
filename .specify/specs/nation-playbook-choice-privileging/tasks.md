# Tasks: Nation and Playbook Choice Privileging

## Phase 1: Knowledge Base (Admin Manual Quest Creation)

- [x] Create `/wiki/emotional-alchemy` page — 5 elements, 15 moves, Nation↔element, Playbook↔WAVE, choice privileging rules for admins creating quests without AI

- [x] Update `content/lore-index.md` — add Emotional Alchemy section (elements, 15 moves, nations↔elements)

- [x] Update `src/app/wiki/page.tsx` — add link to Emotional Alchemy in Game Concepts or Reference

## Phase 2: Schema + Data

- [x] Add `element String` (required) to Nation model in `prisma/schema.prisma`

- [x] Run `npm run db:sync` (per .cursorrules)

- [x] Update nation seed (scripts/seed-narrative-content.ts or seed-utils) — Argyra→metal, Pyrakanth→fire, Virelune→wood, Meridia→earth, Lamenth→water

## Phase 3: Move Engine + Mappings

- [x] Add `primaryWaveStage?: PersonalMoveType` to CanonicalMove in `move-engine.ts` per emotional-alchemy-interfaces table

- [x] Create `src/lib/quest-grammar/playbook-wave.ts` — `getPlaybookPrimaryWave(playbookId): PersonalMoveType` (placeholder returns 'showUp')

- [x] Create `src/lib/quest-grammar/move-assignment.ts` — `getMovesForElement`, `getMovesForWaveStage`, `selectPrivilegedChoices`

## Phase 4: Choice Types + Generation

- [x] Extend `Choice` in `types.ts` — add `moveId?: string`

- [x] Extend `QuestCompileInput` — add `targetNationId?: string`, `targetPlaybookId?: string`

- [x] Update `generateChoices` in `compileQuest.ts` — use nation/playbook when provided; call `selectPrivilegedChoices`; assign moveId

## Phase 5: Prompt Context (AI Path)

- [x] Create `src/lib/quest-grammar/choice-privileging-context.ts` — `CHOICE_PRIVILEGING_CONTEXT(nationElement, playbookWave): string` (~100 tokens)

- [x] Extend `buildQuestPromptContext` — inject choice privileging when targetNationId/targetPlaybookId present

- [x] Update `generateQuestOverviewWithAI` — include nation/playbook in inputKey for cache; extend schema with optional moveId per choice

## Phase 6: Integration

- [x] Wire targetNationId/targetPlaybookId into GenerationFlow (from targetArchetypeIds or new selects)

- [x] Emit moveMap alongside Twee for future runtime filtering

## Verification

- [x] Nation.element populated for all 5 nations

- [x] getPlaybookPrimaryWave returns 'showUp' for unknown playbook

- [x] selectPrivilegedChoices returns 2–3 moves with nation + playbook privileging

- [x] /wiki/emotional-alchemy renders; admins can reference for manual quest creation
