# Plan: Flow Simulator CLI + Bounded Simulated Actor Roles

## Summary

Implement a CLI tool for simulating quest flows and fixtures; add Bruised Banana onboarding fixtures; lightly scaffold bounded actor roles (Librarian, Collaborator, Witness).

## Phases

### Phase 1: Flow simulator core

- Create `src/features/simulation/` (or `src/lib/simulation/` if preferred).
- Implement `simulateFlow(flow, context)` per flow-simulator-contract.
- CLI entry: `bars simulate` or `npm run simulate` via a script (e.g. `scripts/simulate-flow.ts`).
- Parse flow JSON; validate start node; traverse; execute actions; evaluate conditions; update state; emit events.
- Output: SimulationResult (status, visited_nodes, events_emitted, etc.).
- Flags: `--verbose`, `--json`, `--actor <id>`.

### Phase 2: Bruised Banana fixtures

- Create `fixtures/onboarding/bruised-banana/` with:
  - `campaign_intro.json`
  - `identity_selection.json`
  - `intended_impact_bar.json`
- Align with orientation-golden-paths and flow-simulator-contract fixture format.
- Ensure all three simulate to pass.

### Phase 3: Bounded actor scaffold

- Define role contracts (Librarian, Collaborator, Witness) in types.
- Implement `getSimulatedActorRole(roleId)`.
- Add `simulateFlowWithActors` and `proposeActorAction` signatures (minimal or stub).
- No full actor execution in v1.

### Phase 4: Tests

- Test: Bruised Banana fixtures pass.
- Test: BAR lifecycle (bar_created before bar_validated).
- Test: Failure cases (missing_start_node, unreachable_completion, etc.).
- Test: Bounded actor role constraints.

## File Impacts

| File | Action |
|------|--------|
| `src/features/simulation/core/simulateFlow.ts` | New — simulation engine |
| `src/features/simulation/cli/index.ts` | New — CLI entry |
| `src/features/simulation/actors/roles.ts` | New — role definitions |
| `src/features/simulation/types/index.ts` | New — shared types |
| `fixtures/onboarding/bruised-banana/*.json` | New — fixtures |
| `scripts/simulate-flow.ts` | New — CLI script |
| `package.json` | Add `simulate` script |

## Dependencies

- flow-simulator-contract (existing)
- quest-bar-flow-grammar (existing)
- orientation-golden-paths (existing)
