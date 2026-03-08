# Plan: Creation Quest Bootstrap

## Summary

Implement phased bootstrap loop: (1) API contracts + types, (2) extraction + generation stubs, (3) bootstrap pipeline (AI generates examples → store → analyze → derive heuristics), (4) rules-first runtime with AI fallback, (5) observability + control plane. Target: rules-first creation quest generation with AI fallback for edge cases.

## Prerequisites

- [Quest Grammar Compiler](../quest-grammar-compiler/plan.md) — unpacking answers, QuestPacket structure
- [AI Deftness Strategy](../ai-deftness-token-strategy/plan.md) — cache, control plane patterns

## Phase 1: API Contracts + Types

### New file: `src/lib/creation-quest/types.ts`

```ts
export type CreationIntent = {
  creationType: string
  domain?: string
  targetState?: string
  constraints?: string[]
  confidence: number
}

export type CreationContext = {
  segment?: string
  campaignId?: string
  [key: string]: unknown
}

export type CreationQuestPacket = {
  nodes: QuestNode[]
  signature?: string
  segmentVariant?: string
  heuristicVsAi: 'heuristic' | 'ai'
  templateMatched?: string
}

export type AssembleInputs = {
  nodes: QuestNode[]
  metadata?: Record<string, unknown>
}

export type QuestNode = {
  id: string
  text: string
  choices?: Array<{ text: string; targetId: string }>
}
```

### API signatures

- `extractCreationIntent(answers: Record<string, unknown>): CreationIntent`
- `generateCreationQuest(intent: CreationIntent, context: CreationContext): Promise<CreationQuestPacket>`
- `assembleArtifact(creationType: string, inputs: AssembleInputs): Artifact`

## Phase 2: Extraction + Generation Stubs

### New file: `src/lib/creation-quest/extractCreationIntent.ts`

- Accept unpacking answers (q1–q6, alignedAction, etc.)
- Return CreationIntent with placeholder confidence (e.g., 0.5 initially)
- Rules-based extraction where patterns are obvious; stub for AI fallback

### New file: `src/lib/creation-quest/generateCreationQuest.ts`

- Accept CreationIntent + CreationContext
- Return CreationQuestPacket with `heuristicVsAi: 'heuristic'` stub
- Delegate to quest-grammar `compileQuest` when intent maps to unpacking flow; otherwise stub

### New file: `src/lib/creation-quest/assembleArtifact.ts`

- Deterministic assembly: nodes → Passage records or Twine export
- No AI

## Phase 3: Bootstrap Pipeline

### Bootstrap flow

1. **AI generates examples**: Prompt AI with seed inputs; produce (intent, steps) pairs
2. **Store**: Persist to JSON/DB for analysis
3. **Analyze**: Identify patterns (creationType clusters, common step sequences)
4. **Derive heuristics**: Encode as rules in extractCreationIntent and template matchers in generateCreationQuest

### Implementation

- Script or admin tool: `scripts/bootstrap-creation-quests.ts` (or similar)
- Output: heuristic rules, template definitions
- Integrate derived rules into extractCreationIntent and generateCreationQuest

## Phase 4: Rules-First Runtime

### Threshold logic

- `CREATION_QUEST_HEURISTIC_THRESHOLD` env (default 0.8)
- When `extractCreationIntent` returns confidence >= threshold: use rules path
- When no template matches in generateCreationQuest: call AI fallback
- Log `heuristicVsAi` and `templateMatched` in result

### Integration

- Wire extractCreationIntent → generateCreationQuest → assembleArtifact
- Use existing quest-grammar compileQuest when intent aligns with unpacking flow

## Phase 5: Observability + Control Plane

### Logging

- Log after each generation: `intentConfidence`, `heuristicVsAi`, `templateMatched`
- Optional: AiUsageLog integration (per AI Deftness spec)

### Feature flags

- `CREATION_QUEST_AI_ENABLED=true` (default) — AI fallback enabled
- When false: rules-only; return error or degraded output when no heuristic matches

## File Impacts

| Action | Path |
|--------|------|
| Create | src/lib/creation-quest/types.ts |
| Create | src/lib/creation-quest/extractCreationIntent.ts |
| Create | src/lib/creation-quest/generateCreationQuest.ts |
| Create | src/lib/creation-quest/assembleArtifact.ts |
| Create | src/lib/creation-quest/index.ts |
| Optional | scripts/bootstrap-creation-quests.ts |

## Implementation Order

1. Phase 1: types.ts + index.ts exports
2. Phase 2: extractCreationIntent, generateCreationQuest, assembleArtifact (stubs + basic rules)
3. Phase 3: Bootstrap script (can run manually)
4. Phase 4: Threshold logic, AI fallback wiring
5. Phase 5: Logging, feature flag

## Verification

1. `extractCreationIntent` with sample unpacking answers returns CreationIntent with confidence
2. `generateCreationQuest` returns CreationQuestPacket with heuristicVsAi
3. `assembleArtifact` produces valid Passage-like output
4. `npm run build` and `npm run check` pass
