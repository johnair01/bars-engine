# Quest/BAR Validation Rules v0

## Purpose

Define how the engine determines whether a generated quest/BAR flow is acceptable. Supports generation quality control, simulation/testing, rejection of malformed outputs, and future automated QA.

---

## 1. Validation Layers

### A. Structural Validation

Checks flow shape. Must pass for flow to be playable.

| Check | Pass Condition | Fail Condition |
|-------|----------------|----------------|
| Has start node | Exactly one node is startNodeId; exists in nodes | No start; multiple starts; start missing |
| Reachable next steps | Every non-terminal node has ≥1 choice with valid targetId | Orphan; choice targets non-existent node |
| Has completion or handoff | ≥1 terminal node (completion or handoff) | No terminal |
| No orphan nodes | All nodes reachable from start or from a choice | Node never reachable |
| Valid transitions | All targetIds exist or are external (signup, etc.) | targetId references missing node |
| No impossible cycles | Completion not in cycle | completion → non-terminal |
| BAR order | BAR_validation only after BAR_capture in same flow | BAR_validation with no prior BAR_capture |

### B. State Validation

Checks compatibility with game state. Context-dependent.

| Check | Pass Condition | Fail Condition |
|-------|----------------|----------------|
| Required BAR exists | BAR_validation targets BAR created in flow or actor inventory | BAR ref invalid or missing |
| Actor permission | Actor has capability for required action | Action requires permission actor lacks |
| Quest state legal | Quest state transitions follow [state-transitions.md](state-transitions.md) | Illegal transition |
| Campaign membership | join_quest requires campaign context when campaignRef set | Campaign missing |
| Signup context | signup node only when actor anonymous | signup when already authenticated |

### C. Language Validation

Checks user-facing text quality.

| Check | Pass Condition | Fail Condition |
|-------|----------------|----------------|
| No ambiguous instructions | Text has clear action request | "Do something" or vague |
| No missing labels | All choices have non-empty text | Choice text empty |
| No placeholder text | No "TODO", "{{", "[placeholder]" | Placeholder detected |
| Action request concrete | Verb + object or clear question | Abstract or unclear |
| Length (onboarding) | ≤80 words per node | >80 words in onboarding flow |

### D. Onboarding UX Validation

Checks suitability for first-time users.

| Check | Pass Condition | Fail Condition |
|-------|----------------|----------------|
| Limited branching | ≤3 choices per node; ≤2 branch levels | >3 choices; >2 levels |
| Short session | ≤12 nodes | >12 nodes |
| First action early | First action by node 5 | First action after node 5 |
| Completion path clear | Path from start to completion exists; ≤8 nodes | No path; path too long |
| No prior BAR required | No BAR_validation without prior BAR_capture | Assumes BAR inventory |
| No social before solo | No message_actor, enroll_ally before completion | Social before first completion |

---

## 2. Invalid Flow Conditions

Any of these → **fail**:

1. **No start node** — startNodeId missing or not in nodes
2. **No completion or handoff** — No terminal node
3. **Unreachable node** — Node not reachable from start via choices
4. **Required object never created** — BAR_validation references BAR not created in flow
5. **BAR used before creation** — BAR_validation or attach_BAR before BAR_capture
6. **Quest step requires permission not available** — Action needs capability starter actor lacks
7. **Contradictory transition conditions** — Same choice leads to mutually exclusive states
8. **Empty or broken user-facing copy** — Node text empty; choice text empty
9. **Dead-end node without explanation** — Node with no choices, not completion/handoff
10. **Onboarding flow exceeds complexity** — >12 nodes, >3 branches, first action after node 5
11. **Completion before any user action** — Path to completion with no choice/action
12. **Invalid targetId** — Choice targets non-existent node (except external: signup, etc.)
13. **Orphan node** — Node exists but no incoming transition

---

## 3. Warning Conditions

Soft-fail; flow may pass with warning:

