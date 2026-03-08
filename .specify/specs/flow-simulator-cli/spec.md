# Spec: Flow Simulator CLI + Bounded Simulated Actor Roles

## Purpose

Add a lightweight simulation environment for quest flows and onboarding flows, with optional support for bounded simulated actor roles. Supports fixture validation, onboarding debugging, quest execution testing, and event/state inspection. Lays groundwork for future single-player mode with simulated collaborators.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Simulation scope | Level 1 (flow) implemented; Level 2 (actors) lightly scaffolded; Level 3 (world) not built |
| CLI entry | `bars simulate` or `npm run simulate` (adapt to project conventions) |
| Determinism | All flow simulation deterministic; no non-deterministic branching in v1 |
| Actor roles | Librarian, Collaborator, Witness — bounded, useful before dramatic |

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

## References

- [docs/architecture/flow-simulator-cli.md](../../docs/architecture/flow-simulator-cli.md)
- [docs/architecture/simulated-actor-roles.md](../../docs/architecture/simulated-actor-roles.md)
- [docs/architecture/flow-simulator-contract.md](../../docs/architecture/flow-simulator-contract.md)
- [docs/architecture/quest-bar-flow-grammar.md](../../docs/architecture/quest-bar-flow-grammar.md)
