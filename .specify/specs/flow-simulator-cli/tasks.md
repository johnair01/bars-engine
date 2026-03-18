# Tasks: Flow Simulator CLI + Bounded Simulated Actor Roles

## Phase 1: Flow simulator core

- [ ] Create src/features/simulation/ directory structure
- [ ] Implement simulateFlow(flow, context) with node traversal
- [ ] Implement action execution and capability checks
- [ ] Implement condition evaluation and state updates
- [ ] Implement event emission and completion detection
- [ ] Add failure detection (missing_start_node, invalid_transition, etc.)
- [ ] Create CLI script (scripts/simulate-flow.ts or similar)
- [ ] Add --verbose, --json, --actor flags
- [ ] Add npm run simulate script to package.json

## Phase 2: Bruised Banana fixtures

- [ ] Create fixtures/onboarding/bruised-banana/campaign_intro.json
- [ ] Create fixtures/onboarding/bruised-banana/identity_selection.json
- [ ] Create fixtures/onboarding/bruised-banana/intended_impact_bar.json
- [ ] Verify all three simulate to pass

## Phase 3: Bounded actor scaffold

- [ ] Define Librarian, Collaborator, Witness role contracts
- [ ] Implement getSimulatedActorRole(roleId)
- [ ] Add simulateFlowWithActors and proposeActorAction stubs/signatures

## Phase 4: Tests

- [ ] Test: Bruised Banana fixtures pass
- [ ] Test: BAR lifecycle correctness
- [ ] Test: missing_start_node failure
- [ ] Test: unreachable_completion failure
- [ ] Test: required_capability_missing failure
- [ ] Test: Librarian only proposes allowed actions
- [ ] Test: Witness does not emit false completion
- [ ] npm run build and npm run check

## Phase 5: Agent-oriented extensions (from STRAND_CONSULT)

- [x] Add optional `seed` param to simulateFlow; document deterministic behavior
- [x] Ensure SimulationResult includes full `events_emitted` sequence for agent assertions
- [x] Document flow JSON schema (docs/simulation/flow-json-schema.md)
- [x] Add deterministic IDs to existing fixtures; validate fixture schema before run
- [x] Add fixtures: bar_creation.json, quest_completion.json (creation/deletion flows)
- [x] Implement sandbox isolation (in-memory or isolated DB) for agent runs
- [x] Define integration contract with transformation-simulation-harness and npc-agent-game-loop
- [x] Add unified CLI subcommands or shared config for cross-tool interoperability
