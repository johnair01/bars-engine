# Charge → Quest Generator API — Service Contracts v0

## Overview

The Charge → Quest Generator is BAR-first and API-first. It converts charge capture BARs into quest suggestions. Services can be implemented as Next.js server actions or HTTP endpoints.

---

## Service Boundaries

### 1. Generate Quest Suggestions from Charge BAR

**Contract**: `generateQuestSuggestionsFromCharge(barId: string) => Promise<GenerateQuestSuggestionsResult>`

**Behavior**:
- Validates bar exists and `type = 'charge_capture'`
- Validates creator is current player
- Analyzes charge (summary, emotion_channel, intensity, context_note)
- Loads actor context (nation, archetype) when available
- Returns 3–4 quest suggestions mapped to Wake Up, Clean Up, Grow Up, Show Up
- Does not create quests; suggestions only

**Response**:
```ts
interface QuestSuggestion {
  move_type: 'wake_up' | 'clean_up' | 'grow_up' | 'show_up'
  quest_title: string
  quest_summary: string
  template_id?: string
  confidence?: number
  rationale?: string
}

interface GenerateQuestSuggestionsResult {
  success: true
  bar_id: string
  quest_suggestions: QuestSuggestion[]
}
```

**HTTP**: `POST /api/bars/:id/generate-quests`

**Request**: No body. Bar ID in path.

---

### 2. Create Quest from Suggestion

**Contract**: `createQuestFromSuggestion(barId: string, suggestionIndex: number) => Promise<{ success: true; questId: string } | { error: string }>`

**Behavior**:
- Validates bar exists and is `charge_capture`
- Validates creator is current player
- Uses suggestion at index (from prior generateQuestSuggestionsFromCharge call)
- Creates CustomBar with `type: 'quest'`, `sourceBarId: barId`
- Sets title, description, moveType from suggestion

**HTTP**: `POST /api/bars/:id/create-quest`

**Request body**:
```json
{
  "suggestion_index": 0
}
```

---

### 3. Get Cached Quest Suggestions

**Contract**: `getQuestSuggestions(barId: string) => Promise<{ success: true; suggestions: QuestSuggestion[] } | { error: string }>`

**Behavior**:
- Returns cached suggestions if available (e.g. from prior generate call)
- If not cached, returns empty or triggers generation (implementation choice)
- Validates creator is current player

**HTTP**: `GET /api/bars/:id/quest-suggestions`

---

### 4. Link BAR as Origin to Existing Quest

**Contract**: `linkBarToQuest(questId: string, barId: string) => Promise<{ success: true } | { error: string }>`

**Behavior**:
- Updates CustomBar (quest) to set `sourceBarId = barId`
- Validates quest and bar exist
- Validates current player is creator of both (or has permission)

**HTTP**: `POST /api/quests/:id/link-bar`

**Request body**:
```json
{
  "bar_id": "string"
}
```

**Note**: When creating a quest via `createQuestFromSuggestion`, sourceBarId is set automatically. This endpoint supports linking when quest was created through another flow.

---

## Flow Summary

```
Charge BAR (charge_capture)
    ↓
POST /bars/:id/generate-quests
    ↓
Quest suggestions (3–4)
    ↓
User chooses "Create quest"
    ↓
POST /bars/:id/create-quest { suggestion_index: 0 }
    ↓
CustomBar (quest) with sourceBarId = charge BAR
```

---

## User Choices After Suggestions

| Choice | API / Action |
|--------|--------------|
| Create quest | `createQuestFromSuggestion(barId, index)` |
| Reflect first | `run321FromCharge(barId)` (Charge Capture API) |
| Save for later | No API; user returns later |
| Ignore | No API |

---

## Testing Requirements

- Quest suggestions generated (3–4)
- Emotion channel influences suggestions
- Nation/archetype overlays applied when actor context available
- Templates populated correctly
- BAR linking preserved (sourceBarId)
- Multiple quest suggestions returned
- Deterministic behavior when possible (same input → same output for template-based path)

---

## Implementation Notes

- Align with existing `generateQuestSuggestions` in charge-capture-api.md; Charge → Quest Generator extends it with full transformation model
- May integrate with `src/lib/bar-quest-generation/` for interpretation and emotional alchemy
- May integrate with `src/lib/transformation-move-registry/` for move categories
- Template library: define or extend quest templates in `src/lib/` or config
