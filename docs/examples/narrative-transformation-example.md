# Narrative Transformation Example 1

## Input

```
I am afraid of failing
```

## Output

### Parsed Structure

```json
{
  "rawText": "I am afraid of failing",
  "actor": "I",
  "state": "afraid",
  "object": "failing",
  "negations": [],
  "lockType": "emotional",
  "confidence": 0.78
}
```

### Transformation Moves (WCGS)

| move_id | move_type | prompt |
|---------|-----------|--------|
| wake_observe_pattern | wake_up | What story are you telling yourself about failing? |
| cleanup_shadow_dialogue | clean_up | If fear could speak, what would it say? |
| grow_reframe | grow_up | What might failing be trying to teach you? |
| show_small_action | show_up | What is one small action where failing is allowed? |

### Emotional Alchemy Linkage

| Field | Value |
|-------|-------|
| State | fear |
| Alchemy prompt | Where do you feel the fear in your body? |
| Possible channel | fear / metal |
| Suggested move | WAVE + small-risk action |

### 3-2-1 Prompts

| Person | Prompt |
|--------|--------|
| 3rd | Failure is always watching me |
| 2nd | Failure, what are you trying to show me? |
| 1st | I am the part that fears collapse and wants protection |

### Quest Seed

```json
{
  "questSeedType": "narrative_transformation",
  "wake_prompt": "What story are you telling yourself about failing?",
  "cleanup_prompt": "If fear could speak, what would it say?",
  "grow_prompt": "What might failing be trying to teach you?",
  "show_objective": "Take one small action today where imperfect completion is allowed.",
  "bar_prompt": "Capture what you learned from taking this imperfect step."
}
```
