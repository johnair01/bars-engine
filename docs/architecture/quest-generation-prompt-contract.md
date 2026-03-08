# Quest Generation Prompt Contract

## Purpose

Define the strict output contract for AI-generated quest flows. Ensures generated quests are structurally valid, compatible with the quest/BAR flow grammar, machine-parseable, simulator-compatible, and suitable for onboarding and campaign play.

Generated quests must behave like **valid sentences in the quest flow language** — not creative text, but structured system output.

---

## 1. Generation Pipeline

```
AI generation
→ JSON parse
→ structural validation
→ flow simulation
→ approval or rejection
→ quest creation
```

The LLM output must support this pipeline. Output must be valid JSON only; no commentary, markdown, or explanations.

---

## 2. Output Requirements

- **Format:** Valid JSON only
- **Schema:** Must match [quest_generation_output_schema.json](../../prompts/quest_generation_output_schema.json)
- **Parseability:** Must parse without errors
- **Simulation:** Must pass flow simulator checks with default actor capabilities

---

## 3. Output Schema Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| flow_id | string | Yes | Unique identifier (e.g., `orientation_theme_v1`) |
| campaign_id | string | Yes | Campaign context (e.g., `bruised_banana_residency`) |
| start_node_id | string | Yes | Node where flow begins |
| nodes | array | Yes | Node objects |
| completion_conditions | array | Yes | At least one condition |
| expected_events | array | Yes | Events in successful run order |

---

## 4. Node Structure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique within flow |
| type | string | Yes | Allowed node type |
| copy | string | Yes | User-facing text (≤30 words for onboarding) |
| actions | array | Yes | Action objects; empty for terminal nodes |
| conditions | array | No | Preconditions for actions |
| emits | array | No | Node-level events when reached |

**Allowed node types:** introduction, prompt, choice, action, BAR_capture, BAR_validation, quest_join, quest_progress, reflection, completion, handoff

---

## 5. Action Structure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | Yes | Action type |
| requires | array | No | Permissions (e.g., `["observe", "create"]`) |
| emits | array | No | Events triggered |
| next_node_id | string | No | Target node; null for terminal |

**Allowed action types:** read, choose, submit, create_BAR, attach_BAR, confirm, join_quest, reflect, unlock_next_step, signup, donate

---

## 6. Completion Conditions

At least one condition required. Example:

```json
{
  "type": "node_reached",
  "node_id": "completion_1"
}
```

---

## 7. Event Emission

`expected_events` must list events in order of a successful run. Examples: orientation_viewed, prompt_viewed, bar_created, bar_validated, quest_progressed, quest_completed, handoff_triggered.

---

## 8. Structural Constraints

- Exactly one start node
- At least one user action (choose, create_BAR, signup, etc.) before completion
- Reachable completion or handoff node
- No unreachable nodes
- No circular transitions unless explicitly designed (avoid for onboarding)

---

## 9. BAR Lifecycle Constraints

Legal sequence: `prompt → create_BAR → validate → attach/use`

- BAR_validation cannot occur before BAR_capture in same flow
- BAR_validation requires condition `BAR_exists` when BAR created in flow

---

## 10. Onboarding Constraints

For onboarding quests:

- Maximum 6 nodes
- Maximum 1 branch (one choice with 2 outcomes)
- At least 1 user action
- Completion reachable within short flow
- Clear instructions; no jargon

---

## 11. Language Constraints

User-facing copy must be:

- Under 30 words per node
- Action-oriented
- Clear for first-time users
- Free of system jargon (no "BAR", "quest packet", "flow grammar")

Avoid: architecture terms, metaphysical language, vague instructions.

---

## 12. Validation Compatibility

Generated quests are validated against:

- [quest-bar-flow-grammar.md](quest-bar-flow-grammar.md)
- [quest-bar-validation.md](quest-bar-validation.md)
- [flow-simulator-contract.md](flow-simulator-contract.md)
- Golden path fixtures in `fixtures/flows/`

Reject if validation fails.

---

## 13. References

- [quest_generation_system_prompt.md](../../prompts/quest_generation_system_prompt.md)
- [quest_generation_user_prompt_template.md](../../prompts/quest_generation_user_prompt_template.md)
- [quest_generation_output_schema.json](../../prompts/quest_generation_output_schema.json)
- [generated-quest-example.md](../examples/generated-quest-example.md)

---

## 14. Future: Quest Generation Test Harness

A test harness that runs `generate → validate → simulate → score → store result` would turn the engine into a self-improving quest generator. Implement after the contract is stable.
