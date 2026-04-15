# Charge → Quest Generator — Example Workflows

## Example 1: Housing Frustration (Anger)

### Input

**Charge BAR**:
- summary: "I'm frustrated about housing costs"
- emotion_channel: anger
- intensity: 4
- context_note: "Rent keeps going up"

**Actor**: Nation Pyrakanth, Archetype Bold Heart (optional)

### Output

```json
{
  "success": true,
  "bar_id": "bar_123",
  "quest_suggestions": [
    {
      "move_type": "wake_up",
      "quest_title": "Learn how housing policy works in your city",
      "quest_summary": "Spend 30 minutes researching housing zoning laws and tenant protections.",
      "template_id": "research_exploration",
      "confidence": 0.72,
      "rationale": "Anger often signals unmet need; understanding policy can clarify next steps"
    },
    {
      "move_type": "grow_up",
      "quest_title": "Practice advocating for housing reform",
      "quest_summary": "Write one message to a local representative about housing.",
      "template_id": "skill_practice",
      "confidence": 0.63,
      "rationale": "Bold Heart + anger → courage experiment"
    },
    {
      "move_type": "show_up",
      "quest_title": "Invite neighbors into a housing conversation",
      "quest_summary": "Host a small discussion about housing issues in your area.",
      "template_id": "conversation_invitation",
      "confidence": 0.59,
      "rationale": "Pyrakanth bias toward visible action"
    }
  ]
}
```

---

## Example 2: Colleague Conflict (Anger → Clean Up)

### Input

**Charge BAR**:
- summary: "I'm angry at a colleague"
- emotion_channel: anger
- intensity: 5

**Actor**: Nation Lamenth (optional)

### Output

```json
{
  "quest_suggestions": [
    {
      "move_type": "clean_up",
      "quest_title": "Run a 3-2-1 reflection on the colleague conflict",
      "quest_summary": "Use the 3-2-1 process to process the emotional charge before taking action.",
      "template_id": "reflection_process",
      "confidence": 0.85,
      "rationale": "High-intensity anger + relational context → Clean Up first"
    },
    {
      "move_type": "wake_up",
      "quest_title": "Map what you notice about the conflict",
      "quest_summary": "Spend 10 minutes writing what you observe without judgment.",
      "template_id": "research_exploration",
      "confidence": 0.68
    }
  ]
}
```

---

## Example 3: Speaking Up (Fear → Grow Up)

### Input

**Charge BAR**:
- summary: "I wish I could speak up more in meetings"
- emotion_channel: fear
- intensity: 3

**Actor**: Nation Argyra, Archetype Truth Seer

### Output

```json
{
  "quest_suggestions": [
    {
      "move_type": "grow_up",
      "quest_title": "Practice one courageous statement in your next meeting",
      "quest_summary": "Choose one moment to voice a clear observation or question.",
      "template_id": "skill_practice",
      "confidence": 0.78,
      "rationale": "Fear + capacity gap → Grow Up courage experiment"
    },
    {
      "move_type": "wake_up",
      "quest_title": "Investigate what holds you back",
      "quest_summary": "Spend 15 minutes reflecting on what feels risky about speaking up.",
      "template_id": "reflection_process",
      "confidence": 0.65,
      "rationale": "Argyra/Truth Seer → clarity and investigation"
    }
  ]
}
```

---

## Example 4: Park Neglect (Neutrality → Show Up)

### Input

**Charge BAR**:
- summary: "The park near my house is neglected"
- emotion_channel: neutrality
- intensity: 2

### Output

```json
{
  "quest_suggestions": [
    {
      "move_type": "show_up",
      "quest_title": "Organize a small cleanup gathering",
      "quest_summary": "Invite 2–3 neighbors to spend an hour cleaning the park.",
      "template_id": "event_hosting",
      "confidence": 0.71
    },
    {
      "move_type": "wake_up",
      "quest_title": "Learn who maintains the park",
      "quest_summary": "Find out the city department or group responsible for the park.",
      "template_id": "research_exploration",
      "confidence": 0.58
    }
  ]
}
```

---

## Example 5: Create Quest from Suggestion

### Request

```json
POST /api/bars/bar_123/create-quest
{
  "suggestion_index": 0
}
```

### Result

Creates CustomBar:
- type: quest
- title: "Learn how housing policy works in your city"
- description: "Spend 30 minutes researching housing zoning laws..."
- moveType: wake_up
- sourceBarId: bar_123

---

## Example 6: Joy / Inspiration (Virelune)

### Input

**Charge BAR**:
- summary: "Feeling inspired to host a gathering"
- emotion_channel: joy
- intensity: 4

**Actor**: Nation Virelune, Archetype Joyful Connector

### Output

```json
{
  "quest_suggestions": [
    {
      "move_type": "show_up",
      "quest_title": "Invite people into a conversation",
      "quest_summary": "Host a small gathering around a topic you care about.",
      "template_id": "conversation_invitation",
      "confidence": 0.82,
      "rationale": "Joy + Virelune + Joyful Connector → relational activation"
    },
    {
      "move_type": "grow_up",
      "quest_title": "Practice hosting one micro-event",
      "quest_summary": "Organize a 30-minute coffee or walk with 2 people.",
      "template_id": "event_hosting",
      "confidence": 0.69
    }
  ]
}
```
