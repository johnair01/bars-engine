# Plan: Transformation Simulation Harness v0

## Summary

Implement a CLI-based simulation harness for the transformation engine. Four modes: quest, agent, campaign, onboarding. Reuses existing transformation systems; no UI required.

## Phases

### Phase 1: Quest simulation

- Extend `bars simulate` (or `npm run simulate`) with `quest` subcommand.
- Implement `simulateQuest(narrative, options)` that runs: narrative → lock detection → encounter geometry → quest template → move selection → nation overlay → archetype overlay → quest seed.
- Output: encounter_geometry, quest_template, moves_selected, generated_prompts, bar_generated.
- Flags: `--narrative`, `--nation`, `--archetype`, `--json`, `--seed`.
- Heuristic lock detection and narrative parsing for deterministic mode (or accept pre-parsed narrative).

### Phase 2: Agent simulation

- Add `agent` subcommand: `bars simulate agent --steps N`.
- Integrate Minimal Agent Mind Model (or stub).
- Loop: detect narrative lock → request quest → execute move → integrate → update state.
- Output per step: narrative, quest, action, BAR, state.

### Phase 3: Campaign simulation

- Add `campaign` subcommand: `bars simulate campaign --agents N --steps M`.
- Spawn N agents; run M steps; aggregate outputs.
- Output: quest frequency, BAR patterns, state changes, interaction events.

### Phase 4: Onboarding simulation

- Add `onboarding` subcommand: `bars simulate onboarding --campaign bruised-banana`.
- Load flow; validate quest grammar; check progression; verify required steps.
- Reuse flow-simulator and fixtures.

### Phase 5: Logging

- Create `simulation-logs/` directory.
- Write structured JSON logs per run.
- Include events, quest_results, bars_created.

## File Impacts

| File | Action |
|------|--------|
| `scripts/simulate-flow.ts` | `quest` subcommand (+ existing flow / validate) |
| `src/lib/transformation-simulation/simulateQuest.ts` | Quest pipeline simulation |
| `src/lib/transformation-simulation/index.ts` | Public exports |
| `simulation-logs/` | JSON logs when `--log` (gitignored) |
| `package.json` | `test:transformation-sim` |

Future: `simulateAgent` / `simulateCampaign` / `simulateOnboarding` modules + CLI wiring.

## Dependencies

- flow-simulator-cli (existing)
- transformation-move-registry (existing)
- transformation-encounter-geometry (existing)
- archetype-influence-overlay (existing)
- narrative-transformation-engine (existing)
- minimal-agent-mind-model (agent bridge: `simulateQuestForAgent`)

## Changelog

| Date | Change |
|------|--------|
| 2026-03-20 | **Phase quest v0:** `simulateQuest`, CLI `quest`, `simulation-logs`, tests. |

