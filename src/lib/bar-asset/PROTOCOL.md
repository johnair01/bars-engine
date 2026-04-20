# BAR Asset Protocol

**Owner:** sprint/bar-asset-pipeline-001 | **Issue:** #76
**Supersedes:** n/a | **Status:** Phase 1

---

## Background

Three existing BAR systems share one word but not one data model:

| System | BAR type | Maturity state | Constructor |
|---|---|---|---|
| `bar-seed-metabolization` | `BarSeed` | Yes (full state machine) | NL authoring |
| `bar-forge` | `BarQuest` | No | Quest matching |
| `bars.ts` | `BarDef` | No | Game rendering |

The protocol defines how Constructor A (NL engine) outputs BARs that Constructor B (game renderer) can accept — without merging the three existing systems.

---

## The Four BAR Types

```
BarSeed    = BarDef + SeedMetabolizationState + BarAnalysis
BarQuest   = BarDef + BarAnalysis              (quest matching, no maturity)
BarDef     = { id, type, title, description, inputs, reward, unique }
BarMemory  = { id, maturity }                  (Agent Mind lightweight ref)
```

The word "BAR" refers to different objects depending on which system you're in. Do not unify them — connect them.

---

## Maturity Protocol

Maturity gates the pipeline. Constructor B (game renderer) only accepts BARs at `maturity = 'integrated'`.

```
Constructor A (NL engine)
  outputs: BarSeed with maturity >= 'shared_or_acted'

Translation layer (NL engine knows both internals)
  action:  'shared_or_acted' -> 'integrated' on acceptance

Constructor B (game renderer)
  accepts: BarAsset (BarDef + maturity = 'integrated')
```

Maturity phases (lowest to highest):

  captured -> context_named -> elaborated -> shared_or_acted -> integrated

Only `integrated` BARs are lego pieces ready for game assembly.

---

## Structured ID Convention

All BARs in the pipeline use structured IDs:

  Format: {barType}_{creator}_{sequence}

| barType | Creator example | Full ID example |
|---|---|---|
| blessed | wendell | blessed_wendell_001 |
| rune | zoc | rune_zoc_001 |
| quest | barsengine | quest_barsengine_001 |
| allyship | masteringallyship | allyship_masteringallyship_001 |
| vibe | wendell | vibe_wendell_001 |
| story | wendell | story_wendell_001 |
| insight | wendell | insight_wendell_001 |

Legacy ids (pre-convention) are passthrough-normalized with `isLegacy: true`.

---

## Constructor Contract

### Constructor A: NL Authoring Engine

**Input:** natural language prose, author identity, bar type
**Output:** `BarSeed` with `maturity >= 'shared_or_acted'`
**Output type:** `BarSeed` (BarDef + SeedMetabolizationState + optional BarAnalysis)

```
interface ConstructorAOutput {
  barSeed: BarSeed
  barAnalysis?: BarAnalysis   // optional — quest matching analysis
  id: StructuredBarId
}
```

### Constructor B: Translation / Asset Assembly

**Input:** `BarSeed` with `maturity >= 'shared_or_acted'`
**Output:** `BarAsset` (BarDef + `maturity = 'integrated'`)
**Rejects:** `BarSeed` with `maturity < 'shared_or_acted'`

```
interface BarAsset {
  barDef: BarDef
  maturity: 'integrated'
  integratedAt: string  // ISO 8601
  sourceSeedId: StructuredBarId
}
```

### Constructor C: Game Renderer

**Input:** `BarAsset`
**Output:** playable game content (dungeon room, NPC, item, dialogue node)
**Accepts:** `maturity = 'integrated'` only

---

## Data Flow Diagram

```
[Author prose] --NL engine--> [BarSeed] maturity=shared_or_acted
                                        |
                                        v translation layer
                                   [BarAsset]
                                 maturity=integrated
                                        |
                                        v
                              [Constructor B: asset assembly]
                                        |
                                        v
                              [Constructor C: game renderer]
                                        |
                                        v
                              [Playable game content]
                                        |
                                        v feedback loop
                                   [BarSeed] new cycle
```

---

## Phase 2 Scope (deferred)

- One BAR type only: `blessed_object` -> one dungeon room
- No feedback loop yet
- `AgentMindState.bars: unknown[]` unchanged until protocol stable

---

## References

- Maturity state machine: `src/lib/bar-seed-metabolization/types.ts`
- State machine pattern: `zo-browser/src/orchestration/run-state-machine.ts`
- 6-face consult: Hexagram #18 (Decay) — corrective renewal
