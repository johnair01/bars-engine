# Spec: BAR Working Layer (Clean Up → Vibeulon minting)

## Purpose

Introduce a **player-facing BAR Working** move under **Clean Up** that turns a captured BAR into a **worked BAR**: the player names meaning (“This is a…”) and states commitment or refusal (“So I will…”), advances **seed metabolization** maturity, and **mints exactly one Vibulon** per successfully worked BAR. This layer sits between **Wake Up** (capture) and **Grow Up** (quest/daemon/artifact growth), conditioning downstream defaults so growth feels precise.

**Problem:** Today, clarity (meaning-making) is not a first-class, fast step with energy feedback; `growQuestFromBar` uses static `moveType` / `allyshipDomain`; vibeulons are not explicitly tied to **Clean Up** completion on vault BARs.

**Practice:** Deftness Development — spec kit first, API-first (contract before UI), deterministic GM interpretation copy (no LLM required for v1), idempotent mint (at most one mint per BAR for `bar_work`).

## Relationship to existing specs

| Spec / code | Relationship |
|-------------|--------------|
| [bar-seed-metabolization](./../bar-seed-metabolization/spec.md) (BSM) | **Maturity** enum already includes `captured` → `context_named` → `elaborated` → `shared_or_acted`; this spec **binds BAR Working steps** to those transitions. |
| [bars-ui-overhaul](./../bars-ui-overhaul/spec.md) (BUO) | Vault `/hand`, BAR-as-seed; **`growQuestFromBar`** in `src/actions/bars.ts` gains interpretation-aware defaults. |
| [attunement-translation](./../attunement-translation/spec.md) (EL) | **Energy:** mint uses existing **`mintVibulon`** (`src/actions/economy.ts`) with `origin.source = 'bar_work'`. |
| [singleplayer-charge-metabolism](./../singleplayer-charge-metabolism/spec.md) (GF) | Charge → BAR pipeline; worked BAR may still feed 321 / quest flows — **no** duplicate mint on charge path in v1. |

## Design decisions

| Topic | Decision |
|-------|----------|
| **Core principle** | **Vibeulons are minted through clarity, not action** at this stage — no reward for executing the “So I will…” line in v1. |
| **Completion** | **Worked** = interpretation chosen **and** `moveText` non-empty (commitment **or** explicit refusal + cost as one short string). No external “execution” proof. |
| **Mint rule** | **Binary:** worked → **exactly 1** Vibulon; not worked → 0. **No** fractional units. **Idempotent:** if `workedAt` already set and mint recorded, second submit is no-op or error. |
| **GM interpretations** | **Six fixed strings** (one per Game Master face), server-defined constants — player picks **face key** (`shaman` \| `challenger` \| `regent` \| `architect` \| `diplomat` \| `sage`). |
| **Persistence** | **`BarWorkingState`** stored as JSON: extend **`CustomBar.seedMetabolization`** parsed shape **or** dedicated optional JSON on `CustomBar` — **v1 preference:** nested `barWorking` inside `seedMetabolization` payload (single column) to keep BSM + working in one place; if parse complexity is too high, add `barWorkingJson String?` in Prisma (tasks decide). |
| **Maturity mapping** | On **interpretation saved:** `maturity = context_named`. On **work complete** (`workedAt` set): `maturity = elaborated`. **`shared_or_acted`** remains for **later** phase when action is verified elsewhere (out of scope for v1 BAR Working UI). |
| **Growth conditioning** | **`growQuestFromBar(barId)`** reads worked interpretation and sets **`moveType`** + **`allyshipDomain`** from mapping table (below); fallback to current defaults if BAR not worked. |
| **Surfaces** | **Vault `/hand`** primary; **Garden** filters (worked / unworked, maturity) Phase 2 if not bundled in v1. |
| **Constraints** | Completable in **&lt; 30 s**; **no** emotional-literacy jargon in copy; **in-world** prompts only (no meta “this is the Clean Up mechanic”). |
| **Anti-patterns** | No multi-step journaling, no “correct” interpretation, no scoring rubrics, no execution rewards at this layer. |

## Conceptual model

| Dimension | Value |
|-----------|--------|
| **WHO** | Player (owner or vault recipient per existing BAR auth). |
| **WHAT** | **BAR Working** — name the pattern (interpretation) + state move/refusal (`moveText`). |
| **WHERE** | Vault **`/hand`**; allyship domain for **downstream** quest defaults only. |
| **Energy** | **+1 Vibulon** on successful work via **`mintVibulon`** (`origin.source: 'bar_work'`). |
| **Personal throughput** | **Clean Up** — clarity before **Grow Up** / **Show Up**. |

### Lifecycle (updated)

