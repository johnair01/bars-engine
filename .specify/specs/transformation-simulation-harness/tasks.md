# Tasks: Transformation Simulation Harness v0

## Phase 1: Quest simulation

- [ ] Add `quest` subcommand to simulate script
- [ ] Implement `simulateQuest(narrative, options)` using transformation-move-registry, encounter-geometry, archetype-overlay
- [ ] Add heuristic lock detection / narrative parsing for deterministic mode
- [ ] Output: encounter_geometry, quest_template, moves_selected, generated_prompts, bar_generated
- [ ] Flags: `--narrative`, `--nation`, `--archetype`, `--json`, `--seed`
- [ ] Tests: valid quest seeds, encounter geometry respected, overlays applied

## Phase 2: Agent simulation

- [ ] Add `agent` subcommand
- [ ] Integrate Minimal Agent Mind Model (or stub)
- [ ] Implement agent loop: narrative → quest → action → integrate → state update
- [ ] Output per step: narrative, quest, action, BAR, state
- [ ] Tests: agent produces narrative locks, quests generated, state updates

## Phase 3: Campaign simulation

- [ ] Add `campaign` subcommand
- [ ] Implement multi-agent simulation
- [ ] Output: quest frequency, BAR patterns, state changes, interaction events
- [ ] Tests: multiple agents run, outputs aggregated

## Phase 4: Onboarding simulation

- [ ] Add `onboarding` subcommand
- [ ] Load flow by campaign slug (bruised-banana)
- [ ] Validate quest grammar, progression, required steps
- [ ] Tests: onboarding validation detects broken grammar

## Phase 5: Logging

- [ ] Create `simulation-logs/` directory
- [ ] Write structured JSON logs per run
- [ ] Log structure: events, quest_results, bars_created
