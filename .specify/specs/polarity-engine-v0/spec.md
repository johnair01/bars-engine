# Spec: Polarity Engine v0 (Emotional Charge + Polarity Extraction)

## Purpose

Introduce a **Polarity Engine** layer so BARs become **dynamic tension engines**: emotional charge → guiding question → emergent polarity (two poles) → **sustained spin state** (not binary resolution) → hooks for quest generation.

**Problem:** BARs can read as static notes; players need a fast (&lt;30s) path from felt emotion to **actionable** narrative without pre-defining polarities in a taxonomy.

**Practice** (when persistence/UI/API): Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI for v0 mapping tables.

## Design Decisions

| Topic | Decision |
|-------|------------|
| Where charge + polarity live | Prefer **JSON on `CustomBar`** (or small `polarityPayload` field) v0 — avoid parallel “polarity table” until patterns stabilize. |
| Who defines poles | **System suggests** from BAR text + charge; **player confirms** — no requirement to name poles before play. |
| Resolution vs spin | **Polarity is not “resolved”** in v0 — **spin** (position + intensity) **sustains** tension; quests **metabolize**, not erase. |
| Quest hook | **`generateQuestFromPolarity`-style input** to existing **quest-grammar** / BAR emission pipelines — not a second quest system. |
| AI | v0: **deterministic** emotion→question map; optional Sage copy pass **later** for pole wording. |

## Conceptual Model

| Dimension | Mapping |
|-----------|---------|
| **WHO** | Player + their BAR |
| **WHAT** | BAR text becomes the substrate; charge colors **how** the system reads it |
| **WHERE** | Campaign / instance context from existing BAR links |
| **Energy** | Emotional charge intensity (optional) feeds spin magnitude |
| **Personal throughput** | Output quests favor **Show Up** / **Grow Up** moves when spinning toward action |

**Flow (conceptual):** Charge BAR → Polarize (extract A/B) → Player picks direction (or affirms spin) → Spin state updates → Quest suggestion from spin + BAR id.

## API Contracts (API-First)

### chargeBar

**Input:** `{ barId: string, charge: EmotionalCharge }`  
**Output:** `{ ok: true } | { error: string }`

```ts
type EmotionalCharge = {
  element: 'fire' | 'wood' | 'water' | 'earth' | 'metal'
  intensity?: number // 0–1 optional v0
}
```

- **Server Action** (`'use server'`): mutates BAR JSON / payload; returns `{ success, error }`.

### polarizeBar

**Input:** `{ barId: string }` (uses stored charge + BAR text)  
**Output:** `{ polarity: { poleA: string; poleB: string }; suggestedQuestion: string } | { error: string }`

### resolveDirection (affirm spin)

**Input:** `{ barId: string; selectedPole: 'A' | 'B'; magnitude?: number }`  
**Output:** `{ spinState: SpinState } | { error: string }`

```ts
type SpinState = {
  polarityId: string // stable id for this pair + BAR snapshot hash v0
  position: number // -1..1 or 0..1 — spec task to fix numeric convention
  intensity: number
}
```

### updatePlayerPolarityState (optional v0.1)

**Input:** `{ playerId: string; polarityId: string; delta: number }`  
**Output:** `{ spinState: SpinState } | { error: string }`

- Prefer **server action** or **internal helper** until external API is needed.

### generateQuestFromPolarity (hook)

**Input:** `{ spinState: SpinState; barId: string; campaignRef?: string }`  
**Output:** Serializable quest packet or BAR draft handle — **align with** `quest-grammar` / `generateQuestFromReading` outputs.

## User Stories

### P1: Charge and question

**As a player**, I want to **charge my BAR with an element** and see a **guiding question**, so I know what the system heard.

**Acceptance:** One round-trip; question matches `EmotionQuestions` mapping (below).

### P2: Two poles + spin

**As a player**, I want to see **two poles** and a **spin** that doesn’t force a fake “closure”, so the tension stays honest.

**Acceptance:** Copy explains sustained tension; no “you solved the polarity” messaging in v0.

### P3: Quest hook

**As a steward**, I want **polarity spin** to **suggest a quest or BAR**, so play continues from the BAR.

**Acceptance:** Deterministic or template-based output traceable to `barId` + spin.

## Functional Requirements

### Phase 1 — Core types + mapping

- **FR1**: Implement `EmotionQuestions` map (fire → “What needs to change?”, wood → “What wants to grow?”, water → “What matters that is being lost or transformed?”, earth → “What is out of balance?”, metal → “What risk is asking to be faced?”).
- **FR2**: Persist **emotional charge** and **polarity instance** (selected pole, optional magnitude/cost/unrealized gain) on BAR-compatible JSON.
- **FR3**: Expose **polarize** + **resolve direction** via server actions with auth checks (BAR owner / campaign rules).

### Phase 2 — Spin + quest hook

- **FR4**: Maintain **spin state** per player+polarity key (minimal storage — JSON on player extension or separate table only if needed).
- **FR5**: **`generateQuestFromPolarity`** adapter calling existing quest compilation with **structured prompt** from spin + BAR.

## Non-Functional Requirements

- **Latency:** Charge → question → poles &lt; 30s perceived (no blocking LLM in v0 hot path).
- **Backward compatibility:** Existing BARs without charge behave unchanged.
- **Security:** Only BAR author or campaign GM can mutate charge/polarity for that BAR (match existing BAR auth patterns).

## Persisted data & Prisma

| Check | Done |
|-------|------|
| Prefer **JSON fields** on `CustomBar` or reuse metadata columns — document in **Design Decisions** | |
| If new tables: **tasks.md** includes `prisma migrate dev` + committed SQL | |
| **Verification**: `npm run db:sync` after schema edit; `npm run check` | |

## Verification Quest (UX)

- **ID**: `cert-polarity-engine-v1`
- **Steps**: Open BAR → charge → see question → see poles → confirm spin → see quest/BAR suggestion (or stub message).
- Tie to **Bruised Banana** / residency framing where copy fits.

## Dependencies

- `CustomBar` read/write patterns, quest-grammar compiler
- Optional: emotional alchemy / element channels elsewhere in codebase

## References

- Source notes: designer draft `polarity_engine_spec.md` (ingested concept)
- [spec-template.md](../../spec-template.md)
- [conceptual-model.md](../../memory/conceptual-model.md)