```text
Wake Up   → Capture BAR
Clean Up  → Work BAR (mint Vibulon)
Grow Up   → Grow BAR into quest / daemon / artifact
Show Up   → Place into campaign / thread / world
```

### GM interpretation options (v1 copy — canonical)

| GM face (`interpretationGmFace`) | Resolved sentence (`interpretationResolvedText`) |
|----------------------------------|--------------------------------------------------|
| `shaman` | “…a sign that something unseen is moving” |
| `challenger` | “…a moment where something must be tested” |
| `regent` | “…a situation that requires a proper response” |
| `architect` | “…a system that isn’t working the way I thought” |
| `diplomat` | “…a signal about a relationship” |
| `sage` | “…a story I may not need to keep believing” |

Prompt **A:** “This is a…” → player selects one option (stores face key + full sentence).  
Prompt **B:** “So I will…” → short **`moveText`** (action **or** refusal + cost in plain language).

### Growth defaults from interpretation (`growQuestFromBar`)

When source BAR has completed BAR Working, set **initial** quest fields (override static defaults):

| `interpretationGmFace` | `moveType` (primary) | `allyshipDomain` |
|------------------------|----------------------|------------------|
| `shaman` | `cleanUp` | `RAISE_AWARENESS` |
| `challenger` | `showUp` | `DIRECT_ACTION` |
| `regent` | `growUp` | `SKILLFUL_ORGANIZING` |
| `architect` | `growUp` | `GATHERING_RESOURCES` |
| `diplomat` | `cleanUp` | `GATHERING_RESOURCES` |
| `sage` | `cleanUp` | `RAISE_AWARENESS` |

> **Note:** Where the product table listed two moves per face, v1 picks **one primary** `moveType` per row for deterministic quest creation; Phase 2 may expose secondary hints in quest body.

## API Contracts (API-First)

### `BarWorkingState` (persisted JSON fragment)

```ts
type BarWorkingState = {
  interpretationGmFace?: 'shaman' | 'challenger' | 'regent' | 'architect' | 'diplomat' | 'sage'
  interpretationResolvedText?: string // full sentence, denormalized for display
  moveText?: string // "So I will…" line; includes refusal + cost if chosen
  workedAt?: string // ISO 8601 — set once when work completes
  /** Set when mint succeeded — idempotency / audit */
  barWorkMintLedger?: { mintedAt: string; vibulonCount: 1 }
}
```

Storage: nested under `seedMetabolization` JSON as `barWorking`, **or** sibling column — see **Design decisions**.

### `saveBarWorkingInterpretation`

**Server Action** — step 1 of 2.

**Input:** `{ barId: string; interpretationGmFace: BarWorkingState['interpretationGmFace'] }`  
**Output:** `{ ok: true } | { ok: false; error: string }`

- Validates BAR access (same rules as vault / `getBarDetail`).
- Writes `barWorking.interpretationGmFace` + `interpretationResolvedText` from canonical table.
- Sets `seedMetabolization.maturity` to **`context_named`** if currently `captured` or unset.

### `completeBarWorking`

**Server Action** — step 2; mints Vibulon.

**Input:** `{ barId: string; moveText: string }` — `moveText` trimmed, min length 3, max 500 (tunable).  
**Output:** `{ ok: true; minted: boolean; newBalanceHint?: number } | { ok: false; error: string }`

- Requires interpretation already saved.
- If `workedAt` already set: return `{ ok: true, minted: false }` (idempotent) **or** `error: 'Already worked'` — pick one in implementation; spec prefers **idempotent success** with `minted: false`.
- Sets `moveText`, `workedAt`, `maturity = elaborated`.
- Calls **`mintVibulon(playerId, 1, { source: 'bar_work', id: barId, title: 'BAR Working — Clean Up' })`** once; records `barWorkMintLedger`.
- **Revalidate** `/hand`, BAR detail routes.

### `getBarWorkingState` (read)

**Input:** `{ barId: string }`  
**Output:** `{ barWorking: BarWorkingState | null; maturity: MaturityPhase | null } | { error: string }`

Used by Vault UI to show CTA vs completion.

### Route vs Action

| Surface | Mechanism |
|---------|-----------|
| Vault `/hand`, inline flow | **Server Actions** `saveBarWorkingInterpretation`, `completeBarWorking` |
| Future: mobile / API | Optional **GET** read route only if needed — defer to Phase 2 |

See [deftness-development/reference.md](../../../.agents/skills/deftness-development/reference.md).

## User stories

### P1 — Work a BAR from the Vault

**As a** player with a captured BAR in the Vault, **I want** a **“Work this BAR”** flow that asks “This is a…” and “So I will…”, **so that** I get clarity and **one Vibulon** without a long journaling flow.

