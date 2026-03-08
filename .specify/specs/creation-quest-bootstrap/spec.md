# Spec: Creation Quest Bootstrap

## Purpose

Implement creation quest generation via a bootstrap loop — rules-first runtime with AI fallback. API-first contracts before UI. Resolves the tension between heuristics (deterministic but costly to design) and AI (higher quality but more tokens).

**Problem**: Heuristics are deterministic and cheap at runtime but expensive to design and maintain. AI yields higher quality output but consumes tokens and is non-deterministic. The bootstrap loop uses AI to generate examples, derives rules from patterns, then runs rules-first at runtime with AI as fallback.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Conceptual Model

| Layer | Goal | Examples |
|-------|------|----------|
| **Deterministic** | Rules first; AI only when needed | Heuristic intent extraction, template matching |
| **Bootstrap** | AI generates examples → analyze → derive rules | Store (intent, steps); analyze patterns; encode heuristics |
| **Observability** | Log for tuning | intentConfidence, heuristicVsAi, templateMatched |

## API Contracts

### extractCreationIntent

**Input**: User answers (e.g., unpacking answers, creation prompts)  
**Output**: `CreationIntent` — structured intent with confidence

```ts
type CreationIntent = {
  creationType: string
  domain?: string
  targetState?: string
  constraints?: string[]
  confidence: number
}

function extractCreationIntent(answers: Record<string, unknown>): CreationIntent
```

- Rules-based extraction when patterns are clear; AI fallback when ambiguous.
- Returns `confidence` for downstream routing (rules vs AI).

### generateCreationQuest

**Input**: `CreationIntent`, context (segment, campaign, etc.)  
**Output**: `CreationQuestPacket` — quest steps, nodes, metadata

```ts
type CreationQuestPacket = {
  nodes: QuestNode[]
  signature?: string
  segmentVariant?: string
  heuristicVsAi: 'heuristic' | 'ai'
  templateMatched?: string
}

function generateCreationQuest(intent: CreationIntent, context: CreationContext): Promise<CreationQuestPacket>
```

- Rules-first: match templates/heuristics; fill slots.
- AI fallback when heuristic confidence < threshold or no template matches.

### assembleArtifact

**Input**: `creationType`, assembled inputs (nodes, metadata)  
**Output**: Artifact (e.g., Passage records, Twine export)

```ts
function assembleArtifact(creationType: string, inputs: AssembleInputs): Artifact
```

- Deterministic assembly; no AI.

## Implementation Modes

| Path | Description | Pros | Cons |
|------|-------------|------|------|
| **A: Heuristic-First** | Rules only; no AI | Deterministic, cheap | Costly to design; brittle |
| **B: AI-First** | AI for all generation | High quality | Tokens, non-deterministic |
| **C: Bootstrap Loop** (recommended) | AI generates examples → derive rules → rules-first runtime + AI fallback | Best of both | Requires bootstrap pipeline |

**Recommendation**: Path C — Bootstrap Loop. Use AI to bootstrap heuristics; run rules-first at runtime.

## Deftness Principles

- **Deterministic over AI**: Prefer rules when confidence is sufficient.
- **Cache**: Cache AI outputs where input is stable (per [AI Deftness Strategy](../ai-deftness-token-strategy/spec.md)).
- **Pre-filter**: Skip AI when heuristics clearly apply.
- **Control plane**: Feature flags, token budgets, graceful degradation.
- **Observability**: Log `intentConfidence`, `heuristicVsAi`, `templateMatched` for tuning.

## User Stories

### Admin

- As an admin, I want creation quests generated from unpacking answers with rules-first logic, so I get fast, deterministic output when patterns match.
- As an admin, I want AI fallback when heuristics don't apply, so quality is preserved for edge cases.

### Developer

- As a developer, I want observability (intentConfidence, heuristicVsAi, templateMatched) logged, so I can tune thresholds and add heuristics.
- As a developer, I want API contracts defined before UI, so integration is stable.

### System

- The system MUST use rules when heuristic confidence >= threshold.
- The system MUST fall back to AI when no template matches or confidence is low.
- The system MUST log generation path for tuning.

## Functional Requirements

### Phase 1: API Contracts + Types

- **FR1**: `CreationIntent`, `CreationQuestPacket`, `CreationContext` types MUST be defined.
- **FR2**: API signatures for `extractCreationIntent`, `generateCreationQuest`, `assembleArtifact` MUST be documented and implemented as stubs.

### Phase 2: Extraction + Generation Stubs

- **FR3**: `extractCreationIntent` MUST accept unpacking answers (or equivalent) and return `CreationIntent` with `confidence`.
- **FR4**: `generateCreationQuest` MUST return `CreationQuestPacket` with `heuristicVsAi` and optional `templateMatched`.

### Phase 3: Bootstrap Pipeline

- **FR5**: Bootstrap pipeline MUST support: AI generates examples → store (intent, steps) → analyze → derive heuristics/templates.
- **FR6**: Derived heuristics MUST be encodable as rules for `extractCreationIntent` and `generateCreationQuest`.

### Phase 4: Rules-First Runtime

- **FR7**: Runtime MUST attempt heuristic/template match first; call AI only when confidence < threshold or no match.
- **FR8**: Threshold MUST be configurable (env or constant).

### Phase 5: Observability + Control Plane

- **FR9**: Logging MUST include `intentConfidence`, `heuristicVsAi`, `templateMatched` for each generation.
- **FR10**: Feature flag `CREATION_QUEST_AI_ENABLED` MUST allow disabling AI fallback; rules-only mode when false.

## Non-functional Requirements

- Preserve quest quality; heuristics must not degrade output below acceptable threshold.
- Configurable constants for tuning (thresholds, template matching).
- Bootstrap pipeline can run offline or as admin tool; not in hot path.

## Out of Scope (Future)

- Full bootstrap UI (admin tool to run pipeline)
- Vector-based intent matching
- Multi-modal creation (beyond text)

## Dependencies

- [Quest Grammar Compiler](../quest-grammar-compiler/spec.md) — unpacking answers, QuestPacket structure
- [AI Deftness and Token Efficiency Strategy](../ai-deftness-token-strategy/spec.md) — cache, control plane
- [321 Shadow Process](../321-shadow-process/spec.md) — metadata derivation, BAR creation flow

## References

- [src/lib/quest-grammar/](../../src/lib/quest-grammar/) — compileQuest, unpacking constants
- [docs/creation-quest-bootstrap-design.md](../../docs/creation-quest-bootstrap-design.md) — design doc with path comparison and diagram
