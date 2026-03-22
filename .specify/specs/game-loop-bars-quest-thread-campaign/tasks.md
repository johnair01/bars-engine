# Tasks: Game Loop BARS↔Quest↔Thread↔Campaign

## Phase 1: Extend Hand + Placement API + Charge Flow Integration

### Extend Hand (`/hand`)

- [x] **T0.1** Hand shows charge captures via `VaultChargeList` + `ChargeBarCard` ("Explore →" and "Turn into Quest →" links). Source: `src/components/hand/ChargeBarCard.tsx`.
- [x] **T0.2** Personal quests section via `VaultPersonalQuestsBlock` + `HandQuestActions` with `PlacementDropdown`. Source: `src/components/hand/VaultPersonalQuestsBlock.tsx`.
- [x] **T0.3** "Explore" links to `/capture/explore/[barId]` which renders `ChargeExploreFlow` (full placement phase).

### API

- [x] **T1.1** `addQuestToThread` in `src/actions/quest-placement.ts` — complete with ownership check and ThreadQuest creation.
- [x] **T1.2** `addQuestAsSubquestToGameboard` in `src/actions/quest-placement.ts` — sets `parentId` + `campaignRef`.
- [x] **T1.3** `getPlacementOptionsForQuest` — returns threads (orientation + player-progress) + gameboard slots from active instance.
- [x] **T1.4** `PlacementOptions` type exported from `src/actions/quest-placement.ts`.

### Charge Flow Integration

- [ ] **T2.1** `createQuestFromSuggestion(barId, index, target?)` optional target — deferred; `ChargeExploreFlow` handles post-creation placement via phase state machine, making this low-value.
- [x] **T2.2** `ChargeExploreFlow` (`src/components/charge-capture/ChargeExploreFlow.tsx`) implements full phase machine: loading → ceremony → suggestions → what-now → placing → done.
- [x] **T2.3** `ChargeCaptureForm` inline create routes to `/hand?quest=…` (fixed from `/wallet?quest=…`). Vault's `PlacementDropdown` handles placement from there.
- [x] **T2.4** Redirect to `/hand?quest=<id>` after inline creation; quest is highlighted in Vault with placement actions.

### Hub / Wallet / Quest Detail

- [x] **T3.1** `HandQuestActions` shows "Unpack" + `PlacementDropdown` for all personal quests in Vault.
- [x] **T3.2** `PlacementDropdown` wires `addQuestToThread` and `addQuestAsSubquestToGameboard`.
- [x] **T3.3** Both actions call `revalidatePath('/hand')` and `revalidatePath('/')`.

### Verification Quest

- [ ] **T4.1** Verification quest `cert-game-loop-placement-v1` — deferred to GLCC follow-on spec.
- [ ] **T4.2** TwineStory + seed — deferred.
- [ ] **T4.3** Seed script — deferred.

### Verification

- [x] **T5.1** `npm run check` passes (0 errors).
- [ ] **T5.2** Manual: Create BAR → Explore → Create quest → Add as subquest to gameboard → Quest appears under slot.
- [ ] **T5.3** Manual: Capture → Explore → Create quest → Add to thread → Quest appears in thread.
- [ ] **T5.4** Manual: Hand shows charge captures, personal quests, and placement options when orphaned.