**Acceptance:** Entire flow ≤ 30 seconds for typical user; interpretation + move submit succeeds; +1 Vibulon visible after completion; BAR shows worked state.

### P2 — Grow quest uses interpretation

**As a** player, **when** I **Grow** from a **worked** BAR, **I want** the new quest’s **`moveType`** and **`allyshipDomain`** to reflect my interpretation, **so that** the quest feels aligned with my meaning.

**Acceptance:** Mapping table applied; unworked BARs keep existing defaults (`showUp` + `GATHERING_RESOURCES`).

### P3 — No double mint

**As** ops, **I want** BAR Working to mint **at most once** per BAR for `bar_work`, **so that** the economy cannot be farmed by replaying the form.

**Acceptance:** Second `completeBarWorking` does not create additional Vibulon rows.

## Functional requirements

### Phase 1 — Contracts + persistence + mint

- **FR1:** Canonical **interpretation table** in code (`src/lib/bar-working/interpretations.ts` or equivalent); Zod validates face key + payloads.
- **FR2:** Persist **`BarWorkingState`** + maturity transitions per **Design decisions**; extend **`parseSeedMetabolization` / `serializeSeedMetabolization`** if using nested `barWorking`, **or** migration for `barWorkingJson`.
- **FR3:** Implement **`saveBarWorkingInterpretation`** and **`completeBarWorking`** with **`mintVibulon`** integration and idempotency.
- **FR4:** Unit tests: maturity transitions, mint once, interpretation → `growQuestFromBar` field resolution.

### Phase 2 — Vault UI

- **FR5:** **`/hand`** (or existing vault card): **“Work this BAR”** CTA when BAR eligible (owner/recipient, type rules TBD in plan); inline dropdown + text input + confirm.
- **FR6:** Post-completion: show **+1 Vibulon** (or wallet refresh) + **maturity** badge / worked indicator — in-world copy only.

### Phase 3 — Garden + polish

- **FR7:** Garden / vault filters: worked vs unworked; maturity progression visible (coordinate with BSM Garden tasks if split).

## Non-functional requirements

- **Performance:** Actions complete in &lt; 2 s typical server time (no AI).
- **Security:** Only authorized player for BAR; validate `barId` ownership / share rules consistent with `growQuestFromBar`.
- **Backward compatibility:** BARs without `barWorking` behave as today; mint only on explicit completion.

## Persisted data & Prisma

> **Process contract:** Shipping schema changes without a committed migration breaks deploys. See [.agents/skills/prisma-migration-discipline/SKILL.md](../../../.agents/skills/prisma-migration-discipline/SKILL.md).

| Check | Done |
|-------|------|
| If `seedMetabolization` JSON only: update `SeedMetabolizationState` + parse/serialize in `src/lib/bar-seed-metabolization/` — **no** Prisma migration | |
| If new column `barWorkingJson`: **`prisma migrate dev`** + commit SQL | |
| **`tasks.md`** includes migration / parser tasks | |
| **Verification**: `npm run db:sync` after schema edit; `npm run check` | |

## Scaling checklist

| Touchpoint | Mitigation |
|------------|------------|
| Mint spam | Idempotent `workedAt` + ledger flag; rate-limit per player optional Phase 2 |

## Verification quest (UX)

- **ID:** `cert-bar-working-layer-v1`
- **Steps:** (1) Open Vault with a test BAR. (2) Tap **Work this BAR**. (3) Choose an interpretation. (4) Enter **So I will…** and confirm. (5) Observe +1 Vibulon / worked state. (6) **Grow** quest from same BAR; verify `moveType` / domain match table.
- **Narrative frame:** Bruised Banana residency — guests **clean up** signal into meaning before growing quests; engine reliability for **Clean Up → energy**.

Reference: [cyoa-certification-quests](../cyoa-certification-quests/spec.md), `scripts/seed-cyoa-certification-quests.ts`.

## Dependencies

- BSM types (`MaturityPhase`, `seedMetabolization`)
- `mintVibulon` (`src/actions/economy.ts`)
- `growQuestFromBar` (`src/actions/bars.ts`)
- Vault `/hand` UI

## References

- `src/lib/bar-seed-metabolization/types.ts` — maturity enum
- `src/actions/bars.ts` — `growQuestFromBar`
- `src/actions/economy.ts` — `mintVibulon`
- Prisma workflow: [prisma-migration-discipline skill](../../../.agents/skills/prisma-migration-discipline/SKILL.md)

## One-line summary

> **Players earn energy by making meaning, then spend it by taking action.**

## Future extensions

1. **Move extraction** — repeated `moveText` → reusable moves library.  
2. **GM bias tracking** — analytics on face preference.  
3. **Adaptive suggestions** — suggest interpretation from BAR text (optional LLM, off by default).
