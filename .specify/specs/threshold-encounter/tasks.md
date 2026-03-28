# Tasks: Threshold Encounter

## Spec kit
- [x] `spec.md`
- [x] `plan.md`
- [x] `tasks.md`
- [ ] Register in `.specify/backlog/BACKLOG.md` (row TE, priority 1.64)
- [ ] Run `npm run backlog:seed`

## TE-1: Schema + Migration

- [ ] Add `ThresholdEncounter` model to `prisma/schema.prisma`
- [ ] Add `thresholdEncounterId String?` FK to `AlchemyCheckIn`
- [ ] Run `npx prisma migrate dev --name add_threshold_encounter`
- [ ] Commit migration + schema
- [ ] Run `npm run db:sync` + `npm run check`

## TE-2: Generator API

- [ ] Create `src/lib/threshold-encounter/prompts.ts` — system prompt (phases, wuxing, StoryData schema, GM face)
- [ ] Create `src/lib/threshold-encounter/generator.ts` — `generateThresholdEncounter(input)` calling AI SDK
- [ ] Create `src/app/api/threshold-encounter/generate/route.ts` — `POST` Route Handler
- [ ] Test: POST with test input → returns `tweeSource` with valid StoryData passage

## TE-3: StoryData Parser + Artifact Extractor

- [ ] Create `src/lib/threshold-encounter/parse-storydata.ts` — `parseStorydata(tweeSource): ThresholdStoryData`
- [ ] Create `src/lib/threshold-encounter/extract-artifacts.ts` — `extractArtifacts(storydata): DeclaredArtifact[]`
- [ ] Test: `parseStorydata` on generated `.twee` returns correct `emotionalVector + wuxingRouting`

## TE-4: Post-Adventure Overlay + Server Actions

- [ ] Create `src/actions/threshold-encounter.ts`:
  - [ ] `saveBarCandidate(input)`
  - [ ] `completeEncounter(input)` — links `AlchemyCheckIn.thresholdEncounterId`
  - [ ] `promoteBarCandidate(input)` (admin)
- [ ] Create `src/components/encounter/PostAdventureOverlay.tsx` — optional write-in field; calls `saveBarCandidate`
- [ ] Wire overlay to fire after final passage completion in Adventure player

## TE-5: DailyCheckIn Wiring

- [ ] Edit `src/components/dashboard/DailyCheckInQuest.tsx` step 4:
  - [ ] Call `POST /api/threshold-encounter/generate` with check-in context
  - [ ] Navigate to Adventure player with generated encounter
- [ ] Verify existing growth scene runner (non-check-in path) is unchanged
- [ ] Test: complete DailyCheckIn → `ThresholdEncounter` created → `.twee` plays in browser

## TE-6: Admin BAR Candidate Review

- [ ] Create `src/app/admin/bar-candidates/page.tsx` — list `bar_candidate` artifacts with pending status
- [ ] `promoteBarCandidate` creates `CustomBar` or `QuestProposal`; marks artifact `promoted`
- [ ] Test: admin promotes candidate → `CustomBar` created in DB

## TE-7: Export + GM Editing

- [ ] Create `src/app/api/threshold-encounter/[id]/export/route.ts` — `.twee` download with `Content-Disposition`
- [ ] Create `src/app/admin/encounters/[id]/page.tsx` — GM edit view via `IRAuthoringClient`

## TE-8: Certification Quest

- [ ] Seed `cert-threshold-encounter-v1` Twine story + `CustomBar`
- [ ] Add `npm run seed:cert:threshold-encounter` to `package.json`

## Verification

- [ ] `npm run build` passes
- [ ] `npm run check` passes (0 TypeScript errors)
- [ ] Full flow: DailyCheckIn step 4 → encounter generates → plays in browser → overlay appears → BAR candidate saved
- [ ] Admin: promotes candidate → `CustomBar` created
- [ ] GM: exports `.twee` → valid file downloads
- [ ] `SceneDsl` / existing growth scene runner: no regression
