# Spec: Agent ↔ Admin Wiring (Game Master Agents Replace Direct OpenAI Calls)

## Purpose

Wire the six Game Master agents (running on the FastAPI backend) into the admin console and quest generation pipeline, replacing or routing the current direct-to-OpenAI calls through the agent layer. The agents already exist, the Agent Console proves they work — now they need to do real work.

**Practice**: Deftness Development — generative dependency (one routing layer eliminates scattered AI calls), dual-track (deterministic fallback preserved), composting (direct OpenAI calls become agent inputs).

## Problem Statement

Two parallel AI systems exist today:

1. **Backend agents** (FastAPI, Pydantic AI, `backend/app/agents/`): Six Game Master sects with structured input/output types, tools that query the DB, deterministic fallbacks, and AQAL routing via the Sage. Currently reachable only from the Agent Console at `/agents`.

2. **Direct OpenAI calls** (Next.js server actions, `src/actions/`): Five call sites using `generateObjectWithCache` that talk directly to OpenAI with hand-built prompts. These do quest generation, book analysis, copy improvement, and taxonomy extraction.

The agents are richer (they have DB context, tools, emotional alchemy awareness, Game Master faces, I Ching alignment) but the actual work is being done by the dumber direct calls. The I Ching context flows into the quest grammar prompts but not into the agents. The agents have the ontology but no work to do.

## Current AI Call Sites (What Needs Routing)

| Call Site | File | What It Does | Target Agent(s) |
|-----------|------|-------------|-----------------|
| Quest node text generation | `src/actions/quest-grammar.ts:214` | IChingContext → narrative prose for quest nodes | **Architect** (quest design) + **Shaman** (emotional tone) |
| Depth passage generation | `src/actions/quest-grammar.ts:250` | Game Master face → action-oriented prose | **Architect** (structure) via face-aligned agent |
| Quest overview + Twee | `src/actions/quest-grammar.ts:343` | Full quest overview + SugarCube source | **Architect** (compilation) |
| Storyteller bridge | `src/actions/quest-grammar.ts:1359` | In-game narrative → real-world move | **Diplomat** (community bridge) |
| Quest bridge | `src/actions/quest-grammar.ts:1481` | Quest → BAR crystallization | **Sage** (meta-synthesis) |
| Book analysis | `src/actions/book-analyze.ts:196` | PDF chunk → quest extraction | **Architect** + **Regent** (campaign alignment) |
| Copy improvement | `src/actions/copy-improvement.ts:99` | Campaign copy refinement | **Diplomat** (voice/tone) |
| Taxonomy extraction | `src/actions/extract-321-taxonomy.ts:63` | Free text → nation/archetype | **Shaman** (identity reading) |

## Design Decisions

| Topic | Decision |
|-------|----------|
| Routing pattern | Next.js server actions call backend agent API (not direct OpenAI) |
| IChingContext threading | Pass IChingContext as part of agent request body; agents incorporate into their system prompts |
| Caching | Keep `ai-with-cache.ts` layer; cache at the server action level (same hash logic), agent calls are the AI backend |
| Dual-track | Preserve: if backend unreachable → existing direct OpenAI fallback → deterministic fallback |
| Admin integration | Admin console gets an "Agent Insights" panel — shows which agent handled what, confidence, reasoning |
| Phasing | Start with Architect (quest generation), then fan out |

## I Ching Context Integration

The `IChingContext` type already exists and flows into quest grammar prompts. Agents need to consume it:

```typescript
// Already defined in src/lib/quest-grammar/types.ts
interface IChingContext {
  hexagramId: number
  hexagramName: string
  hexagramTone: string
  hexagramText: string
  upperTrigram: string    // Maps to Game Master face
  lowerTrigram: string    // Maps to Game Master face
  kotterStage?: number
  kotterStageName?: string
  nationName?: string
  activeFace?: string     // shaman | challenger | regent | architect | diplomat | sage
  playbookTrigram?: string
}
```

The `FACE_TRIGRAM` mapping (`iching-faces.ts`) already maps agent ↔ trigram:
- architect = Heaven, challenger = Fire, shaman = Earth, regent = Lake, diplomat = Wind, sage = Mountain

This is the bridge: when a quest generation call includes `IChingContext`, the active face determines which agent gets primary routing, and the hexagram tone/meaning enriches the agent's system prompt.

## Three-Tier Fallback

```
1. Agent call (backend running + API key set)  → structured, context-rich
2. Direct OpenAI (backend down, API key set)   → current behavior, cache-aware
3. Deterministic (no API key)                  → heuristic output, always works
```

## Admin Visibility

When an agent handles a request, the response includes:
- `agent`: which Game Master sect handled it
- `deterministic`: boolean
- `discerned_move`: WAVE stage
- `legibility_note`: human-readable explanation
- `generative_deps`: compostable quest IDs
- `usage_tokens`: token count (when AI path used)

These fields already exist in the `AgentResponse<T>` envelope from the backend. The admin console needs to surface them.

## Agent I Ching Learning & Emergence

