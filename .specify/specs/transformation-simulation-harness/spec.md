# Spec: Transformation Simulation Harness v0

## Purpose

Provide a lightweight simulation environment for testing the transformation engine without requiring a live UI or human player. Developers can simulate quests, agents, campaigns, and onboarding flows using existing engine systems. Focus on developer tooling and deterministic testing.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Scope | Quest, agent, campaign, onboarding simulation modes |
| CLI entry | `bars simulate` with subcommands |
| Determinism | Seeded; no non-deterministic branching in v1 |
| Integration | Reuse transformation-move-registry, encounter-geometry, archetype-overlay, flow-simulator |
| Logging | Structured JSON logs in `/simulation-logs/` |

## Conceptual Model

| Concept | Meaning |
|---------|---------|
| **Quest simulation** | Narrative → full transformation pipeline → quest seed + BAR opportunities |
| **Agent simulation** | Single agent loop: narrative → quest → action → integrate → state update |
| **Campaign simulation** | Multiple agents over time; quest frequency, BAR patterns, state changes |
| **Onboarding simulation** | Flow validation; quest grammar; progression; required steps |

## Simulation Pipeline

The harness simulates the full transformation pipeline:

```
Narrative
→ Lock Detection
→ Encounter Geometry
→ Quest Template
→ Transformation Move Selection
→ Nation Overlay
→ Archetype Overlay
→ Quest Seed
→ Agent Action
→ Integration / BAR
```

Each step produces structured output for inspection.

## API Contracts

### SimulationConfig

```ts
interface SimulationConfig {
  simulation_id: string
  narrative_input: string
  agent_id?: string
  nation?: string
  archetype?: string
  quest_template?: string
  iterations?: number
  seed?: number
}
```

### SimulationResult

```ts
interface SimulationResult {
  encounter_geometry: Record<string, unknown>
  quest_template: Record<string, unknown>
  moves_selected: string[]
  generated_prompts: Record<string, string>
  agent_actions?: unknown[]
  bar_generated?: Record<string, unknown>
  state_changes?: Record<string, unknown>
}
```

### simulateQuest(narrative, options?)

**Input**: `narrative: string`, `options?: { nation?, archetype?, seed? }`  
**Output**: `SimulationResult` with encounter geometry, quest template, moves, prompts, BAR opportunities.

### simulateAgent(config)

**Input**: `SimulationConfig` with agent_id, narrative_input, iterations.  
**Output**: Agent loop results: narrative → quest → action → BAR → updated state.

### simulateCampaign(config)

**Input**: `SimulationConfig` with agents count, steps.  
**Output**: Quest frequency, BAR creation patterns, agent state changes, interaction events.

### simulateOnboarding(campaignSlug)

**Input**: `campaignSlug: string` (e.g. `bruised-banana`).  
**Output**: Validation report: quests grammatical, progression valid, required steps exist.

## CLI Interface

### Command

```
bars simulate
```

### Subcommands

| Subcommand | Purpose |
|-----------|---------|
| `bars simulate quest` | Generate quest from narrative; inspect transformation pipeline |
| `bars simulate agent` | Simulate single agent over N steps |
| `bars simulate campaign` | Simulate multiple agents over time |
| `bars simulate onboarding` | Validate onboarding flow (e.g. bruised-banana) |

### Examples

```bash
bars simulate quest --narrative "I am afraid of failing"
bars simulate quest --narrative "I'm overwhelmed by work"
bars simulate agent --steps 10
bars simulate campaign --agents 5 --steps 50
bars simulate onboarding --campaign bruised-banana
```

### Output

- Human-readable: lock type, encounter geometry, quest template, moves, generated quest, BAR opportunities.
- Machine-readable: `--json` flag for structured output.

## Simulation Modes

### Quest Mode

- **Command**: `bars simulate quest`
- **Output**: lock type, encounter geometry, quest template, transformation moves, generated quest, BAR opportunities.

### Agent Mode

- **Command**: `bars simulate agent`
- **Output**: agent narrative, generated quest, agent decision, resulting BAR, updated state.

### Campaign Mode

- **Command**: `bars simulate campaign`
- **Output**: quest generation frequency, BAR creation patterns, agent state changes, interaction events.

### Onboarding Mode

- **Command**: `bars simulate onboarding`
- **Output**: quest grammar validation, progression validity, required steps present.

## Logging

Simulation runs write logs to:

```
/simulation-logs/
  run_001.json
  run_002.json
```

Log structure:

```json
{
  "simulation_id": "string",
  "events": [],
  "quest_results": [],
  "bars_created": []
}
```

## Functional Requirements

### Phase 1: Quest simulation

- **FR1**: `bars simulate quest --narrative "<text>"` runs full pipeline.
- **FR2**: Output includes encounter_geometry, quest_template, moves_selected, generated_prompts, bar_generated.
- **FR3**: `--nation`, `--archetype`, `--json` flags supported.
- **FR4**: Deterministic when `--seed` provided.

### Phase 2: Agent simulation

- **FR5**: `bars simulate agent --steps N` runs agent loop N times.
- **FR6**: Agent uses Minimal Agent Mind Model (or stub) for decisions.
- **FR7**: Output shows narrative → quest → action → BAR → state update per step.

### Phase 3: Campaign simulation

- **FR8**: `bars simulate campaign --agents N --steps M` runs N agents for M steps.
- **FR9**: Output includes quest frequency, BAR patterns, state changes, interaction events.

### Phase 4: Onboarding simulation

- **FR10**: `bars simulate onboarding --campaign bruised-banana` validates flow.
- **FR11**: Confirms quests grammatical, progression valid, required steps exist.

### Phase 5: Logging

- **FR12**: Writes structured logs to `simulation-logs/`.
- **FR13**: Logs include events, quest_results, bars_created.

## Testing Requirements

- Simulation produces valid quest seeds.
- Encounter geometry is respected.
- Move registry integration works.
- Nation and archetype overlays apply correctly.
- Deterministic output with same seed.
- Onboarding validation detects broken grammar.

## Constraints

**Do:**

- Remain independent of UI.
- Run deterministically when seeded.
- Support inspection and debugging.
- Reuse transformation-move-registry, encounter-geometry, archetype-overlay, flow-simulator.

**Do not:**

- Use heavy AI reasoning inside simulation.
- Build complex world state management.
- Duplicate transformation logic.

**Favor:**

- Simple loops.
- Clear outputs.
- Debug visibility.

## Dependencies

- [flow-simulator-cli](../flow-simulator-cli/spec.md)
- [transformation-move-registry](../transformation-move-registry/spec.md)
- [transformation-encounter-geometry](../transformation-encounter-geometry/spec.md)
- [archetype-influence-overlay](../archetype-influence-overlay/spec.md)
- [minimal-agent-mind-model](../minimal-agent-mind-model/spec.md) (Phase 2+)

## References

- [src/lib/simulation/](../../src/lib/simulation/)
- [src/lib/transformation-move-registry/](../../src/lib/transformation-move-registry/)
- [src/lib/transformation-encounter-geometry/](../../src/lib/transformation-encounter-geometry/)
- [scripts/simulate-flow.ts](../../scripts/simulate-flow.ts)
