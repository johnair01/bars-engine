# Plan: Threshold Encounter

## Architecture

Threshold Encounter is a generation + playback + artifact system layered on top of the existing Emotional Alchemy infrastructure (`AlchemyCheckIn`, `SceneDsl`, `wuxing.ts`). The generator calls the AI SDK to produce `.twee` source with an embedded `StoryData` JSON block. The `.twee` is stored on a `ThresholdEncounter` record and played in the existing Adventure player. A post-adventure `PostAdventureOverlay` React component handles artifact emission without touching the Twine substrate.

## File Impact

### New Files

| File | Purpose |
|------|---------|
| `prisma/migrations/[ts]_add_threshold_encounter/` | Migration: `ThresholdEncounter` + `AlchemyCheckIn.thresholdEncounterId` FK |
| `src/lib/threshold-encounter/generator.ts` | `generateThresholdEncounter(input): { tweeSource, storydata }` — pure fn |
| `src/lib/threshold-encounter/prompts.ts` | System prompt: phase structure, wuxing routing, StoryData schema, GM face modulation |
| `src/lib/threshold-encounter/parse-storydata.ts` | `parseStorydata(tweeSource): ThresholdStoryData` |
| `src/lib/threshold-encounter/extract-artifacts.ts` | `extractArtifacts(storydata): DeclaredArtifact[]` |
| `src/app/api/threshold-encounter/generate/route.ts` | `POST /api/threshold-encounter/generate` Route Handler |
| `src/app/api/threshold-encounter/[id]/export/route.ts` | `GET /api/threshold-encounter/[id]/export` — `.twee` download |
| `src/actions/threshold-encounter.ts` | `saveBarCandidate`, `completeEncounter`, `promoteBarCandidate` Server Actions |
| `src/components/encounter/PostAdventureOverlay.tsx` | Post-adventure overlay: BAR candidate write-in |
| `src/app/admin/bar-candidates/page.tsx` | Admin queue: pending `bar_candidate` artifacts |
| `src/app/admin/encounters/[id]/page.tsx` | GM edit view (reuses `IRAuthoringClient` pattern) |

### Modified Files

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `ThresholdEncounter` model; extend `AlchemyCheckIn` |
| `src/components/dashboard/DailyCheckInQuest.tsx` | Step 4: launch `ThresholdEncounter` instead of legacy growth scene |
| `src/actions/alchemy.ts` | `linkCheckInScene` extended to link `thresholdEncounterId` |

## Key Patterns

- **`.twee` is the canonical artifact**: generator produces `.twee`; parser reads it; overlay emits artifacts. Nothing bypasses the `.twee` representation.
- **StoryData is self-describing**: AI must produce a valid JSON `StoryData` passage as part of the `.twee`. Parser validates structure before returning.
- **PostAdventureOverlay stays in Next.js**: artifact emission uses server actions, not Twine macros. Clean separation.
- **Beat mode**: `minimal` = maps 1:1 to `SceneDsl`; `canonical` = 9-passage full shape. Same format, different beat counts — confirmed by the same `parseStorydata` function.

## Dependencies

- `src/lib/alchemy/wuxing.ts` — `resolveMoveDestination` for routing
- `src/lib/growth-scene/types.ts` — `SceneDsl`, `ArtifactType` (backward compat)
- `src/actions/alchemy.ts` — `createDailyCheckIn`, `linkCheckInScene`
- Existing AI SDK patterns in `src/lib/` for generation
- `IRAuthoringClient` pattern — reuse for GM edit view

## Risk / Trade-offs

- AI generation quality is variable. Seed prompts carefully; GM always has edit access. Never block the player path on AI quality.
- `tweeSource` stored in `@db.Text` — fine for 9-passage max; don't add binary content.
- `SceneDsl` backward compat: existing `AlchemySceneTemplate` + `selectScene` are untouched. Only `DailyCheckInQuest` step 4 switches to `ThresholdEncounter`.
