# PCM Audit: 321 → Quest/BAR/Fuel/Daemon Data Flow

**Date:** 2026-03-22

## Charge capture pipeline

| File | Role | Gap |
|------|------|-----|
| `src/actions/charge-capture.ts` · `CreateChargeBarPayload` | Capture payload | No `personal_move`; only `emotion_channel`, `intensity`, `satisfaction`, `context_note` |
| `src/actions/charge-capture.ts` · `createChargeBar` | Creates `CustomBar(type=charge_capture)` | `inputs` JSON does not include move; `CustomBar.moveType` not set |
| `src/lib/charge-quest-generator/generator.ts` · `generateQuestSuggestions` | Generates 3–4 quest suggestions | Move order from `EMOTION_MOVE_BIAS[emotion]`; no `declared_move` input |
| `src/actions/charge-capture.ts` · `generateQuestSuggestionsFromCharge` | Parses charge inputs → calls generator | Does not read `personal_move`; does not pass declared move |
| `src/actions/charge-capture.ts` · `run321FromCharge` | Returns `/shadow/321?chargeBarId=xxx` URL | Does not extract `personal_move` from inputs for the URL |
| `src/app/shadow/321/page.tsx` | Loads charge title → Shadow321Runner | Only passes `initialCharge` (string); no move |
| `src/app/shadow/321/Shadow321Runner.tsx` · `stashQuestWizardPrefillFrom321` | Stashes prefill for quest wizard | `displayHints.alignedAction` exists but comes from 321 answers, not from committed charge move |
| `src/actions/charge-metabolism.ts` · `fuelSystemFrom321` | Creates `Shadow321Session(outcome=fueled_system)` | `phase2Snapshot` JSON includes `moveType` field (comment), but populated from 321 answers only |

## Key finding

`CustomBar.moveType` is camelCase (`wakeUp` | `cleanUp` | `growUp` | `showUp`).
`QuestSuggestion.move_type` is snake_case (`wake_up` etc.) — the generator types diverge from the DB field convention. Both are used in the codebase; no data migration needed, just mapping at input/output.

## 321 → quest/BAR path (confirmed working)

1. Player captures charge → `createChargeBar` → BAR saved
2. Player chooses "Reflect (321)" → `run321FromCharge(barId)` → redirect to `/shadow/321?chargeBarId=xxx`
3. Page loads charge title → `Shadow321Runner({ initialCharge })`
4. Runner completes 321 → calls `stashQuestWizardPrefillFrom321` → redirects to quest wizard
5. Quest wizard consumes prefill (metadata, phase2, phase3, displayHints)

## Committed move wiring (PCM additions)

After PCM:
- `personal_move` stored in `inputs` JSON + set as `moveType` on charge `CustomBar`
- `generateQuestSuggestions` receives `declared_move`; chosen move sorted first
- `run321FromCharge` reads `personal_move` from charge inputs → includes `&personalMove=xxx` in URL
- Shadow321 page reads `personalMove` param → passes to `Shadow321Runner` as `initialPersonalMove`
- `stashQuestWizardPrefillFrom321` prefills `displayHints.alignedAction` from committed move
- Vibeulon/daemon path: `phase2Snapshot.moveType` is already part of the 321 session;
  `personal_move` from charge gives the intent layer (pre-321 commitment)
