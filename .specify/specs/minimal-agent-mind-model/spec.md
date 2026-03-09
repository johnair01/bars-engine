# Spec: Minimal Agent Mind Model v0

## Purpose

Define the minimal internal state required for simulated agents to behave coherently in the Bars-engine transformation system. Agents may represent NPCs, simulated players, testing agents, or story characters. The model is minimal but sufficient to produce believable behavior.

**Practice**: Deftness Development — small state models, clear decision rules, inspectable behavior.

## Design Decisions

| Topic | Decision |
|-------|----------|
| State size | Six core variables; no complex psychology |
| Decision logic | Simple heuristics; no heavy AI reasoning |
| Integration | Same quest pipeline as players |
| Extensibility | Inspectable; easy to extend for testing |

## Agent Mind Model

### Agent State Schema

```ts
interface AgentMindState {
  agent_id: string
  nation: string
  archetype: string
  goal: string
  narrative_lock: string
  emotional_state: 'fear' | 'anger' | 'sadness' | 'neutrality' | 'joy'
  energy: number  // 0.0 – 1.0
  bars: unknown[]
}
```

### Core Variables

| Variable | Meaning | Example |
|----------|---------|---------|
| **nation** | Emotional transformation style | Argyra, Pyrakanth, Lamenth, Meridia, Virelune |
| **archetype** | Agency pattern | Bold Heart, Danger Walker, Truth Seer, Still Point, Subtle Influence, Devoted Guardian, Decisive Storm, Joyful Connector |
| **goal** | Current intention | build a project, form a relationship, solve a problem, explore an idea |
| **narrative_lock** | Current obstacle; feeds transformation engine | "I'm afraid people won't like my work", "I don't know where to start", "I feel overwhelmed" |
| **emotional_state** | Current emotional channel; affects nation weighting | fear, anger, sadness, neutrality, joy |
| **energy** | Capacity for action (0.0–1.0) | Low → reflection quests; High → action quests |

## Agent Decision Loop

1. Detect narrative lock
2. Request quest (via transformation pipeline)
3. Execute move
4. Integrate result
5. Update state

### Example Flow

```
Agent narrative: "I'm afraid to share my idea"
Quest generated: Courage Experiment
Agent action: share idea with one person
Integration: create BAR
Narrative updated
```

## Narrative Generation

Agents periodically generate new narrative locks. Triggers:

- goal conflict
- low energy
- failed experiment
- social interaction

### Example Generation

```
Goal: build project
Failure: experiment failed
New narrative: "Maybe I'm not good at this"
```

## Quest Interaction

Agents interact with quests as follows:

1. Accept quest
2. Attempt experiment
3. Evaluate outcome
4. Mint BAR if insight gained
5. Update narrative

## Agent Interaction (Optional)

Agents may interact with other agents. Examples:

- Joyful Connector invites collaboration
- Devoted Guardian offers support
- Decisive Storm challenges assumption

Interactions can produce new narrative locks.

## Example Agent

```json
{
  "agent_id": "juniper",
  "nation": "Virelune",
  "archetype": "Joyful Connector",
  "goal": "create community event",
  "narrative_lock": "Nobody will come",
  "emotional_state": "fear",
  "energy": 0.6
}
```

**Simulation result:**

- Quest: Courage Experiment
- Action: invite three people
- Result: one person responds
- BAR minted
- Narrative updated

## API Contracts

### createAgent(config)

**Input**: `{ agent_id, nation, archetype, goal?, narrative_lock?, emotional_state?, energy? }`  
**Output**: `AgentMindState`

### updateAgentNarrative(agent, newLock)

**Input**: `agent: AgentMindState`, `newLock: string`  
**Output**: Updated `AgentMindState`

### selectAgentAction(agent, questSeed)

**Input**: `agent: AgentMindState`, `questSeed: QuestSeed`  
**Output**: `{ action: string, outcome?: string }` — heuristic selection based on archetype, energy, quest stage.

### integrateAgentResult(agent, questResult, barCreated?)

**Input**: `agent`, `questResult`, `barCreated?: boolean`  
**Output**: Updated `AgentMindState` (energy, narrative_lock, bars).

## Functional Requirements

- **FR1**: `AgentMindState` type with all six core variables.
- **FR2**: `createAgent(config)` returns initialized state.
- **FR3**: `updateAgentNarrative(agent, newLock)` updates narrative_lock.
- **FR4**: `selectAgentAction(agent, questSeed)` returns heuristic action.
- **FR5**: `integrateAgentResult(agent, result, barCreated)` updates state.
- **FR6**: Narrative generation triggers (goal conflict, low energy, failed experiment) produce new locks.
- **FR7**: Agents request quests through same pipeline as players (transformation-move-registry, archetype-overlay).

## Testing Requirements

- Agents generate narrative locks.
- Quests generated correctly from agent narrative.
- Agent actions update state.
- BAR creation works.
- Agents evolve over simulation runs.

## Constraints

**Do not:**

- Implement full personality simulation.
- Build complex AI reasoning systems.

**Favor:**

- Small state models.
- Clear decision rules.
- Inspectable behavior.

## Integration Points

The agent mind model integrates with:

- Transformation Simulation Harness
- Quest Templates
- Transformation Move Registry
- Nation Profiles
- Archetype Overlay

Agents request quests through the same pipeline used by players.

## Dependencies

- [transformation-move-registry](../transformation-move-registry/spec.md)
- [archetype-influence-overlay](../archetype-influence-overlay/spec.md)
- [canonical-archetypes](../../src/lib/canonical-archetypes.ts)
- [game/nations](../../src/lib/game/nations.ts)

## References

- [src/lib/simulation/actors.ts](../../src/lib/simulation/actors.ts) — bounded actor roles
- [src/lib/canonical-archetypes.ts](../../src/lib/canonical-archetypes.ts)
- [docs/handbook/nations/](../../docs/handbook/nations/)
