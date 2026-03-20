# Tasks: Flow Simulator CLI + Bounded Simulated Actor Roles

## Phase 1: Flow simulator core

- [x] Simulation lives in `src/lib/simulation/` (see `simulateFlow.ts`, `types.ts`, `validateFlowSchema.ts`)
- [x] Implement simulateFlow(flow, context) with node traversal
- [x] Implement action execution and capability checks
- [x] Implement condition evaluation and state updates
- [x] Implement event emission and completion detection
- [x] Add failure detection (missing_start_node, invalid_transition, etc.)
- [x] Create CLI script `scripts/simulate-flow.ts`
- [x] Add --verbose, --json, --actor flags; optional `flow` subcommand for unified CLI ergonomics
- [x] Add `npm run simulate` script to package.json

## Phase 2: Bruised Banana fixtures

- [x] Create `fixtures/onboarding/bruised-banana/campaign_intro.json`
- [x] Create `fixtures/onboarding/bruised-banana/identity_selection.json`
- [x] Create `fixtures/onboarding/bruised-banana/intended_impact_bar.json`
- [x] Verify all three simulate to pass (`npm run test:simulation`)

## Phase 3: Bounded actor scaffold

- [x] Define Librarian, Collaborator, Witness role contracts (`src/lib/simulation/actors.ts`)
- [x] Implement getSimulatedActorRole(roleId)
- [x] Add simulateFlowWithActors and proposeActorAction (`simulateFlowWithActors.ts`, `proposeActorAction.ts`)

## Phase 4: Tests

- [x] Test: Bruised Banana fixtures pass
- [x] Test: BAR lifecycle correctness (`orientation_bar_create`, `bar_creation.json`)
- [x] Test: missing_start_node failure
- [x] Test: unreachable_completion failure
- [x] Test: required_capability_missing failure (`testWitnessCannotCreateBar`)
- [x] Test: Librarian only proposes allowed actions
- [x] Test: Witness constraints (`testWitnessNeverEmitsCompletion`)
- [x] Run `npm run build` and `npm run check` when touching app code (simulation lib is Node-safe)

## Phase 5: Agent-oriented extensions (from STRAND_CONSULT)

- [x] Add optional `seed` param to simulateFlow; document deterministic behavior
- [x] Ensure SimulationResult includes full `events_emitted` sequence for agent assertions
- [x] Document flow JSON schema (docs/simulation/flow-json-schema.md)
- [x] Add deterministic IDs to existing fixtures; validate fixture schema before run
- [x] Add fixtures: bar_creation.json, quest_completion.json (creation/deletion flows)
- [x] Implement sandbox isolation (in-memory or isolated DB) for agent runs
- [x] Define integration contract with transformation-simulation-harness and npc-agent-game-loop
- [x] Add unified CLI subcommands or shared config for cross-tool interoperability (`integrationContract.ts`, CLI lists `SIMULATE_SUBCOMMANDS`)
