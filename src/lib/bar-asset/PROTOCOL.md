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

## Resolution Registers

*Introduced: 2026-04-25 — GAP A-1 correction (RPG Design Zine Octalysis audit)*

The RPG Design Zine defines three **resolution registers** for determining fictional outcomes when the system needs a non-negotiated answer. bars-engine implements all three:

| Register | Mechanism | bars-engine implementation | Octalysis drive |
|---|---|---|---|
| **Fortune** | Random real-world element shapes fiction | `cast-iching.ts` (I Ching hexagram); `prompt-deck-play.ts` (card draw) | D7 (Unpredictability) + D4 (Ownership) |
| **Drama** | Fiction drives outcome, no real-world element | Narrative resolution without dice/cast | D3 (Empowerment) |
| **Karma** | Past behavior tracked in real-world state shapes outcome | BSM maturity phases; altitude map tracking | D8 (Loss Avoidance) |

A `BarAsset.metadata.resolutionRegister` field documents which register a BAR uses. When absent, default is `'karma'` for mechanical BARs and `'drama'` for narrative-only BARs.

### The I Ching as Fortune Register

The I Ching casting system (`cast-iching.ts`) is bars-engine's primary Fortune mechanism:

1. Server-side `Math.random()` simulates 6 coin flips → generates 6-line hexagram
2. Hexagram ID (1–64) is a **provably non-repeating random number** in the uncountable hexagram space
3. The hexagram maps to a 6 GM face array (Shaman through Sage) for game routing
4. Changing lines optionally invoke the transformation path (Fortune → Drama → Karma)

This is the **Fortune register in its canonical form**: a random real-world element (hexagram ID) that shapes fictional outcomes (quest availability, face moves, narrative direction) without regard for fictional context.

### Why Naming Matters (Octalysis D4 + D7)

Previously the I Ching was documented as a "cast mechanic" — this framing missed two Octalysis drives:

- **D4 (Ownership):** Players who receive an I Ching reading own a genuinely non-repeating, personally-meaningful outcome. Naming the Fortune register makes this possession visible.
- **D7 (Unpredictability):** The uncountable hexagram space is a discovery engine. Without naming, players cannot ask "what hexagrams haven't I seen yet?"

Naming the register converts the mechanic from an oracle into a **possession artifact** (D4) with **emergent discovery potential** (D7).

### References

- Resolution register types: `src/lib/bar-asset/types.ts` (`ResolutionRegister`)
- I Ching casting: `src/actions/cast-iching.ts`
- I Ching alignment scoring: `src/lib/iching-alignment.ts`
- Prompt deck (secondary Fortune): `src/actions/prompt-deck-play.ts`
- Gap analysis: `GM_GAP_ANALYSIS_RPG_ZINE_BAR_MATURITY.md`

### Altitude Zone (DAOE FR1.2)

*Introduced: 2026-04-25 — Altitude Mechanic spec, FR1.2*

A BAR's `authoredAltitudeZone` documents which altitude zone it is calibrated for:

```typescript
interface DualAltitude {
  emotional: 'dissatisfied' | 'neutral' | 'satisfied' | 'uncalibrated'
  developmental: 'wake' | 'clean' | 'grow' | 'show' | 'uncalibrated'
}
```

**Rules:**
- `authoredAltitudeZone` absent → BAR is accessible at all altitudes (permissive default, Phase 1)
- `altitudeGated = true` + `authoredAltitudeZone` set → Constructor C enforces altitude gates
- `authoredAltitudeZone` is the **BAR's target altitude** — NOT the player's current altitude
- Player altitude is tracked separately via Show Up action completion

**Constructor B responsibility:** When translating a BarSeed to BarAsset, copy the altitude zone from the seed analysis (if present) into `metadata.authoredAltitudeZone`.

**Constructor C responsibility:** When rendering a BarAsset, check `altitudeGated`. If true, compare player altitude against `authoredAltitudeZone` and hide or lock the BAR if the player is below the threshold.

**See also:** `.specify/specs/altitude-mechanic/spec.md`

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
