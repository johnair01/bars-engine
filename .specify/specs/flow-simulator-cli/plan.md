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

### Phase 5: Agent-oriented extensions (from STRAND_CONSULT)

- **Replay capability**: SimulationResult includes full `events_emitted` sequence; agents can assert on event order and presence.
- **Deterministic seed**: All simulations accept optional `seed`; same seed + same flow → same result.
- **Fixture schema contract**: Document flow JSON schema; use deterministic IDs; validate before run.
- **Extended fixtures**: Add fixtures for BAR creation, quest completion, move validation (creation/deletion flows).
- **Sandbox isolation**: When used by agents, simulator uses in-memory or isolated DB; never production.
- **Integration contract**: Define shared protocol with transformation-simulation-harness and npc-agent-game-loop; unified CLI subcommands or shared config.

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
| `docs/simulation/flow-json-schema.md` | New (Phase 5) — fixture schema contract |
| `fixtures/onboarding/bruised-banana/bar_creation.json` | New (Phase 5) — BAR creation flow |
| `fixtures/onboarding/bruised-banana/quest_completion.json` | New (Phase 5) — quest completion flow |
| `src/lib/simulation/sandbox.ts` | New (Phase 5) — sandbox isolation for agents |

## Dependencies

- flow-simulator-contract (existing)
- quest-bar-flow-grammar (existing)
- orientation-golden-paths (existing)
- [STRAND_CONSULT.md](./STRAND_CONSULT.md) — run `npm run strand:consult:dq` to refresh
