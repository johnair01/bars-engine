# Spec: Flow Simulator CLI + Bounded Simulated Actor Roles

**Backlog ID**: **DT** (priority `0.56`). A duplicate row **`DQ` (`0.45.1`)** pointed at this same spec; it was **folded into DT** (March 2026). Use **DT** in dependencies and docs.

## Purpose

Add a lightweight simulation environment for quest flows and onboarding flows, with optional support for bounded simulated actor roles. Supports fixture validation, onboarding debugging, quest execution testing, and event/state inspection. Lays groundwork for future single-player mode with simulated collaborators and **autonomous agent testing and content creation**.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

**Source**: [STRAND_CONSULT.md](./STRAND_CONSULT.md) — Game Master consultation (Architect, Regent, Challenger, Sage) on extending utility and unblocking autonomous agents.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Simulation scope | Level 1 (flow) implemented; Level 2 (actors) lightly scaffolded; Level 3 (world) not built |
| CLI entry | `bars simulate` or `npm run simulate` (adapt to project conventions) |
| Determinism | All flow simulation deterministic; no non-deterministic branching in v1 |
| Actor roles | Librarian, Collaborator, Witness — bounded, useful before dramatic |
| Agent testing | Deterministic seed; isolated sandbox; fixture validation; audit trail |
| Content creation | Simulator validation before human review; creatorType traceability; admin approval gate |

## Agent Testing & Content Creation (from Strand Consult)

### Agent Testing Blockers (to address)

| Blocker | Priority | Mitigation |
|---------|----------|------------|
| No `completeQuest`-style API for agents | High | Add agent-facing API or Server Action that agents can call to simulate quest completion |
| Fixtures missing key pathways (creation, deletion) | High | Extend fixtures to cover BAR creation, quest completion, move validation flows |
| Incomplete endpoint/response documentation | Medium | Document SimulationResult schema; add OpenAPI or typed contracts |
| No sandbox for agent experiments | High | Agents must use isolated DB or in-memory state; never production |
| Lack of deterministic IDs in fixtures | Medium | Use stable IDs in flow JSON; document fixture schema |
| Player context and unlock data not visible | Medium | Expose state_changes and events_emitted so agents can assert on readiness |

### Content Creation Rules (Regent)

- **Simulator validation**: All new quests or BARs from agents must pass simulator validation before human review.
- **Creator type**: Agent-created content must have `creatorType: 'agent'` (or equivalent) for traceability.
- **Admin approval**: Content creation by agents requires subsequent admin approval before publication.
- **Mandatory validation**: Agents cannot bypass validation; all content must pass format and schema checks.

### Boundary Rules

- **No production mutation**: Agents must never mutate production database or environment.
- **Traceable content only**: All agent-created content must be logged with agent ID and timestamp.
- **Fixture reset**: Tests that alter default fixture state must reset or use isolated copies.

### Integration Path

Flow Simulator CLI, [transformation-simulation-harness](../transformation-simulation-harness/spec.md), and [npc-agent-game-loop](../npc-agent-game-loop-simulation/spec.md) should interoperate via:

- **Shared protocol**: State and intent passed between tools; publish-subscribe or shared config.
- **Unified CLI**: Single entry point (`bars simulate` or `npm run simulate`) with subcommands for flow, quest, agent, campaign, onboarding.
- **Shared contracts**: Fixture schema, SimulationResult shape, and logging format reused across tools.

### Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Data corruption from untraceable mutations | Sandbox isolation; audit trail; creatorType on all agent records |
| Analytics pollution from test actions | Separate test data from production analytics; tag agent runs |
| Fixture drift over time | Immutable fixture snapshots; reset after each run; version fixtures |

## Conceptual Model

| Concept | Meaning |
|---------|---------|
| **Flow simulation** | Node traversal, action execution, state updates, event emission, completion checks |
| **Bounded actor** | Role-based simulated participant; proposes, suggests, acknowledges; does not finalize or mutate critical state |
| **Fixture** | Golden-path flow JSON used for validation and regression |

## API Contracts (API-First)

### simulateFlow(flow, context)

**Input:**

```ts
interface SimulateFlowInput {
  flow: FlowJSON
  actor_capabilities?: string[]
  initial_state?: Record<string, unknown>
}
```

**Output:**

```ts
interface SimulationResult {
  status: 'pass' | 'warn' | 'fail'
  flow_id: string
  visited_nodes: string[]
  events_emitted: string[]
  state_changes: Array<{ key: string; from: unknown; to: unknown }>
  warnings: string[]
  errors: string[]
  completion_reached: boolean
}
```

### simulateFlowWithActors(flow, context, actorRoster) — scaffold only

Runs a flow with one or more bounded simulated actors available. Light scaffold in v1.

### getSimulatedActorRole(roleId)

Returns role definition and allowed actions. Roles: `librarian`, `collaborator`, `witness`.

### proposeActorAction(actor, questState, context) — scaffold only

Returns a bounded proposed action or guidance event. Light scaffold in v1.

## User Stories

### P1: CLI flow simulation

**As a developer**, I can run `bars simulate <path>` to validate a flow fixture, so I can debug quest behavior without the UI.

**Acceptance**: CLI loads flow JSON, traverses nodes, executes actions, evaluates conditions, emits events, reports pass/warn/fail.

### P2: Bruised Banana fixtures

**As a developer**, I can run the Bruised Banana onboarding fixtures through the simulator, so onboarding flows are validated.

**Acceptance**: `campaign_intro.json`, `identity_selection.json`, `intended_impact_bar.json` simulate to pass with default actor capabilities.

