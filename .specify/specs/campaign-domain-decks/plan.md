# Plan: Campaign Domain Decks

## Summary

Implement Campaign Domain Decks: one deck per allyship domain per instance. Draw 8 cards onto the gameboard filtered by Kotter stage; translate quest presentation by stage; cards stay out until deck exhausted, then reset. Integrate with gameboard-campaign-deck and bruised-banana-quest-map.

## Phase 1: Deck Model and Draw Logic

### 1.1 Deck definition

- Deck = quests (CustomBar) with `allyshipDomain`, `kotterStage` (or null for stage-agnostic), instance-scoped
- Scope: instance.campaignRef or instanceId; quests in campaign thread or tagged for instance
- Ensure CustomBar has `allyshipDomain` and `kotterStage` fields (add if missing)

### 1.2 Cycle tracking

**Option A**: New model `CampaignDomainDeckCycle` — instanceId, domain, cycleId, playedQuestIds (JSON), resetAt

**Option B**: JSON field on Instance — `domainDeckCycles: { [domain]: { playedQuestIds, cycleId } }`

**Recommendation**: Option B for MVP; migrate to Option A if cycle history needed.

### 1.3 Draw implementation

- `getCampaignDomainDeck(instanceId, domain)` — returns eligible quest IDs for current cycle
- `drawFromDeck(instanceId, domain, count, excludeQuestIds)` — filters by kotterStage, excludes played and on-board, returns up to count
- `markQuestPlayed(instanceId, domain, questId)` — add to playedQuestIds
- `resetDeckCycle(instanceId, domain)` — clear playedQuestIds, increment cycleId

### 1.4 Translation

- `translateQuestForStage(quest, domain, kotterStage)` — uses `getStageAction(period, domain)` from `src/lib/kotter.ts`
- Apply stage action as prefix or context to title/description when rendering on gameboard

## Phase 2: Gameboard Integration

### 2.1 Replace generic campaign deck with domain deck

- Gameboard currently draws from campaign deck (gameboard-campaign-deck). Extend to use domain deck when instance has `allyshipDomain` or campaign has domain.
- For Bruised Banana: domain = GATHERING_RESOURCES
- Draw calls `drawFromDeck(instanceId, 'GATHERING_RESOURCES', 8, onBoardQuestIds)`

### 2.2 Exhaustion and reset

- Before draw: if no eligible quests (all played or none match), call `resetDeckCycle`
- After completion: `markQuestPlayed`; then `replaceSlotWithDraw` uses updated deck

### 2.3 Translation in UI

- When rendering gameboard card: call `translateQuestForStage` with instance.kotterStage and instance domain
- Display translated title/description

## Phase 3: Campaign Moves (Deferred / Stub)

- Add enum or type for campaign moves: Wake Up, Clean Up, Grow Up, Show Up
- No automation in MVP; admin or manual only
- Document in spec for future implementation

## Phase 4: Verification

- npm run build, npm run check
- Manual: Bruised Banana instance, draw 8, complete one, verify replace and cycle
- Manual: exhaust deck (complete all), verify reset and redraw

## Dependencies

- gameboard-campaign-deck (slots, completion, vibeulon spend)
- bruised-banana-quest-map (GATHERING_RESOURCES quest pool)
- campaign-kotter-domains (instance.kotterStage)

## Out of Scope

- Multi-domain per instance
- Campaign move automation
- Full Campaign model (Phase 2)
