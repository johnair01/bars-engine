# Transformation Quest Seed from Registry — Example

This example shows how a narrative like **"I am afraid of failing"** is turned into a quest seed using selected moves from the Transformation Move Registry.

---

## Input

**Raw narrative**: I am afraid of failing

**Parsed structure** (from Narrative Transformation Engine):

```json
{
  "raw_text": "I am afraid of failing",
  "actor": "I",
  "state": "afraid",
  "object": "failing",
  "negations": [],
  "confidence": 0.78
}
```

**Detected lock type**: emotional_lock (state fused with object; fear as fixed reality)

---

## Move Selection

Given `emotional_lock` and WCGS full-arc requirements:

| Stage | Selected Move | Rationale |
|-------|---------------|-----------|
| Wake Up | Observe | Compatible with emotional_lock; surfaces pattern |
| Clean Up | Feel | Strong for emotional_lock; grounds in body |
| Grow Up | Reframe | Shifts meaning of failing |
| Show Up | Experiment | Tests new relationship to failing |
| Completion | Integrate | BAR capture of learning |

---

## Generated Prompts (Variable Substitution)

| Move | Template | Rendered Prompt |
|------|----------|-----------------|
| Observe | "What story are you telling yourself about {object}?" | What story are you telling yourself about failing? |
| Feel | "Where in your body do you feel {state} when you think about {object}?" | Where in your body do you feel afraid when you think about failing? |
| Reframe | "What might {object} be trying to teach you?" | What might failing be trying to teach you? |
| Experiment | "What is one small action where {object} is allowed?" | What is one small action where failing is allowed? |
| Integrate | "Capture what you learned from {object}." | Capture what you learned from failing. |

---

## BAR Integration

| Stage | BAR Action |
|-------|------------|
| Observe | Optional: Note what you're observing about failing. |
| Feel | None |
| Reframe | None |
| Experiment | Post-action: What did you learn from trying failing? |
| Integrate | **Required**: Create BAR with captured insight. Type: insight. |

---

## Resulting Quest Structure

```json
{
  "quest_seed_id": "gen_001",
  "source_narrative": "I am afraid of failing",
  "lock_type": "emotional_lock",
  "arc": {
    "wake": {
      "move_id": "observe",
      "prompt": "What story are you telling yourself about failing?",
      "output_type": "reflection"
    },
    "clean": {
      "move_id": "feel",
      "prompt": "Where in your body do you feel afraid when you think about failing?",
      "output_type": "somatic"
    },
    "grow": {
      "move_id": "reframe",
      "prompt": "What might failing be trying to teach you?",
      "output_type": "reflection"
    },
    "show": {
      "move_id": "experiment",
      "prompt": "What is one small action where failing is allowed?",
      "output_type": "action"
    },
    "integrate": {
      "move_id": "integrate",
      "bar_prompt": "Capture what you learned from failing.",
      "bar_type": "insight"
    }
  }
}
```

---

## Flow Summary

```
Observe (wake)  → What story are you telling yourself about failing?
     ↓
Feel (clean)    → Where in your body do you feel afraid when you think about failing?
     ↓
Reframe (grow)  → What might failing be trying to teach you?
     ↓
Experiment (show) → What is one small action where failing is allowed?
     ↓
Integrate       → Create BAR: Capture what you learned from failing.
```
