# Plan: CYOA Ritual Nursery Rooms

## Status Summary

| Phase | Status | Key Outcome |
|-------|--------|-------------|
| Phase 1: Spatial Infrastructure | **COMPLETE** | 5 rooms seeded, face NPCs, portal chain verified |
| Phase 1.5: Move Library | **COMPLETE** | 52 moves in JSON + DB (20 nation, 32 archetype), typed accessor |
| Phase 2: Ritual Experience | **COMPLETE** | NurseryRitualFlow + 3-2-1 dialogue + structured BAR reflection, server actions wired |
| Phase 2.5: Game Loop Closure | **NEXT** | BAR planting, hub receipt, vibeulons, nursery completion state |
| Phase 3: Polish | PENDING | Campaign welcome text, face voice templates, NarrativeTemplate extraction |

## Phase 2.5: Game Loop Closure (Move A + Move B)

### The Problem
Ritual creates a BAR but doesn't integrate into spoke progression. Player completes ritual → sees completion screen → walks back → nothing changed. No planting, no receipt, no memory.

### Move A: Close the Game Loop

#### A1. Enrich `completeNurseryRitual()` — hub receipt + vibeulons + spoke planting

After creating the CustomBar, the action also:
1. **Writes CompletedBuildReceipt** to `Instance.campaignHubState.completedBuilds[]`
   - Receipt includes: buildId, spokeIndex, face, moveId, barSummaries, totalVibeulons, completedAt
   - Uses existing `CampaignHubStateV1` type (completedBuilds field added in Phase 1)
2. **Upserts SpokeMoveBed** anchor with the BAR
   - Find or create SpokeMoveBed for (campaignRef, spokeIndex, moveType)
   - Set `anchorBarId` to the created BAR, `anchoredByPlayerId`, `anchoredAt`
   - If already anchored by another player → don't overwrite (first-mover wins)
3. **Awards vibeulons** from `vibeulon_rules`
   - Read `effectsSchema.vibeulon_rules.base_reward`
   - Create VibulonEvent (existing model) for the player

#### A2. Update NurseryRitualFlow completion phase

After ritual completes:
- Show the BAR that was created (title, reflection summary, bar_type badge)
- Show vibeulons awarded
- "Plant on Spoke {N}" button → calls `completeNurseryRitual()` which handles planting
- After planting: show "Planted ✓" confirmation + "Return to nursery" button

Actually, simplify: `completeNurseryRitual()` handles everything (create BAR + plant + receipt + vibeulons) in one call. The completion phase just shows the result.

#### A3. Build `getNurseryCompletionState()` server action

- Input: `{ instanceId, spokeIndex, nurseryType }`
- Checks SpokeMoveBed for (campaignRef, spokeIndex, moveType) where `anchoredByPlayerId = currentPlayer`
- Returns: `{ completed, barId?, barTitle?, completedAt? }`
- Called by NurseryActivityModal before showing "Begin Ritual"

#### A4. Update NurseryActivityModal with completion state

- On mount: call `getNurseryCompletionState()`
- If completed: show BAR summary card + "Completed ✓" badge + "View BAR" link
- If not completed: show "Begin Ritual" as today

### Move B: Set the Stage

#### B1. Add welcome text anchor to intro room

- New anchor type: `welcome_text` at center of intro room
- Pixi renderer shows it as a slightly larger, differently colored tile (gold/warm)
- Add to `ANCHOR_COLORS` and `PROXIMITY_PRIORITY`

#### B2. Render campaign welcome overlay

- When player enters intro room, fetch Instance.narrativeKernel
- If set: render as floating text overlay above the room (HTML positioned element)
- Show campaign name + kernel text
- Fades after 5s or on first movement (not blocking)

#### B3. Intro room NPC greetings reference campaign

- If narrativeKernel available, inject campaign context into face NPC greeting text
- "Welcome to [campaign name]. [Face greeting]."
- Lightweight — just prepend campaign name to existing FACE_GREETINGS

### Implementation Order

1. **A1**: Enrich `completeNurseryRitual()` (the critical fix — makes ritual count)
2. **A2**: Update completion phase UI (player sees the result)
3. **A3**: `getNurseryCompletionState()` (data layer for state check)
4. **A4**: Update NurseryActivityModal (nursery has memory)
5. **B1-B3**: Campaign welcome text (narrative polish)

### Risk Register

| Risk | Mitigation |
|------|-----------|
| SpokeMoveBed may not exist for this spoke yet | Upsert pattern — create if missing |
| VibulonEvent model may have required fields we miss | Check schema before writing |
| CampaignHubState JSON update is a read-modify-write race | Use Prisma transaction |
| narrativeKernel may be null on most instances | Generic fallback text |