### P3: Bounded actor roles (scaffold)

**As a developer**, I can access role definitions for Librarian, Collaborator, Witness, so I can extend actor simulation later.

**Acceptance**: `getSimulatedActorRole(roleId)` returns role contract; no full actor execution in v1.

### P4: Agent testing (Phase 4+)

**As an autonomous agent**, I can run flow simulations and assert on `events_emitted` and `state_changes`, so I can validate features without human-in-the-loop.

**Acceptance**: SimulationResult includes structured events; deterministic seed; agents run in sandbox; no production mutation.

### P5: Agent content creation (Phase 4+)

**As an autonomous agent**, I can propose quests or BARs that pass simulator validation, so content can be validated before human review.

**Acceptance**: Format contracts (JSON templates); creatorType traceability; validation pipeline before approval gate.

## Functional Requirements

### Phase 1: Flow simulator core

- **FR1**: CLI command `bars simulate <path>` (or `npm run simulate -- <path>`).
- **FR2**: Load flow JSON; validate schema; confirm start node exists.
- **FR3**: Traverse nodes; execute actions allowed by actor capabilities; evaluate conditions; update state; emit events.
- **FR4**: Detect failures: missing_start_node, invalid_transition, unreachable_completion, required_capability_missing, condition_can_never_pass, BAR_validation_before_BAR_creation, node_references_missing, dead_end_without_completion.
- **FR5**: Output: status, visited_nodes, events_emitted, state_changes, warnings, errors, completion_reached.
- **FR6**: `--verbose` for readable traversal log; `--json` for machine-readable output.
- **FR7**: `--actor <id>` for actor context (capability set).

### Phase 2: Bruised Banana fixtures

- **FR8**: Fixtures: `campaign_intro.json`, `identity_selection.json`, `intended_impact_bar.json` in `fixtures/onboarding/bruised-banana/`.
- **FR9**: All three fixtures simulate to pass with default capabilities.

### Phase 3: Bounded actor scaffold

- **FR10**: Role definitions for Librarian, Collaborator, Witness (docs + types).
- **FR11**: `getSimulatedActorRole(roleId)` returns role contract.
- **FR12**: Light scaffold for `simulateFlowWithActors` and `proposeActorAction` (signatures only or minimal impl).

### Phase 4: Agent-oriented extensions (from STRAND_CONSULT)

- **FR13**: **Replay capability**: SimulationResult includes full `events_emitted` sequence; agents can assert on event order and presence.
- **FR14**: **Deterministic seed**: All simulations accept optional `seed`; same seed + same flow → same result.
- **FR15**: **Fixture schema contract**: Document flow JSON schema; use deterministic IDs; validate before run.
- **FR16**: **Extended fixtures**: Add fixtures for BAR creation, quest completion, move validation (creation/deletion flows).
- **FR17**: **Sandbox isolation**: When used by agents, simulator uses in-memory or isolated DB; never production.
- **FR18**: **Integration contract**: Define shared protocol with transformation-simulation-harness and npc-agent-game-loop; unified CLI subcommands or shared config.

## Implementation Paths

| Path | Purpose |
|------|---------|
| `src/features/simulation/` | Simulation feature root |
| `src/features/simulation/cli/` | CLI entry and commands |
| `src/features/simulation/core/` | Flow simulation engine |
| `src/features/simulation/actors/` | Bounded actor role definitions |
| `src/features/simulation/types/` | Shared types |
| `src/features/simulation/__tests__/` | Tests |

Adapt if project structure differs (e.g. `src/lib/simulation/`).

## Testing Requirements

- Simulator pass on Bruised Banana onboarding fixtures
- BAR lifecycle correctness (bar_created before bar_validated)
- Expected event emission
- missing_capability failure
- missing_start_node failure
- unreachable_completion failure
- Librarian only proposes allowed actions
- Collaborator cannot finalize player identity
- Witness does not emit false completion

## Constraints

**Do:**

- Prioritize deterministic flow simulation
- Support CLI without UI
- Support Bruised Banana fixtures first
- Keep simulated actors bounded and useful
- Remain compatible with flow-simulator-contract and quest-bar-flow-grammar

**Do not:**

- Build full autonomous NPC society
- Build freeform world simulation
- Build complex memory systems
- Build rich personality engines

## Implementation status

**Shipped in repo (Backlog DT, March 2026).** Engine: `src/lib/simulation/simulateFlow.ts`; CLI: `npm run simulate` → `scripts/simulate-flow.ts`; Bruised Banana fixtures under `fixtures/onboarding/bruised-banana/`; roles in `actors.ts`. See `tasks.md` (all phases complete). Future: wire `quest` / `agent` / `campaign` subcommands when transformation-simulation-harness and npc-agent-game-loop CLIs land.

## References

- [STRAND_CONSULT.md](./STRAND_CONSULT.md) — Game Master consultation; run `npm run strand:consult:dq` to refresh
- [transformation-simulation-harness](../transformation-simulation-harness/spec.md) — Quest, agent, campaign, onboarding simulation
- [npc-agent-game-loop-simulation](../npc-agent-game-loop-simulation/spec.md) — pickQuestForAgent, simulateAgentGameLoop
- [docs/architecture/flow-simulator-cli.md](../../docs/architecture/flow-simulator-cli.md)
- [docs/architecture/simulated-actor-roles.md](../../docs/architecture/simulated-actor-roles.md)
- [docs/architecture/flow-simulator-contract.md](../../docs/architecture/flow-simulator-contract.md)
- [docs/architecture/quest-bar-flow-grammar.md](../../docs/architecture/quest-bar-flow-grammar.md)