| Condition | Warning |
|-----------|---------|
| Too many branches | "Branch count exceeds onboarding recommendation (3)" |
| Copy slightly long | "Node N exceeds 80 words; consider shortening" |
| Redundant reflection step | "Reflection adds friction; consider merging with prompt" |
| Optional BAR review | "BAR_validation adds step; skip for first flow" |
| Too many unfamiliar terms | ">2 lore terms without context in node N" |
| Consecutive prompts | "2+ prompts without choice; consider interleaving" |
| Long path to completion | "Path to completion is 9+ nodes" |
| No handoff after completion | "Completion is terminal; consider handoff to next quest" |

---

## 4. Validation Output Format

```ts
interface ValidationResult {
  status: 'pass' | 'warn' | 'fail'
  errors: ValidationError[]
  warnings: ValidationWarning[]
  summary: string
  failing_nodes: string[]
  suggested_repairs: SuggestedRepair[]
}

interface ValidationError {
  code: string
  message: string
  nodeId?: string
  context?: Record<string, unknown>
}

interface ValidationWarning {
  code: string
  message: string
  nodeId?: string
}

interface SuggestedRepair {
  action: string
  target: string
  description: string
}
```

**status:**
- `pass` — No errors; warnings optional
- `warn` — Warnings only; no errors
- `fail` — ≥1 error

**Example:**
```json
{
  "status": "fail",
  "errors": [
    { "code": "NO_COMPLETION", "message": "Flow has no completion or handoff node" },
    { "code": "BAR_BEFORE_CREATE", "message": "BAR_validation at node_3 before BAR_capture", "nodeId": "node_3" }
  ],
  "warnings": [
    { "code": "LONG_COPY", "message": "Node intro_1 exceeds 80 words", "nodeId": "intro_1" }
  ],
  "summary": "2 errors, 1 warning",
  "failing_nodes": ["node_3"],
  "suggested_repairs": [
    { "action": "insert", "target": "after node_2", "description": "Insert completion node" },
    { "action": "convert", "target": "node_3", "description": "Convert BAR_validation to BAR_capture" }
  ]
}
```

---

## 5. Repair Guidance

### Allowed Repairs

| Repair | When | Action |
|--------|------|--------|
| Insert missing completion | No terminal | Add completion node; link from last actionable node |
| Relabel unclear action | Ambiguous choice text | Replace with concrete verb+object |
| Remove unreachable branch | Orphan node | Remove node; fix choices pointing to it |
| Convert BAR_validation to BAR_capture | BAR_validation before BAR_capture | Change node type; add creation step |
| Simplify branch count | >3 choices | Merge options; reduce to 3 |
| Shorten copy | >80 words | Truncate; split into two nodes |

### Not Allowed (Manual Required)

| Condition | Reason |
|-----------|--------|
| Contradictory quest logic | Semantics unclear; human must fix |
| Missing core player action | Flow design flaw |
| Broken progression semantics | Order of operations wrong |
| Permission mismatch | Actor model / role config issue |
| Invalid campaign context | Instance/campaign setup |

---

## 6. Validation Against Golden Paths

Generated onboarding flows must be checked against approved flow patterns.

**Process:**
1. Load golden paths from [orientation-golden-paths.md](../examples/orientation-golden-paths.md)
2. Extract structure: node sequence, action positions, BAR lifecycle
3. Compare generated flow structure to golden path structures
4. Flag deviations: missing initiation, no action before completion, BAR order violation
5. Pass if structure matches at least one golden path pattern (or subset)

**Golden path types:**
- Minimal linear
- One choice
- BAR creation
- Guide/librarian interaction
- Handoff to first non-orientation quest

---

## 7. Validation Order

1. **Structural** — Must pass first
2. **State** — Run with context (actor, campaign, instance)
3. **Language** — Run on all user-facing nodes
4. **Onboarding UX** — Run when flow tagged as onboarding
5. **Golden path** — Run for onboarding flows

Fail fast: structural failures block subsequent layers.
