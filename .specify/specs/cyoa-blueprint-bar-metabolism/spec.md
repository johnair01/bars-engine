# Spec: CYOA blueprint → BAR metabolism (hexagram, faces, recap)

## Purpose

Deliver a **coherent player journey** through I Ching / orientation-style CYOA where:

- **Passage copy matches branch cardinality** (no “five faces” prose when only one choice exists).
- **Game Master faces** appear **in choice affordances** (buttons) as **in-voice** lines—not a catalog in the body and not only `Face: subtitle` literals.
- Each choice **resolves a blueprint key** → **prompt library** → **BAR draft(s)** with stable IDs for downstream play.
- Players see **what opened** via a **bottom modal** (context-preserving) listing BARs prompted so far.
- **Transcendence** (or equivalent end-beat) **lists all BARs** generated during the run.
- **Hexagram state** is **carried** through the adventure (variables + optional milestone tags), not a one-off ritual disconnected from passages.
- **“Create my account”** (and similar cold-signup CTAs) appear **only** when the player is **not authenticated**; dashboard-launched flows must not surface account creation.

**Practice:** Deftness — **contracts before prose**; deterministic rules where possible; dual-track (template + runtime injection).

---

## Problem statement (confirmed in product feedback)

| Symptom | Cause (architectural) |
|--------|------------------------|
| Body text implies multiple options; UI shows one | **Passage body** and **branch list** are not driven from the same **structured state** (`choiceCount`, branch ids). |
| Face names in body + colon labels on buttons | **Single string channel** for labels; missing **voice/button copy** channel per blueprint. |
| No BAR strip / recap | **CYOA graph** and **BAR domain** not connected by **`ChoiceCommitted → BAR ids`** ledger. |
| Hexagram feels disconnected | Draw not persisted as **runtime state** read by each render step. |
| “Create my account” on dashboard-started quest | **Same template** for anonymous vs authenticated; **auth context** not an input to compile/render. |

---

## Design principles

1. **`render(nodeId, cyoaState, authContext) → { body, choices[] }`** — Body variants or slots derive from state; no static five-face paragraph unless five branches exist.
2. **Blueprint key is stable** — Maps to **prompt library** slice and milestone hooks; internal face ids need not appear in player copy.
3. **Artifact ledger** — Append-only list of emitted BAR ids (and metadata) for modal + transcendence.
4. **Auth is a first-class input** — Suppresses signup/passage targets when `isAuthenticated`.

---

## User stories

### P1 — Auth-aware CTAs

**As a** logged-in player starting CYOA from the dashboard, **I want** signup CTAs hidden, **so** I’m not offered “create my account” while already in the system.

**Acceptance:** Given `playerId` / session present, passages do not render links to signup-only targets; cold-start flows unchanged.

### P2 — Cardinality-aware passage body

**As a** player, **I want** the narrative block to reflect **how many** choices I have, **so** copy never implies a full menu when only one path exists.

**Acceptance:** `choiceCount` (or equivalent) selects body variant or fills structured slots; documented fallback when `count === 1`.

### P3 — In-voice choice labels

**As a** player, **I want** branch buttons framed in **each face’s voice**, **so** I’m not reading `Shaman:` / `Diplomat:` prefixes as the primary poetry.

**Acceptance:** Choice model includes `buttonLabel` / `voiceLine` (or template ids) separate from internal `blueprintKey` / `faceId`.

### P4 — Blueprint → prompt library → BAR emission

**As a** designer, **I want** each CYOA choice to reference a **blueprint key** that selects **prompts** and creates **BAR drafts**, **so** play metabolizes into BARs tied to the journey.

**Acceptance:** On choice commit: resolve prompts → create BAR(s) → return ids; failures degrade with logged error, not silent drop (configurable).

### P5 — Modal: “what opened”

**As a** player, **I want** a **bottom modal** listing BARs prompted on this run, **so** I see options opened without losing my place in the passage.

