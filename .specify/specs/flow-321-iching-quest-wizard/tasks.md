# Tasks: 321 ↔ Quest Wizard, Canonical 321, I Ching Branches

## Discovery

- [x] **T0** Code inventory documented in [spec.md](./spec.md)

## Dashboard & canonical 321

- [x] **T1** Add dashboard action: **321 Shadow Process** → `/shadow/321` (`DashboardActionButtons.tsx`)
- [ ] **T2** Decide EFA strategy: embed canonical runner vs link-out ([321-efa-integration](../321-efa-integration/spec.md))

## 321 → Quest Wizard

- [x] **T3** Persist 321 draft for wizard — **sessionStorage** key `bars_quest_wizard_prefill_321` (`quest-wizard-prefill.ts`)
- [x] **T4** `Shadow321Runner` “Turn into Quest” → stash + `/quest/create?from=321`
- [x] **T5** `QuestWizard` + `createQuestFromWizard`: prefill + `source321` snapshots → `persist321Session` + `source321SessionId`
- [x] **T6** `NAV['321_quest_wizard']` in `navigation-contract.ts` (hand success; cancel → `/shadow/321`)

## I Ching → reading → branch

- [ ] **T7** UI: after cast, **Accept reading** step
- [ ] **T8** Branch A: **321 on reading** — `initialCharge` / linked BAR from reading text
- [ ] **T9** Branch B: **Quest wizard (I Ching)** — `/quest/create?from=iching&readingId=` + load `IChingContext`
- [ ] **T10** Confirm `generateGrammaticQuestFromReading` / wizard path both yield **grammatic** quests ([iching-grammatic-quests](../iching-grammatic-quests/spec.md))
- [ ] **T11** BAR as inspiration: document flow “expand to quest” from BAR detail → wizard

## Verification

- [ ] **T12** Manual: 321 → wizard → publish → complete quest in engine
- [ ] **T13** Manual: I Ching → accept → both branches
- [ ] **T14** `npm run build` + `npm run check`
