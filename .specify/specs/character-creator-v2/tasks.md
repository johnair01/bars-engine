# Tasks: Character Creator v2

## Spec kit
- [x] `spec.md`
- [x] `plan.md`
- [x] `tasks.md`
- [ ] Register in `.specify/backlog/BACKLOG.md` (row CCR2, priority 1.69)
- [ ] Run `npm run backlog:seed`

## CCR2-1: Schema Verification (no migration needed)

- [ ] Confirm `PlayerPlaybook.shareToken` exists in current schema (`prisma/schema.prisma`)
- [ ] Confirm `PlayerPlaybook.playerAnswers` + `playbookMoves` + `playbookBonds` exist
- [ ] Confirm `Adventure.playbookTemplate` can store discovery question weight structure
- [ ] If any field missing: add to schema + run `npx prisma migrate dev --name add_character_creator_v2_fields`
- [ ] Run `npm run db:sync` + `npm run check`

## CCR2-2: Resonance Scoring + Discovery Layer

- [ ] Create `src/lib/character-creator/resonance-scoring.ts`:
  - [ ] `computeResonanceScores(answers: DiscoveryAnswer[], templates: CharacterCreatorTemplate[]): ArchetypeScore[]`
  - [ ] Weighted sum per named archetype (not trigrams); returns sorted descending
- [ ] Create `src/lib/character-creator/discovery-questions.ts`:
  - [ ] `getDiscoveryQuestions(templates): DiscoveryQuestion[]` — merged from active `CHARACTER_CREATOR` Adventures
- [ ] Add to `src/actions/playbook-cyoa.ts`:
  - [ ] `getArchetypeResonanceScores(input: { answers: DiscoveryAnswer[] })` → `{ scores: ArchetypeScore[] }`
  - [ ] `getCharacterCreatorDiscoveryQuestions()` → `{ questions: DiscoveryQuestion[] }`
- [ ] Test: `computeResonanceScores` with known weights returns correct sorted scores

## CCR2-3: Archetype Selection Page (Discovery + Grid)

- [ ] Create `src/app/character-creator/DiscoveryQuestionnaire.tsx` — shared discovery questions before grid
- [ ] Edit `src/app/character-creator/page.tsx`:
  - [ ] Render `DiscoveryQuestionnaire` before archetype grid
  - [ ] After questionnaire: fetch resonance scores; display as visual indicator on archetype cards
  - [ ] Filter archetypes to player-facing only (named archetypes — no I Ching trigrams)
- [ ] Verify: 8 named archetypes shown; resonance scores displayed; no trigrams visible

## CCR2-4: Full Wizard

- [ ] Create `src/app/character-creator/[archetypeId]/CharacterCreatorWizardV2.tsx`:
  - [ ] Step 1: Discovery answers confirm (carried from landing page)
  - [ ] Step 2: Archetype-specific questions (from `template.archetypeQuestions`)
  - [ ] Step 3: Move picks — 2-of-4 archetype moves
  - [ ] Step 4: Nation move picks — 2-of-4 from `NationMove` (prompt nation selection if `player.nationId` null)
  - [ ] Step 5: Confirmation + save
  - [ ] Back navigation works at each step; wizard state held in React state
- [ ] Edit `src/app/character-creator/[archetypeId]/page.tsx` — render `CharacterCreatorWizardV2`

## CCR2-5: Save + Shareable Card

- [ ] Update `saveCharacterPlaybook` in `src/actions/playbook-cyoa.ts`:
  - [ ] Accept `chosenMoveIds: string[]` + `chosenNationMoveIds: string[]`
  - [ ] Store in `PlayerPlaybook.playbookMoves` JSON
  - [ ] Set `player.archetypeId` on save
- [ ] Edit `src/app/character/[shareToken]/page.tsx` — show chosen moves + discovery answers (no PII)

## CCR2-6: Admin Template Editor v2

- [ ] Create `src/app/admin/adventures/[id]/CharacterCreatorTemplateEditorV2.tsx`:
  - [ ] Discovery question weight configuration (per answer → per archetype weight)
  - [ ] Archetype-specific questions editor
  - [ ] 4 move texts per archetype (Wake Up / Clean Up / Grow Up / Show Up)
- [ ] Edit `src/app/admin/adventures/[id]/page.tsx` — replace v1 editor with v2 for `CHARACTER_CREATOR` type

## CCR2-7: Certification Quest

- [ ] Seed `cert-character-creator-v2-v1` Twine + `CustomBar`
- [ ] Add `npm run seed:cert:character-creator-v2` to `package.json`

## Verification

- [ ] `npm run build` passes
- [ ] `npm run check` passes (0 TypeScript errors)
- [ ] Navigate to `/character-creator` — 8 named archetypes shown, no trigrams
- [ ] Answer discovery questions — resonance scores appear on archetypes
- [ ] Select Bold Heart — archetype-specific questions load
- [ ] Pick 2-of-4 archetype moves + 2-of-4 nation moves — save succeeds
- [ ] Navigate to `/character/[shareToken]` without auth — public card renders with moves
- [ ] GM configures discovery question weights in `/admin/adventures/[id]` — wizard reflects changes
