# Transformation Quest Example 2

## Input

```
I can't ask for help
```

## Output

### Lock Type

**action lock** — inability claim; actor fused with constraint.

### Parsed Structure

```json
{
  "rawText": "I can't ask for help",
  "actor": "I",
  "state": "unable",
  "object": "asking for help",
  "negations": ["can't"],
  "lockType": "action",
  "confidence": 0.82
}
```

### Move Generation (WCGS)

| move_id | move_type | prompt |
|---------|-----------|--------|
| wake_observe_pattern | wake_up | What story are you telling yourself about asking for help? |
| cleanup_shadow_dialogue | clean_up | If "can't" could speak, what would it say? |
| grow_reframe | grow_up | What might asking for help be trying to teach you? |
| show_small_action | show_up | What is one small action where asking is allowed? |

### Resulting Action Experiment

```
Ask one person for a small, specific favor. Notice what happens in your body before and after.
```

### BAR Capture Prompt

```
Capture what you noticed when you asked. What shifted? What stayed the same?
```
