# Plan: 321 ↔ Quest Wizard, Canonical 321, I Ching Branches

## Phase 1 — Routing & dashboard

- Add **321** to `DashboardActionButtons` → `/shadow/321`.
- Implement **321 → wizard** redirect: store `Metadata321` / session server-side or signed short-lived token; navigate to `/quest/create?from=321&token=`.
- Update `Shadow321Runner` “Turn into Quest” to **open wizard** instead of (or before) `createQuestFrom321Metadata` only.

## Phase 2 — Quest Wizard prefill

- Extend `QuestWizard` + `createQuestFromWizard` inputs for `source: '321' | 'iching'` and draft payload.
- Banner + validation per [quest-metabolism-wizard-gm](../quest-metabolism-wizard-gm/spec.md).

## Phase 3 — EFA canonical alignment

- Execute [321-efa-integration](../321-efa-integration/spec.md) **or** implement **C2** link-out to `/shadow/321`.

## Phase 4 — I Ching branching UI

- Insert **Accept reading** + **branch** after cast in `DashboardCaster` (or shared `IChingPostReadingFlow`).
- Wire **321 with reading as charge**; wire **wizard** with `from=iching` + reading id.
- Keep `generateGrammaticQuestFromReading` for path (b); ensure grammatical output per [iching-grammatic-quests](../iching-grammatic-quests/spec.md).

## Phase 5 — NAV + cleanup

- Add `321_quest_wizard` / `iching_quest_wizard` to `navigation-contract.ts`.
- Deprecate default `321_quest` → hand if wizard is primary.

## File impacts (expected)

- `src/app/shadow/321/Shadow321Runner.tsx`
- `src/components/dashboard/DashboardActionButtons.tsx`
- `src/components/DashboardCaster.tsx`
- `src/components/quest-creation/QuestWizard.tsx`
- `src/app/quest/create/page.tsx`
- `src/actions/create-bar.ts`, `charge-metabolism.ts`
- `src/lib/navigation-contract.ts`
- `src/components/emotional-first-aid/*` (if EFA embed)
