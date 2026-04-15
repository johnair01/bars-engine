# MVP Social Loop via BARs

## Loop Overview

```
Player completes quest
  → mints reflective BAR (type: bar or insight)
  → optionally derives public/campaign-visible BAR
  → another player responds with appreciation BAR or BarShare
  → player creates help_request BAR
  → another player responds (offer_help)
  → player creates quest_invitation BAR
  → collaboration starts
```

---

## Step-by-Step

### 1. Player Completes Quest

- Existing flow: `completeQuest` in `src/actions/quest-engine.ts`
- Quest completion may create BAR via `barTypeOnCompletion` (insight/vibe) in completionEffects
- Reflective BAR: `type: 'insight'` or `type: 'vibe'`, `visibility: 'private'`

### 2. Derive Public BAR (Optional)

- Player explicitly shares or creates derived BAR
- `visibility: 'public'`, `campaignRef` set
- No automatic derivation of private → public; requires user intent

### 3. Another Player Appreciates

- Option A: `BarShare` (existing) — share BAR to player with note
- Option B: `createInteractionBar({ barType: 'appreciation', ... })` — structured appreciation

### 4. Player Creates Help Request

- `createInteractionBar({ barType: 'help_request', ... })`
- Campaign-visible when `campaignRef` set

### 5. Another Player Responds

- `respondToBar(barId, { responseType: 'offer_help', message: '...' })`
- BarResponse created; BAR status may transition open → active

### 6. Player Creates Quest Invitation

- `createInteractionBar({ barType: 'quest_invitation', parentId: questId, ... })`
- Links to quest (CustomBar with type=quest)

### 7. Collaboration Starts

- Respondents join; when slots filled, status → fulfilled
- PlayerQuest assignments created via existing quest flow

---

## Data Flow (CustomBar Only)

| Step | CustomBar type | parentId | campaignRef |
|------|----------------|----------|-------------|
| Reflective | insight, vibe | null | null |
| Derived | bar, impact | questId? | set |
| Appreciation | appreciation | targetBarId? | optional |
| Help request | help_request | null or questId | set |
| Quest invitation | quest_invitation | questId | set |

---

## Integration Points

- **Quest completion**: `quest-engine.ts` — already creates BARs via completionEffects
- **Bar sharing**: `bars.ts` — `shareBar` uses BarShare
- **Gameboard**: `GameboardAidOffer` — separate model for slot-based AID; can coexist with help_request BAR
- **Dashboard**: Query `getBarFeed` for actionable items

---

## Constraints

- No chat as first social substrate
- Social gravity through BARs only
- Mobile-friendly: bounded actions, minimal text
- Structured responses (join, decline, etc.) not free-form
