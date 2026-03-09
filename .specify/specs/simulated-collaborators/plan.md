# Plan: Simulated Collaborators (Phased)

## Current State

- **Flow simulator**: `simulateFlow()`, CLI, Bruised Banana fixtures — all working
- **Actor roles**: Librarian, Collaborator, Witness — contracts defined, `flow_capabilities` differ
- **proposeActorAction**: Stub that returns "observe" for any role
- **simulateFlowWithActors**: Stub that delegates to `simulateFlow` with primary role capabilities

**Runtime**: Player advances through flows via:
- **CampaignReader** — fetches nodes from `/api/adventures/[slug]/[nodeId]` (node format: `{ id, text, choices }`)
- **PassageRenderer** / **TwineQuestModal** — Twine passages, `advanceRun` for navigation

FlowJSON is used for simulation/validation; runtime uses Twine passages or API nodes. We can bridge by compiling Twine → FlowJSON when needed.

---

## Phase 1: Make proposeActorAction Actually Propose (Simulation-Only)

**Goal**: Librarian proposes next valid actions; Witness reflects; Collaborator suggests substeps. No UI yet.

**Changes**:
1. Extend `ProposeActorActionInput` to accept `flow: FlowJSON` and `current_node_id`
2. Implement role-specific logic:
   - **Librarian**: Return list of available actions at current node (from flow), with labels like "You could continue to X" or "Choose Y"
   - **Witness**: Return acknowledgment of visited nodes / events (e.g. "You've completed the intro")
   - **Collaborator**: Return suggested substep or decomposition (e.g. "Consider drafting your BAR before validating")
3. Reuse `getAvailableActions`-style logic from `simulateFlow` (capability + condition checks)

**Output shape**:
```ts
interface ProposedActorAction {
  action_type: 'observe' | 'propose' | 'suggest' | 'acknowledge' | 'none'
  message: string
  allowed: boolean
  suggested_actions?: Array<{ label: string; next_node_id: string; type: string }>
}
```

**Tests**: Librarian at choice node returns multiple suggestions; Witness at completion returns acknowledgment; unknown role returns `allowed: false`.

---

## Phase 2: Guidance API for UI Consumption ✅

**Goal**: Expose guidance so the UI can show "Librarian suggests: …" without running full simulation.

**Implemented**:
- `getActorGuidance(flow, current_node_id, role_id, quest_state)` in `src/lib/simulation/guidance.ts`
- `loadFlowBySlug(slug)` in `src/lib/simulation/flowLoader.ts` — registry: bruised-banana, campaign-intro, identity-selection, intended-impact-bar, orientation-linear, orientation-bar
- `GET /api/guidance?flowId=...&nodeId=...&role=librarian` — optional `visited`, `events` (comma-separated)

**Changes**:
1. Add `getActorGuidance(flow, currentNodeId, roleId, questState)` — wraps `proposeActorAction` with flow-aware input
2. Add API route `GET /api/guidance?flowId=...&nodeId=...&role=librarian` (or POST with body)
3. Flow loading: For Bruised Banana, load from `reports/quest-corpus/bruised-banana-onboarding-flow.json` or compile from twee on demand
4. For Twine adventures: need storyId → FlowJSON mapping (compile from source or use cached export)

**Contract**:
```ts
interface GuidanceResponse {
  role_id: string
  role_name: string
  message: string
  suggested_actions?: Array<{ label: string; target_id: string }>
  allowed: boolean
}
```

---

## Phase 3: UI Integration — Guidance Panel

**Goal**: Player sees optional guidance (e.g. "Ask Librarian") while on a passage.

**Changes**:
1. Add "Get guidance" button or auto-fetch when passage loads (configurable)
2. In PassageRenderer or CampaignReader: call guidance API with `currentPassageName` / `nodeId`, `role=librarian`
3. Render a collapsible panel: "Librarian: You could continue to X or choose Y"
4. Requires flow context: storyId → flow. For Bruised Banana campaign, use known flow. For Twine quests, compile from story or skip.

**UX**: Subtle, non-intrusive. Player can ignore. No auto-execution of suggested actions.

---

## Phase 4: Multi-Actor Simulation Mode (Optional)

**Goal**: Run simulation with player + Librarian + Witness; each proposes in turn. Useful for testing "guided playthrough" behavior.

**Changes**:
1. Extend `simulateFlowWithActors` to optionally inject "actor turns" — at each node, call `proposeActorAction` for each actor in roster before advancing
2. Emit `actor_proposal` events into the simulation log
3. CLI flag: `npm run simulate -- flow.json --actors librarian,witness --verbose`
4. Output includes actor messages at each step

---

## Dependencies

| Phase | Depends On |
|-------|------------|
| 1 | Current simulation (done) |
| 2 | Phase 1; flow loading (twee→flow or cached JSON) |
| 3 | Phase 2; PassageRenderer / CampaignReader integration point |
| 4 | Phase 1; simulateFlowWithActors extension |

---

## Recommended Next Step

**Start with Phase 1**: Flesh out `proposeActorAction` so it returns real, useful proposals. No UI, no API — pure logic. Once that works, Phase 2 and 3 become straightforward wiring.
