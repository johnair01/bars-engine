# Charge Capture API — Service Contracts v0

## Overview

Charge Capture is BAR-first and API-first. All charge capture flows create CustomBar records with `type: 'charge_capture'`. Services can be implemented as Next.js server actions or HTTP endpoints.

---

## Service Boundaries

### 1. Create Charge BAR

**Contract**: `createChargeBar(payload: CreateChargeBarPayload) => Promise<{ success: true; barId: string } | { error: string }>`

**Payload**:
```ts
interface CreateChargeBarPayload {
  summary: string           // Required. Short text: "What feels charged?"
  emotion_channel?: 'anger' | 'joy' | 'sadness' | 'fear' | 'neutrality'  // Optional
  intensity?: 1 | 2 | 3 | 4 | 5  // Optional
  context_note?: string     // Optional
}
```

**Behavior**:
- Creates CustomBar with `type: 'charge_capture'`
- `title`: summary (truncated to ~50 chars if needed)
- `description`: summary + context_note if present
- `visibility`: `'private'`
- `inputs`: JSON string of `{ emotion_channel, intensity, context_note }`
- `creatorId`: current player

**HTTP**: `POST /api/bars/charge`

**Request body**:
```json
{
  "summary": "Frustration about housing costs",
  "emotion_channel": "anger",
  "intensity": 4,
  "context_note": "optional"
}
```

---

### 2. List Recent Charge Captures

**Contract**: `getRecentChargeBars(actorId: string, filters?: ChargeListFilters) => Promise<{ success: true; bars: CustomBar[] } | { error: string }>`

**Filters**:
```ts
interface ChargeListFilters {
  limit?: number   // default 20
  offset?: number
  since?: string   // ISO date
}
```

**Behavior**:
- Returns CustomBar where `type = 'charge_capture'` AND `creatorId = actorId`
- Ordered by `createdAt` descending
- Privacy: only creator's own charge BARs

**HTTP**: `GET /api/actors/:id/charge?limit=20&offset=0`

---

### 3. Generate Quest Suggestions from Charge BAR

**Contract**: `generateQuestSuggestions(barId: string) => Promise<{ success: true; suggestions: QuestSuggestion[] } | { error: string }>`

**Behavior**:
- Validates bar exists and is `charge_capture` type
- Validates creator is current player
- Returns suggested quests (Wake Up, Clean Up, Grow Up, Show Up) based on charge content
- Does not create quests; returns suggestions only
- User must explicitly choose to create

**Response**:
```ts
interface QuestSuggestion {
  move_type: 'wake_up' | 'clean_up' | 'grow_up' | 'show_up'
  title: string
  description: string
  rationale?: string
}
```

**HTTP**: `POST /api/bars/:id/generate-quest`

**Note**: Implemented by [Charge → Quest Generator v0](charge-quest-generator-api.md). May also integrate with BAR → Quest Generation Engine and transformation move registry.

---

### 4. Launch 3-2-1 Reflection from Charge BAR

**Contract**: `run321FromCharge(barId: string) => Promise<{ success: true; sessionId?: string } | { error: string }>`

**Behavior**:
- Validates bar exists and is `charge_capture` type
- Validates creator is current player
- Launches 3-2-1 reflection workflow with charge BAR as context
- Returns session or redirect URL

**HTTP**: `POST /api/bars/:id/run-321`

---

### 5. Get Charge BAR by ID

**Contract**: `getChargeBar(barId: string) => Promise<{ success: true; bar: CustomBar } | { error: string }>`

**Behavior**:
- Returns CustomBar if `type = 'charge_capture'` and creator is current player
- 404 otherwise

**HTTP**: `GET /api/bars/:id` (existing; charge type is a subtype)

---

## Post-Capture Action Routing

After `createChargeBar`, the client may call:

| User choice | Action |
|-------------|--------|
| Reflect | `run321FromCharge(barId)` |
| Explore | `generateQuestSuggestions(barId)` → then user chooses |
| Act | Navigate to create quest invitation (or `createInteractionBar` with type `quest_invitation`) |
| Not now | No further API call |

---

## Privacy Enforcement

- All charge BAR queries filter by `creatorId = currentPlayer`
- `visibility` defaults to `private`
- Share/transition flows require explicit user action

---

## Testing Requirements

- Charge BAR creation with minimal payload (summary only)
- Optional emotion_channel and intensity
- Privacy defaults (visibility private)
- Fast capture flow: < 10 seconds, 3–5 taps
- API endpoint behavior

---

## Implementation Notes

- Extend `createInteractionBar` or add `createChargeBar` in `src/actions/`
- Add `charge_capture` to `CustomBar.type` taxonomy (system-bar-interaction-layer.md)
- Reuse existing BAR list/get patterns; filter by type
