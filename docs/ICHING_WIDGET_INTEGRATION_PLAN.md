# I Ching Quest Widget Integration Plan

Date: 2026-02-10
Repo: bars-engine
Branch: cursor/iching-quest-widget-integration-0dfb

## Goal

Integrate the "I Ching quest widget" behavior into bars-engine in a way that is:

1. Functionally consistent across dashboard, onboarding, and dedicated I Ching entry points.
2. Backed by one canonical quest lifecycle in the data model.
3. Testable and safe to iterate without breaking existing player progress.

## Current bars-engine behavior (as-is)

## 1) UI entry points

- `src/components/DashboardCaster.tsx`
  - Opens a modal with `CastingRitual`.
  - On accept, calls `generateQuestFromReading(hexagramId)`.
  - Shows generated quest summary and refreshes dashboard.

- `src/components/CastingRitual.tsx`
  - Multi-phase client flow: `ready -> casting -> revealed -> accepted`.
  - Reusable via `onComplete` callback.
  - Without callback, default path calls `acceptReading(hexagramId)`.

- `src/components/QuestDetailModal.tsx`
  - For `orientation-quest-3`, embeds `CastingRitual` and calls `generateQuestFromReading`.
  - Uses hardcoded quest ID checks to route behavior.

- `src/app/iching/page.tsx`
  - Uses `CastingRitual` without callback, so it follows `acceptReading`.

## 2) Server-side flows

- `src/actions/cast-iching.ts`
  - `castIChing()` returns random hexagram from `Bar` table.
  - `acceptReading(hexagramId)` creates `PlayerBar(source='iching')`.
  - Also writes `starterPack.data.activeBars` using synthetic IDs (`iching_{id}`).
  - Fires `fireTrigger('ICHING_CAST')`.

- `src/actions/generate-quest.ts`
  - `generateQuestFromReading(hexagramId)` wraps `generateQuestCore`.
  - `generateQuestCore` calls OpenAI and creates `CustomBar(type='inspiration', visibility='private')`.
  - Auto-assigns quest via `PlayerQuest(status='assigned')`.
  - If orientation thread progress exists, marks `orientation-quest-3` complete via `completeQuest`.

## 3) Dashboard/state rendering

- `src/app/page.tsx`
  - Active/completed state comes from `PlayerQuest`.
  - Also fetches `PlayerBar(source='iching')` as `ichingReadings`.
  - Passes both to `StarterQuestBoard`.

- `src/components/StarterQuestBoard.tsx`
  - Converts `PlayerBar` readings to synthetic bars with IDs `iching_{bar.id}`.
  - Active list is based on `activeBars` prop (from `PlayerQuest` IDs).
  - Result: I Ching `PlayerBar` entries are not reliably represented as active quests in current model.

## 4) Adjacent systems that matter

- Orientation journey uses `QuestThread` + `ThreadProgress`.
- Global story clock also generates hexagram-based quests (`src/actions/world.ts`), separate from personal I Ching casting.
- Feature flags exist in `AppConfig.features`, but are not currently enforced in I Ching entry points.

## Integration gaps to resolve

## A. Dual quest models (highest impact)

Current I Ching behavior splits across:
- `PlayerBar` (reading history/event)
- `CustomBar + PlayerQuest` (actual actionable quest)
- stale `StarterPack.data.activeBars` path

This makes UI and progression inconsistent.

## B. Orphaned `/iching` behavior

`/iching` currently uses `acceptReading`, which does not align with the dashboard's `PlayerQuest`-driven active quest model.

## C. Trigger contract mismatch

- `acceptReading` fires `ICHING_CAST`.
- `orientation-quest-3` is completed via hardcoded ID path in modal + `generateQuestFromReading`, not trigger metadata.
- This is fragile and hard to reuse.

## D. Widget integration boundary is not explicit

`CastingRitual` is reusable, but business behavior is spread across callers and hardcoded quest IDs.

## E. Feature and safety gaps

- `features.iching` is not enforced.
- `docs/VERCEL_ENV_SETUP.md` currently contains an explicit API key value and should be sanitized.

## Target architecture

Use one canonical quest lifecycle for I Ching-generated work:

1. Cast hexagram.
2. Generate quest payload from cast.
3. Persist generated quest as `CustomBar` + `PlayerQuest`.
4. Optionally record cast history (`PlayerBar`) as telemetry/history only (not active state source).
5. Render active/completed state from `PlayerQuest` only.

Widget responsibility:
- UI ritual and cast reveal.
- Emits normalized result (`hexagram`, `questDraft`, optional metadata).
- Host decides where to route (dashboard, onboarding, dedicated page).

## Phased implementation plan

## Phase 0 - Guardrails and baseline

1. Add a short architecture note in code comments and this doc as source of truth.
2. Add/extend scripts for:
   - cast -> generate -> assignment success
   - orientation quest 3 completion path
   - `/iching` parity with dashboard flow
3. Sanitize environment docs (remove hardcoded key material).

Acceptance:
- Team can verify baseline flow via script + manual checklist.

## Phase 1 - Unify backend flow

1. Introduce a single action (name TBD, e.g. `castAndGenerateQuest`) that:
   - casts hexagram
   - generates quest
   - assigns quest
   - returns both reading + created quest summary
2. Keep `PlayerBar` write optional and explicitly "history only".
3. Stop writing `starterPack.data.activeBars` for I Ching path.

Acceptance:
- One action can power all widget entry points.
- Newly cast I Ching quests always appear in active quest UI via `PlayerQuest`.

## Phase 2 - Widget and UI convergence

1. Replace dedicated `/iching` default accept path with unified generation path.
2. Keep `CastingRitual` presentational and callback-driven.
3. Remove hardcoded orientation branch where possible:
   - prefer trigger or explicit context contract.
4. Respect `features.iching` in all entry points.

Acceptance:
- Dashboard modal, orientation modal, and `/iching` produce identical persistence behavior.

## Phase 3 - Cleanup and migration

1. Remove stale starter pack active-bars coupling for I Ching.
2. Decide and implement backfill strategy:
   - Option A: leave historical `PlayerBar` as history only.
   - Option B: convert eligible historical readings into assigned inspiration quests.
3. Tighten typing in thread/pack modal payloads so trigger-capable quests do not depend on ID hardcoding.

Acceptance:
- No live code path depends on synthetic `iching_{id}` IDs for active quest state.

## Phase 4 - Observability and tuning

1. Add event logs around cast/generate failures.
2. Add rate limiting/cooldowns if required by product design.
3. Tune prompt and reward defaults based on completion analytics.

Acceptance:
- Failures are diagnosable and behavior is measurable.

## First implementation slice (recommended next PR)

Small, high-leverage, low-risk:

1. Add unified server action for cast+generate+assign.
2. Update `/iching` page flow to use same path as dashboard/orientation.
3. Mark `acceptReading` as legacy or history-only path.
4. Remove `starterPack.data.activeBars` writes from I Ching path.
5. Add one script test for the unified path and one for orientation quest 3 completion.

## Open questions before full merge

Because the external "iching-quest widget" source is not in this repo, confirm:

1. Should generated quests remain private inspiration by default, or be public commissions?
2. Is cast history (`PlayerBar`) a product requirement or only implementation detail?
3. Should orientation completion rely on trigger metadata, explicit context, or both?
4. Are there widget-specific UX rules (cooldown, multi-cast, moving lines, seed/randomness control) that must be preserved exactly?

## Notes

- This plan intentionally avoids changing existing player records until the canonical flow is validated.
- Migration choices should prioritize preserving player progression and avoiding silent quest duplication.
