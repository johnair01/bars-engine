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

## File Impacts (implemented)

| Location | Purpose |
|----------|---------|
| `src/lib/simulation/simulateFlow.ts` | Simulation engine |
| `src/lib/simulation/types.ts` | FlowJSON, SimulationResult, inputs |
| `src/lib/simulation/actors.ts` | `getSimulatedActorRole` — Librarian, Collaborator, Witness |
| `src/lib/simulation/simulateFlowWithActors.ts` | Level-2 scaffold |
| `src/lib/simulation/proposeActorAction.ts` | Bounded proposals |
| `src/lib/simulation/validateFlowSchema.ts` | Pre-run fixture validation |
| `src/lib/simulation/integrationContract.ts` | Shared subcommand / config contract |
| `src/lib/simulation/sandbox.ts` | Agent isolation notes / helpers |
| `scripts/simulate-flow.ts` | CLI — `npm run simulate` |
| `fixtures/onboarding/bruised-banana/*.json` | BB golden paths + bar_creation / quest_completion |
| `fixtures/flows/*.json` | Orientation / handoff fixtures |
| `docs/simulation/flow-json-schema.md` | Fixture schema |
| `docs/architecture/flow-simulator-cli.md` | CLI documentation |

## Dependencies

- flow-simulator-contract (existing)
- quest-bar-flow-grammar (existing)
- orientation-golden-paths (existing)
- [STRAND_CONSULT.md](./STRAND_CONSULT.md) — run `npm run strand:consult:dq` to refresh

## Changelog

| Date | Change |
|------|--------|
| 2026-03-20 | **DT closed in repo:** tasks aligned to `src/lib/simulation/`; CLI documents `SIMULATE_SUBCOMMANDS`; simulation errors always yield exit code 1; optional `flow` subcommand on CLI. |
