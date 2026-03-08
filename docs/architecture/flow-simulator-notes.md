# Flow Simulator Notes

## Purpose

Lightweight notes for a minimal simulator/validator that tests generated flows. Answers: Can the flow start? Can the actor complete required actions? Are required objects available? Is completion reachable? Do emitted events align with transitions?

**Formal contract:** See [flow-simulator-contract.md](flow-simulator-contract.md) for inputs, outputs, validation failures, and fixture format. Fixtures in `fixtures/flows/`.

**Full pipeline:** AI generation → JSON parse → structural validation → flow simulation → approval/rejection → quest creation. See [quest-generation-prompt-contract.md](quest-generation-prompt-contract.md).

---

## 1. Simulator Scope

The simulator is **read-only**. It does not mutate game state. It walks the flow graph and checks invariants.

**Inputs:**
- Flow (nodes, transitions, startNodeId)
- Optional: actor context (permissions, BAR inventory)
- Optional: campaign context (instance, membership)

**Outputs:**
- ValidationResult (pass/warn/fail)
- Reachability report
- Event sequence for a successful run

---

## 2. Core Checks

### Can the flow start?

- startNodeId exists in nodes
- startNodeId has no required preconditions that fail (e.g., signup when already authenticated)

### Can the actor complete required actions?

- For each action node: actor has required permission
- For signup: actor is anonymous
- For join_quest: quest exists and is open

### Are all required objects available when needed?

- BAR_validation: BAR exists (created earlier in flow or in actor inventory)
- attach_BAR: BAR and target exist
- quest_join: questRef valid

### Is completion reachable?

- BFS/DFS from startNodeId
- At least one path reaches a terminal node (completion or handoff)
- No path requires impossible state (e.g., BAR before creation)

### Do emitted events align with expected transitions?

- Each transition has a corresponding event type
- Event order matches transition order
- No event without transition

---

## 3. Algorithm Sketch

```
function simulate(flow):
  visited = {}
  queue = [flow.startNodeId]
  barCreated = false
  actionsPerformed = 0

  while queue not empty:
    nodeId = queue.pop()
    if nodeId in visited: continue
    visited[nodeId] = true

    node = flow.nodes[nodeId]
    if node.type == BAR_capture: barCreated = true
    if node.type == BAR_validation and not barCreated: return FAIL
    if node.type in [choice, action, BAR_capture]: actionsPerformed++

    if node.type in [completion, handoff]:
      if actionsPerformed == 0: return FAIL  // completion before action
      return PASS

    for choice in node.choices:
      if choice.targetId in flow.nodes:
        queue.push(choice.targetId)
      else if choice.targetId in [signup, donate]:
        // external; treat as valid
        continue

  if no terminal reached: return FAIL
  return PASS
```

---

## 4. Integration with Validation

The simulator can be used as a **structural validation** step:

1. Run simulator on flow
2. If simulator returns FAIL → structural validation fails
3. If simulator returns PASS → proceed to state, language, onboarding validation

The simulator does not replace validation; it provides a fast structural check and reachability proof.

---

## 5. Test Fixtures

Use golden paths from [orientation-golden-paths.md](../examples/orientation-golden-paths.md) as test fixtures:

- Each golden path should simulate to PASS
- Mutations (remove completion, add BAR_validation before BAR_capture) should simulate to FAIL
- Assert: golden path N → PASS; golden path N with node X removed → FAIL

---

## 6. Future Extensions

- **Stateful simulation:** Track actor state across transitions; validate state machine compatibility
- **Timing:** Estimate session length from node count and copy length
- **Branch coverage:** Report which branches are reachable; flag unreachable branches

Keep minimal for v0.
