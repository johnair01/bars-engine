# Tasks: Game Loop BARS↔Quest↔Thread↔Campaign

## Phase 1: Extend Hand + Placement API + Charge Flow Integration

### Extend Hand (`/hand`)

- [ ] **T0.1** Extend `src/app/hand/page.tsx`: Add charge captures (type=charge_capture) to BARs section. Fetch via `getRecentChargeBars` or equivalent. Show "Explore" (Turn into quest) for each charge capture.
- [ ] **T0.2** Add personal quests section: CustomBar where `creatorId = player`, `type = 'quest'`, `parentId = null`, `sourceBarId != null`. Show "Add to thread" / "Add as subquest to gameboard" for each.
- [ ] **T0.3** Wire "Explore" on charge capture → `/capture/explore/[barId]` or inline Explore flow. Wire placement actions to `addQuestToThread` and `addQuestAsSubquestToGameboard`.

### API

- [ ] **T1.1** Create `src/actions/quest-placement.ts` with `addQuestToThread(questId, threadId, position?)` — Server Action. Appends quest to thread via ThreadQuest. Player must own quest; thread must be joinable.
- [ ] **T1.2** Add `addQuestAsSubquestToGameboard(questId, slotQuestId)` — Server Action. Sets `parentId = slotQuestId` on quest; sets `campaignRef` from slot's campaign. Player must own quest; slot must be on active gameboard.
- [ ] **T1.3** Add `getPlacementOptionsForQuest(questId)` — Server Action. Returns threads player has access to and gameboard slots (campaignRef, slotQuestId, slotTitle) the player can add the quest to.
- [ ] **T1.4** Define `QuestPlacementTarget` type: `{ type: 'thread' | 'gameboard'; threadId?: string; slotQuestId?: string }`.

### Charge Flow Integration

- [ ] **T2.1** Extend `createQuestFromSuggestion(barId, suggestionIndex, target?)` — when `target` provided, after creating quest, call `addQuestToThread` or `addQuestAsSubquestToGameboard`.
- [ ] **T2.2** ChargeExploreFlow: after successful quest create, show placement options (Add to thread, Add as subquest to gameboard, Done). Fetch placement options via `getPlacementOptionsForQuest(questId)`.
- [ ] **T2.3** ChargeCaptureForm: same placement options after create (when `suggestions` and `handleCreateQuest` succeed).
- [ ] **T2.4** Redirect to Personal Quest Hub (or wallet) with `?quest=<id>` after create; show placement modal if quest is orphaned.

### Hub / Wallet / Quest Detail

- [ ] **T3.1** For quests with `sourceBarId` and no `parentId` and not in a thread: show "Add to thread" / "Add as subquest to gameboard" in quest detail (QuestDetailModal, hub, or wallet view).
- [ ] **T3.2** Wire placement actions to `addQuestToThread` and `addQuestAsSubquestToGameboard`.
- [ ] **T3.3** Revalidate paths after placement.

### Verification Quest

- [ ] **T4.1** Create verification quest `cert-game-loop-placement-v1`: steps (1) Create BAR, (2) Explore, (3) Create quest, (4) Add as subquest to gameboard, (5) Verify quest under slot. Narrative: Bruised Banana Fundraiser.
- [ ] **T4.2** TwineStory + CustomBar with `isSystem: true`, `visibility: 'public'`, idempotent seed.
- [ ] **T4.3** Add `seed:cert:game-loop-placement` script.

### Verification

- [ ] **T5.1** `npm run build` and `npm run check` pass.
- [ ] **T5.2** Manual: Create BAR → Explore → Create quest → Add as subquest to gameboard → Quest appears under slot.
- [ ] **T5.3** Manual: Capture → Explore → Create quest → Add to thread → Quest appears in thread.
- [ ] **T5.4** Manual: Hand shows charge captures, personal quests, and placement options when orphaned.
