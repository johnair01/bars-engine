# Charge Capture — Example Workflows

## Example 1: Minimal Capture (3 taps)

**Scenario**: User feels something, wants to capture quickly.

**Flow**:
1. Tap "Capture Charge"
2. Type: "Housing costs are crushing me"
3. Tap "Create BAR"

**Result**: BAR created. No emotion or intensity. Post-capture options shown.

**API**:
```json
POST /api/bars/charge
{
  "summary": "Housing costs are crushing me"
}
```

**CustomBar created**:
- type: `charge_capture`
- title: "Housing costs are crushing me"
- description: "Housing costs are crushing me"
- visibility: `private`
- inputs: `{"emotion_channel":null,"intensity":null,"context_note":null}`

---

## Example 2: Full Capture with Emotion

**Scenario**: User captures with emotional channel and intensity.

**Flow**:
1. Tap "Capture Charge"
2. Type: "Inspired to host a gathering"
3. Select: Joy (Wood)
4. Slider: 4 (strong)
5. Optional: "Been thinking about it for weeks"
6. Tap "Create BAR"

**API**:
```json
POST /api/bars/charge
{
  "summary": "Inspired to host a gathering",
  "emotion_channel": "joy",
  "intensity": 4,
  "context_note": "Been thinking about it for weeks"
}
```

**CustomBar created**:
- type: `charge_capture`
- title: "Inspired to host a gathering"
- description: "Inspired to host a gathering\n\nBeen thinking about it for weeks"
- visibility: `private`
- inputs: `{"emotion_channel":"joy","intensity":4,"context_note":"Been thinking about it for weeks"}`

---

## Example 3: Post-Capture → Reflect

**Scenario**: User captures, then chooses "Reflect".

**Flow**:
1. Capture charge (summary)
2. See: "Charge captured. What would you like to do with it?"
3. Tap "Run a 3-2-1 reflection"

**API**:
```json
POST /api/bars/{barId}/run-321
```

**Result**: 3-2-1 reflection session launched with charge BAR as context.

---

## Example 4: Post-Capture → Explore

**Scenario**: User captures, then chooses "Explore".

**Flow**:
1. Capture charge
2. Tap "Turn this into a Wake Up quest"
3. System returns suggestions

**API**:
```json
POST /api/bars/{barId}/generate-quest
```

**Response**:
```json
{
  "success": true,
  "suggestions": [
    {
      "move_type": "wake_up",
      "title": "Map what you notice about housing",
      "description": "Spend 10 minutes noticing what feels stuck...",
      "rationale": "Charge suggests awareness work"
    }
  ]
}
```

User may then create a quest from a suggestion (separate flow).

---

## Example 5: Post-Capture → Not Now

**Scenario**: User captures and exits.

**Flow**:
1. Capture charge
2. Tap "Not now"

**Result**: No further API calls. BAR exists. User can return later to Reflect, Explore, or Act from dashboard "Recent Charge".

---

## Example 6: Dashboard Recent Charge

**Scenario**: User views recent captures.

**API**:
```json
GET /api/actors/{playerId}/charge?limit=10
```

**Response**:
```json
{
  "success": true,
  "bars": [
    {
      "id": "bar_123",
      "title": "Inspired to host a gathering",
      "description": "Inspired to host a gathering...",
      "type": "charge_capture",
      "visibility": "private",
      "createdAt": "2025-03-02T14:30:00Z",
      "inputs": "{\"emotion_channel\":\"joy\",\"intensity\":4}"
    }
  ]
}
```

**Dashboard actions** per BAR: Reflect, Turn into quest, Share as signal, Archive.

---

## Timing Target

| Step | Target |
|------|--------|
| Open capture | < 1 s |
| Enter summary | 3–5 s |
| Optional emotion | 1 tap |
| Optional intensity | 1 tap |
| Create BAR | 1 tap |
| **Total** | **5–10 s** |
