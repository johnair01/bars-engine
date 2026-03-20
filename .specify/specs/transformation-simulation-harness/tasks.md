# Tasks: Transformation Simulation Harness v0

## Phase Quest simulation (v0 / FN)

- [x] Add `quest` subcommand to simulate script (`scripts/simulate-flow.ts`)
- [x] Implement `simulateQuest(narrative, options)` using narrative transformation + encounter geometry + move registry (`src/lib/transformation-simulation/simulateQuest.ts`)
- [x] Lock detection via existing `parseNarrative` / `runNarrativeTransformationFull`
- [x] Output: encounter_geometry, quest_template (QuestSeed), moves_selected, generated_prompts, bar_generated
- [x] Flags: `--narrative`, `--nation`, `--archetype`, `--json`, `--seed`, `--verbose`, `--log` (writes `simulation-logs/<simulation_id>.json`)
- [x] Tests: `npm run test:transformation-sim`
- [ ] Extended tests: encounter geometry ordering respects nation/archetype bias (non-zero scores infixtures)

## Phase Agent simulation

- [ ] Add `agent` subcommand
- [x] Integrate Minimal Agent Mind Model — `simulateQuestForAgent` in `src/lib/agent-mind/simulationBridge.ts`
- [ ] Full agent loop CLI: N steps, JSON log per step
- [ ] Tests: agent steps produce quest + state updates via CLI

## Phase Campaign simulation

- [ ] Add `campaign` subcommand
- [ ] Implement multi-agent simulation
- [ ] Output: quest frequency, BAR patterns, state changes, interaction events
- [ ] Tests: multiple agents run, outputs aggregated

## Phase Onboarding simulation

- [ ] Add `onboarding` subcommand
- [ ] Load flow by campaign slug (reuse `loadFlowBySlug` + flow JSON)
- [ ] Validate quest grammar, progression, required steps
- [ ] Tests: onboarding validation detects broken grammar

## Phase Logging

- [x] `simulation-logs/` directory (gitignored); JSON per quest run when `--log`
- [ ] Standardize log envelope (mode, harness_version, events) across quest/agent/campaign