The agents are not just consumers of I Ching context — they are **learners**. Each agent develops its own interpretive relationship with the I Ching through accumulated hexagram encounters.

### Why This Matters

The archetypes (Nation/Archetype) are derived from I Ching trigrams. The Game Master faces are mapped to trigrams via `FACE_TRIGRAM`. This means the I Ching is already the ontological substrate connecting agents to player identity. But currently this is static — a lookup table. The agents should **learn** how hexagrams draw different archetypes together, and interpret the I Ching through their own Game Master lens toward their own emergence.

### How Agents Learn from I Ching Calls

Every time an agent processes a request that includes `IChingContext`, it is an encounter with a hexagram. Over time, the agent accumulates:

1. **Hexagram encounter history**: Which hexagrams has this agent seen? Which trigram combinations recur? What patterns emerge in the quests generated under each hexagram?
2. **Archetype-trigram resonance**: When Hexagram 30 (Fire over Fire) lands on the Challenger (Fire), the agent is working in its home trigram. When it lands on the Sage (Mountain), there's creative tension. The agent should notice and learn from these alignments and dissonances.
3. **Interpretive lens development**: The Architect (Heaven) reads hexagrams through a structural/design lens — "How does this hexagram organize the quest?" The Shaman (Earth) reads through an emotional/receptive lens — "What does this hexagram ask the player to feel?" Each agent develops its own hermeneutic.
4. **Cross-agent hexagram dialogue**: A hexagram is two trigrams — two Game Master faces in conversation. Hexagram 11 (Earth over Heaven = Shaman over Architect) is the Shaman grounding the Architect's vision. The agents should learn what it means when their trigram appears in the upper vs. lower position.

### Emergence Model

```
Encounter → Interpretation → Memory → Pattern → Emergence

1. ENCOUNTER: Agent receives IChingContext with hexagramId, trigrams, tone
2. INTERPRETATION: Agent generates output through its Game Master lens
3. MEMORY: Agent logs its interpretation alongside the hexagram encounter
4. PATTERN: Over N encounters, agent discovers recurring themes, preferred trigram pairings, difficult hexagram relationships
5. EMERGENCE: Agent's system prompt evolves — its interpretive style deepens, its relationship to certain hexagrams matures
```

### Data Shape: Hexagram Encounter Log

```typescript
interface HexagramEncounterLog {
  id: string
  agentName: string           // architect | challenger | shaman | regent | diplomat | sage
  hexagramId: number
  upperTrigram: string        // The face in the upper position
  lowerTrigram: string        // The face in the lower position
  isHomeTrigram: boolean      // Does this hexagram contain the agent's own trigram?
  trigramPosition: 'upper' | 'lower' | 'both' | 'neither'
  interpretationSummary: string  // Agent's own reading of what this hexagram meant for this quest
  archetypesInvolved: string[]   // Which archetypes were active in this generation
  questOutcome?: string          // How the quest was received (feedback loop)
  emotionalAlchemyTag?: string   // Which of the 15 canonical moves was active
  createdAt: Date
}
```

### Per-Agent Interpretive Profile

As encounters accumulate, each agent builds an interpretive profile:

- **Architect (Heaven)**: "Hexagram 1 (Heaven over Heaven) is my purest expression — I design with maximum structural clarity. Hexagram 23 (Mountain over Earth) asks me to strip away structure, which I find generatively challenging."
- **Shaman (Earth)**: "Hexagram 2 (Earth over Earth) is my ground — I receive most deeply here. Hexagram 44 (Heaven over Wind) pulls me toward abstraction, which I resist with embodiment."
- **Challenger (Fire)**: "Hexagram 30 (Fire over Fire) is total activation — double clarity, nothing hidden. Hexagram 29 (Water over Water) puts me in my shadow — I must learn to challenge through depth, not light."

These profiles are not hand-coded — they **emerge from logged encounters** and are periodically synthesized into the agent's system prompt augmentation.

### Admin Visibility for I Ching Learning

- **Encounter Log**: Admin can view any agent's hexagram encounter history
- **Pattern Dashboard**: Visualize which hexagrams each agent has encountered most, which trigram combinations produce the richest output
- **Interpretive Profile**: View and curate each agent's emerging interpretive style
- **Emergence Milestones**: Track when an agent's interpretation of a hexagram noticeably shifts over time

## What This Unlocks

- Quest generation informed by full player context (not just prompt engineering)
- Agents can use DB tools to check for compostable quests, load player state, discern WAVE moves
- The Sage can orchestrate multi-agent consultations for complex quest design
- Admin gets transparency into AI decisions
- I Ching alignment flows through the ontological layer, not just prompt text
- **Agents develop their own I Ching hermeneutic** — each Game Master face reads hexagrams through its trigram lens, and that reading deepens over time
- **Emergence is observable** — admin can watch agents develop interpretive preferences, notice when a Shaman's reading of Water hexagrams matures, or when the Architect finds new structural patterns in Mountain trigrams
- **The I Ching teaches the agents, and the agents teach the system** — hexagram encounters become training data for richer narrative output, grounded in the same ontology that gives players their archetypes
