# Tasks: Appreciation Mechanic

## Phase 1: Core Transfer + Optional BAR

- [x] Extract or reuse `transferVibeulonsBetweenPlayers(senderId, recipientId, amount, metadata)` from economy.ts
- [x] Create `sendAppreciationAction` in `src/actions/appreciation.ts`
- [x] Validate: amount 1–10, exactly one target, not self, sufficient balance
- [x] Resolve recipient: targetPlayerId direct; targetQuestId → quest.creatorId
- [x] Transfer vibeulons; create VibulonEvent source `appreciation`
- [x] When createAppreciationBar: create CustomBar type `appreciation`, inputs JSON
- [x] Add "Appreciate" button to QuestDetailModal (when viewing quest)
- [ ] Add "Appreciate" to wallet transfer flow or player profile (optional)
- [x] Revalidate paths: /, /wallet, /bars/available

## Phase 2: Feed (optional)

- [x] `getAppreciationFeed` or extend getBarFeed for type=appreciation
- [x] Include appreciation in Movement Feed (getMovementFeed already includes source=appreciation)
- [x] Dashboard "Appreciations received" section

## Verification

- Create quest → another player appreciates with 2 vibeulons → creator receives; appreciation BAR visible
- Appreciate player directly from wallet → transfer succeeds; VibulonEvent source appreciation
