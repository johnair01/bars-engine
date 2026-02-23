# Tasks: Economy Translation
## Phase 0: Map
- [x] Map all existing Vibeulon update calls in the codebase.
  - Files: `src/actions/*.ts`
  - Command: `rg "vibeulon" src/actions`
  - Result: Identified 10 key integration points across 8 files (minting, spending, transfer, reward).

## Phase 1: Schema & Migration
- [x] Define `VibeulonLedger` and `InstanceParticipation` in `schema.prisma`.
- [x] Run `npm run db:sync`.

## Phase 2: Services
- [x] Implement `LedgerService.attune(playerId, instanceId, amount)`.
- [x] Implement `LedgerService.transmute(playerId, sourceId, targetId, amount, ratifierId)`.
- [x] Verify ledger events are correctly created.

## Phase 3: UI Affordances
- [x] Update Wallet page to show Local instance tabs.
- [x] Add "Attune" button to Instance dashboard.

## Phase 4: Tests
- [x] Test 1: Successful attunement lifecycle.
- [x] Test 2: Double-spend prevention on local balance.
- [x] Test 3: Unauthorized transmutation rejection.