**Acceptance:** Modal reads from **artifact ledger**; does not navigate away; mobile-safe.

### P6 — Transcendence recap list

**As a** player, **I want** the Transcendence beat to **list all BARs** spawned in this quest, **so** I can review the journey before consequence/signup.

**Acceptance:** Same ledger drives Transcendence UI; order matches journey order unless specified otherwise.

### P7 — Hexagram integration

**As a** player, **I want** the **drawn hexagram** to inform the adventure, **so** the ritual and the story feel causally linked.

**Acceptance:** `cyoaState` holds hexagram payload (ids/lines/changing lines as product defines); passages or prompt resolution may consume it; documented contract.

### P8 — Campaign milestone hooks (optional v1)

**As a** campaign owner, **I want** BAR answers and step completion to **align with milestone progression**, **so** CYOA is a path through judgement toward throughput goals.

**Acceptance (v1):** Document hook points (`blueprintKey`, `campaignRef`); full automation may be a follow-on spec.

---

## Data contracts (conceptual)

```ts
type AuthContext = {
  isAuthenticated: boolean
  playerId?: string
}

type HexagramBinding = {
  hexagramId: string
  /** Product-defined: lines, changing lines, etc. */
  payload: Record<string, unknown>
}

type CyoaRunState = {
  runId: string
  nodeId: string
  hexagram?: HexagramBinding | null
  /** Append-only */
  artifactLedger: Array<{
    kind: 'bar'
    id: string
    sourceNodeId: string
    blueprintKey: string
    createdAt: string
  }>
}

type ChoiceDescriptor = {
  id: string
  blueprintKey: string
  /** Player-facing — in-voice */
  buttonLabel: string
  targetNodeId: string
  /** Optional longer line for accessibility / secondary UI */
  voiceLine?: string
}

type RenderResult = {
  body: string // or MDX slots
  choices: ChoiceDescriptor[]
}
```

Server actions / adapters must accept **`AuthContext`** when resolving CTAs and link targets.

---

## Non-goals (v1)

- Full rewrite of all Twee to DB graph (may **bridge** existing content with injected variables).
- AI-generated face copy for every beat (deterministic library first).
- Complete milestone automation (document hooks; ship ledger + BAR first).

---

## Dependencies

| Spec | Relationship |
|------|----------------|
| [quest-grammar-compiler](../quest-grammar-compiler/spec.md) | Compiler / skeleton beats; replace or gate default signup templates. |
| [quest-grammar-ux-flow](../quest-grammar-ux-flow/spec.md) | Player UX expectations for grammar flows. |
| [bruised-banana-milestone-throughput](../bruised-banana-milestone-throughput/spec.md) | Optional milestone consumption. |
| [game-loop-bars-quest-thread-campaign](../game-loop-bars-quest-thread-campaign/spec.md) | Placement + campaign refs. |

---

## Acceptance (release gate)

- [ ] Logged-in player does not see cold-signup-only CTAs on dashboard-launched CYOA paths covered by this spec.
- [ ] Single-choice passages use cardinality-aware copy (automated test or storybook fixture).
- [ ] Choice labels can be authored as in-voice without exposing internal face keys in the body.
- [ ] Choice commit emits BAR(s) and appends **artifact ledger**; modal lists them; transcendence lists full run.
- [ ] Hexagram state is persisted on run state and available to render/prompt resolution.
- [ ] `npm run build` and `npm run check` pass.

---

## References

- Architect analysis (manual): contracts `render(nodeId, cyoaState, authContext)`, phased implementation.
- Quest grammar compile paths (signup defaults): [packages/bars-core/src/quest-grammar/compileQuestCore.ts](../../../packages/bars-core/src/quest-grammar/compileQuestCore.ts)
- Deftness: [.agents/skills/deftness-development/SKILL.md](../../../.agents/skills/deftness-development/SKILL.md)
