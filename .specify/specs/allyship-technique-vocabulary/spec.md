# Spec: Allyship Technique Vocabulary

## Purpose

Establish the **canonical shared tag vocabulary** that lets the 120-card Allyship Deck, the Superpower overlay, and a living/user-extensible Technique Library all speak the same language — so that a technique declares a few tags and *automatically* attaches to every card it fits, with no card edits and no code changes.

This spec is the **contract layer**. It defines: (1) the canonical axes and their single sources of truth, (2) the `Superpower` axis and the 2-slot inner/outer loadout, (3) the `Technique` schema (extending the one planned in `clean-up-technique-system`), and (4) the deterministic **card → technique resolution rule**. It deliberately does **not** re-spec the 120 cards (`allyship-deck` owns that), the technique mastery/discovery loop (`clean-up-technique-system` owns that), the proposal→promotion pipeline (`move-ecology-emergent` owns that), or any UI.

**Problem**: The deck already embeds ~120 one-off micro-practices (the `remediation` field per card), but there is no reusable library of named techniques, no way to link the book *Mastering the Game of Allyship* (MTGOA) practices to cards, and no way for players to add or import their own. The bridge from "buy the deck" to "play the game" is missing. Worse, three in-flight specs each define overlapping vocabulary (`channels`, `domains`, `operations`, `aspect`, `superpowers`) with no single source of truth — inviting drift.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI. The resolution rule is a pure deterministic function; AI is never required to link a technique to a card.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Channel canonical key** | The **element** (`fire \| water \| metal \| earth \| wood`) is the canonical key. The **emotion** (Anger/Sadness/Fear/Neutrality/Joy) is a *derived display alias*, never a second enum. The existing `CAPABILITIES` table in `src/lib/allyship-deck/move-library.ts` is the single Rosetta Stone (channel ↔ capability ↔ dissatisfied-emotion ↔ satisfaction). Rationale: the deck already keys on element; storing emotion as a separate enum would invite drift. Book-voice surfaces render the emotion via one helper; no migration cost to switch later. Confirmed with author ("elements for now; they're one and the same"). |
| **Operation = altitude** | The 6 Operations (`shaman → sage`) are the deck's existing axis AND the book's six "mentor-worlds"/Integral altitude bands (Magenta→Red→Amber→Orange→Green→Teal). A technique declares the **altitude range** at which it applies; Operation is the *dial*, not a separate technique set. |
| **Superpowers are channel-agnostic** | A `Superpower` is defined by its **method (move-deck) + altitude ladder**, NOT anchored to an emotion/channel. Any superpower can run any channel. (Matches the deck's existing comment that faces are "channel-agnostic.") We diverge here from MTGOA's per-superpower emotion anchoring, by author's decision. |
| **2-slot loadout (inner/outer)** | A player holds **at most two** superpowers: `inner` = how they defend/metabolize themselves (inner allyship) and `outer` = how they help others (outer allyship). This binds to the existing `MoveAspect = inner \| outer` grammar (`src/lib/quest-grammar/move-aspect.ts`) and the card `Subject` toggle. Flipping a card self→other swaps which slot is active. |
| **Alchemy is the universal substrate** | Per MTGOA ("every player takes ≥1 level in Alchemy"), the Tier-1 emotional-alchemy tools (3-2-1, W.A.V.E., Grounding, Rose, Contract Burning, Conscious Complaining, Happy Apples, Charge Diagnostic, Fuel Check) are available under *both* slots regardless of loadout. Alchemy is a floor, not one of the two slots. |
| **Aspect is a toggle, not a multiplier** | Inner/outer is a **consult-time toggle** (like the existing `Subject`), NOT a doubling of the deck to 240 cards. The same 120 cards carry both readings (existing `primaryQuestion`/`campaignQuestion`). A technique tags `aspect: inner \| outer \| both`. |
| **Linking is emergent (tag overlap), not FK** | A technique does **not** point at card ids. It declares tags; cards surface any technique whose tags overlap. This is what makes the library infinitely extensible — adding a technique never touches card data. An optional `pinnedCardIds` escape hatch exists for hand-authored exceptions. |
| **Living library trust tiers** | `tier: canonical \| community \| personal`. Canonical = book + curated traditions (authored). Community = shared, attributed, reviewable. Personal = private to one player. Promotion between tiers reuses the `move-ecology-emergent` proposal→candidate→canonical pathway rather than inventing a new one. |
| **Metabolization provenance gate** | Importing an external practice (wisdom tradition, personal-development book) **requires** `source` provenance + an `ontologicalFooting` note (does it serve development? is it ours to use / how is the lineage honored?). This is the DIPLOMAT consent/power-dynamic check applied to knowledge. On-ethos with CLAUDE.md "composting, not necromancy." |
| **No new move axis for superpower at card level** | Superpower stays a **player loadout overlay + a technique tag**, not a 7th dimension multiplied into the 120 cards. Keeps the grid intact. |

## Conceptual Model

The engine's canonical dimensions (per `spec-kit-translator`), with where each axis lives:

| Dimension | Meaning | Axis / source of truth |
|-----------|---------|------------------------|
| **WHAT (personal throughput)** | The move | `BasicMove` — `wake_up \| open_up \| clean_up \| grow_up \| show_up` (fixes `OutputBar`) |
| **HOW (altitude)** | Developmental register | `Operation` — `shaman \| challenger \| regent \| architect \| diplomat \| sage` |
| **WHERE** | Context of work | `AllyshipDomain` — `GATHERING_RESOURCES \| RAISE_AWARENESS \| DIRECT_ACTION \| SKILLFUL_ORGANIZING` |
| **Energy** | Emotional substrate | `Channel` (element) — `fire \| water \| metal \| earth \| wood`; `Capability` is its satisfied form |
| **Direction** | Self vs. others | `MoveAspect` — `inner \| outer` (+ `Subject` toggle `self \| other \| collective`) |
| **WHO (method)** | Player's lens | `Superpower` — `strategist \| connector \| escape_artist \| disruptor \| alchemist \| storyteller` |

A **Card** is a fixed point in `(move × operation × domain)` carrying latent `capabilities[]`.
A **Technique** is a do-able practice that declares which regions of that space it serves (tag arrays).
A **Loadout** is `{ inner: Superpower, outer: Superpower }` + the universal Alchemy substrate.
**Resolution** = a pure function `(card, loadout, subject) → ranked Technique[]`.

```
Card (move × op × domain, capabilities[])
  └─ resolveTechniques(card, loadout, subject)
       └─ Technique[]  (tag-overlap match, ranked by specificity then tier)
            └─ each Technique → its named book/tradition/personal practice
```

## API Contracts (API-First)

> Pure, deterministic, side-effect-free. No DB read required for the canonical set (it can run over the in-memory vocabulary + a technique list). This is the contract everything else depends on.

### Canonical vocabulary module

New module `src/lib/technique-library/vocabulary.ts` re-exports the existing canonical enums (it does **not** redefine them) and adds the two new ones:

```ts
// Re-exported (single source of truth stays in allyship-deck + quest-grammar):
export type { BasicMove, Operation, AllyshipDomain, Channel, Capability, OutputBar, Subject } from '@/lib/allyship-deck/types'
export type { MoveAspect, AllyshipTarget } from '@/lib/quest-grammar/types'

// NEW canonical axis:
export type Superpower =
  | 'strategist' | 'connector' | 'escape_artist'
  | 'disruptor' | 'alchemist' | 'storyteller'

export interface Loadout {
  inner: Superpower            // self-defense / inner allyship
  outer: Superpower            // helping others / outer allyship
  // Alchemy substrate is implicit and universal — not a slot.
}

// Element is the key; emotion is derived from CAPABILITIES (the Rosetta table).
export function emotionForChannel(c: Channel): string        // 'fire' -> 'Anger'
export function satisfactionForChannel(c: Channel): string   // 'fire' -> 'Triumph'
export function channelsForCapabilities(caps: Capability[]): Channel[]
```

### Technique type (library entity)

```ts
export type TechniqueTier = 'canonical' | 'community' | 'personal'
export type TechniqueAspect = MoveAspect | 'both'      // 'inner' | 'outer' | 'both'
export type TechniqueOrigin =
  | 'book' | 'tradition' | 'personal_dev' | 'player' | 'gm' | 'ai'

export interface TechniqueSource {
  origin: TechniqueOrigin
  name?: string          // e.g. "Mastering the Game of Allyship", "Internal Family Systems"
  author?: string
  lineage?: string       // tradition / school / who to honor
  permission?: string    // license / consent note (required for 'tradition' import)
}

export interface Technique {
  id: string
  slug: string
  name: string                 // e.g. "The 3-2-1 Practice", "W.A.V.E.", "Holding Space"
  essence: string              // one line: what it does
  steps: string[]              // the do-able practice (maps to clean-up-technique-system Technique.steps JSON)

  // ── metabolization (provenance + footing) ──
  source: TechniqueSource
  allyshipReframe?: string     // the Integral footing — how the external practice lands in allyship
  ontologicalFooting?: string  // why it serves development; lineage honored (required for imports)

  // ── shared link vocabulary (empty array = "applies to all") ──
  moves: BasicMove[]
  operations: Operation[]      // altitude band(s); [] = all altitudes
  domains: AllyshipDomain[]    // [] = all domains
  channels: Channel[]          // element keys; [] = channel-agnostic
  aspect: TechniqueAspect      // inner | outer | both
  superpowers: Superpower[]    // [] = available to any loadout; 'alchemist' = part of substrate
  capabilities?: Capability[]  // optional refinement

  // ── quality / safety ──
  optimizesFor?: string
  failureModes?: string[]
  contraindications?: string[]

  // ── lifecycle / ownership (living library) ──
  tier: TechniqueTier
  status: 'draft' | 'candidate' | 'published'
  ownerPlayerId?: string       // for personal/community
  pinnedCardIds?: string[]     // hand-authored exceptions (rare); empty = pure emergent linking
}
```

### Resolution rule (the linchpin)

```ts
export interface ResolvedTechnique { technique: Technique; score: number; viaSlot: 'inner' | 'outer' | 'substrate' }

/**
 * Deterministic. Given a drawn card, the player's loadout, and which subject
 * (self/other/collective) the card is being read in, return the techniques that
 * apply, ranked by specificity then tier.
 */
export function resolveTechniques(
  card: Pick<MoveCard, 'move' | 'operation' | 'domain' | 'capabilities'>,
  loadout: Loadout,
  subject: Subject,
  pool: Technique[],
): ResolvedTechnique[]
```

**Matching predicate** — a technique matches when ALL hold (empty tag array = wildcard):
1. `move` ∈ `technique.moves`
2. `operation` ∈ `technique.operations` (or `[]`)
3. `domain` ∈ `technique.domains` (or `[]`)
4. `channelsForCapabilities(card.capabilities)` ∩ `technique.channels` ≠ ∅ (or `technique.channels === []`)
5. **Aspect/subject**: `subject === 'self'` ⇒ active aspect `inner`; `other|collective` ⇒ `outer`. Require `technique.aspect ∈ { activeAspect, 'both' }`.
6. **Superpower/loadout**: `technique.superpowers === []` (any) OR includes the active-slot superpower OR includes `'alchemist'` (universal substrate, always eligible) → tag `viaSlot` accordingly (`substrate` when matched only via alchemy).

**Ranking**: `score` = count of non-wildcard tag matches (more specific wins); break ties by `tier` (canonical > community > personal). Stable sort.

- **Route vs Action**: none yet — this spec ships pure functions only. When a player-facing draw surface or a technique-authoring form is built (later spec), Server Actions (`{ success, error, data }`) for create/import; the resolver stays a pure import.

## User Stories

### P1: One technique, many cards
**As a deck player**, when I draw any `Clean Up` card, I want the **3-2-1 Practice** to surface as a candidate technique — at the altitude the card's Operation indicates — so I learn one named practice from the book and reuse it across dozens of situations.
**Acceptance**: A single `Technique` tagged `{ moves: ['clean_up'], aspect: 'both', superpowers: ['alchemist'] }` resolves onto all 24 Clean Up cards via `resolveTechniques`, with no per-card data.

### P2: Inner/outer swaps the lens
**As a player with loadout `{ inner: escape_artist, outer: connector }`**, I want a card read as "me" (subject=self) to surface Escape-Artist techniques and the same card read as "them" (subject=other) to surface Connector techniques.
**Acceptance**: `resolveTechniques(card, loadout, 'self')` and `(…, 'other')` return different `viaSlot` sets, and Alchemy-substrate techniques appear in both.

### P3: Import an outside practice with integrity
**As a facilitator**, I want to metabolize a wisdom-tradition practice (e.g. IFS parts work) into the library with required source lineage + an ontological-footing note, tag it, and have it auto-attach to relevant cards.
**Acceptance**: A `Technique` with `origin: 'tradition'` is rejected by validation unless `source.lineage`, `source.permission`, and `ontologicalFooting` are present; once valid, it resolves by tag.

### P4: No drift across specs
**As a maintainer**, I want exactly one definition of each axis.
**Acceptance**: `vocabulary.ts` re-exports `BasicMove/Operation/AllyshipDomain/Channel/Capability/Subject` from `allyship-deck` and `MoveAspect/AllyshipTarget` from `quest-grammar`; only `Superpower`, `Loadout`, and `Technique` are newly defined. A `npm run check` type test asserts the re-exports are identical types.

## Functional Requirements

### Phase 1: Vocabulary module (TS only, no DB)
- **FR1**: Create `src/lib/technique-library/vocabulary.ts` re-exporting canonical enums and defining `Superpower`, `Loadout`, and the channel↔emotion helpers backed by `CAPABILITIES`.
- **FR2**: Define `Technique`, `TechniqueSource`, `TechniqueTier`, `TechniqueAspect`, `TechniqueOrigin` types.
- **FR3**: Implement `resolveTechniques` as a pure function with the matching predicate + ranking above. Unit-tested.
- **FR4**: Implement `validateTechnique(t)` enforcing the provenance gate (imports require lineage + permission + footing) and tag validity (values are members of the canonical enums).

### Phase 2: Seed canonical techniques (data, no DB)
- **FR5**: Author a static `src/lib/technique-library/canonical.ts` seeding the **Tier-1 MTGOA tools** (3-2-1, Recursive 3-2-1, W.A.V.E., Grounding, Rose Tool, Contract Burning, Conscious Complaining, Happy Apples, Charge Diagnostic, Fuel Check, Roll for Resonance) with `tier: 'canonical'`, correct `source`, and tags. This is the seed of the living library and the deck↔book bridge.
- **FR6**: Provide a coverage report script `scripts/technique-coverage.ts` that, for the 120 deck cards, prints how many techniques resolve per card (find gaps — cells with no named practice yet).

### Phase 3: Persistence (Prisma) — see § Persisted data & Prisma
- **FR7**: Add/extend the `Technique` Prisma model so community/personal techniques persist; canonical stay in code. Resolver runs over the union (code canonical + DB community/personal).

## Non-Functional Requirements
- **Determinism**: `resolveTechniques` and `validateTechnique` are pure; identical inputs → identical outputs. No AI in the linking path (dual-track: works with or without LLMs).
- **No drift**: canonical enums have exactly one definition; this module re-exports, never redefines.
- **Backward compatibility**: additive only. No change to existing `MoveCard`/`allyship-deck.json` shape in Phases 1–2.
- **Extensibility**: adding a technique never requires editing card data or the resolver.

## Persisted data & Prisma (Phase 3 only)

> No schema change in Phases 1–2. Phase 3 extends the `Technique` model planned by `clean-up-technique-system` (do **not** create a competing model).

| Check | Done |
|-------|------|
| Extend `Technique` (from `clean-up-technique-system`) with columns: `operations String[]`, `domains String[]`, `channels String[]`, `aspect String`, `superpowers String[]`, `capabilities String[]`, `tier String`, `status String`, `origin String`, `sourceName/sourceAuthor/sourceLineage/sourcePermission String?`, `allyshipReframe String?`, `ontologicalFooting String?`, `optimizesFor String?`, `failureModes String[]`, `contraindications String[]`, `ownerPlayerId String?`, `pinnedCardIds String[]` | |
| `tasks.md` includes: `npx prisma migrate dev --name technique_vocabulary_tags`, commit `prisma/migrations/…` with `schema.prisma`, then `npm run db:generate` + `npm run db:record-schema-hash` | |
| Verification: `npm run db:sync` after schema edit; `npm run check` | |
| Human glanced at `migration.sql` (additive only) | |

**Do not** rely on `db push`.

## Scaling Checklist
| Touchpoint | Mitigation |
|------------|------------|
| AI calls | None in the resolution/validation path — deterministic by design. Metabolization *assistance* (drafting `allyshipReframe`) may use AI later, behind a flag; never required. |
| Filesystem | Canonical techniques are version-controlled TS, not `public/` writes. |

## Verification Quest

Deferred — this is a contract/vocabulary spec with **no user-facing surface**. A Verification Quest becomes required when the first UX surface (technique draw panel or authoring form) is specced. Until then, verification = unit tests on `resolveTechniques`/`validateTechnique` + the coverage report.

## Dependencies
- `allyship-deck` — canonical `BasicMove/Operation/AllyshipDomain/Channel/Capability/Subject` + the 120 cards + `CAPABILITIES` Rosetta table.
- `inner-outer-allyship-moves` — `MoveAspect`/`AllyshipTarget` + `move-aspect.ts` matrix.
- `clean-up-technique-system` — the base `Technique`/`PlayerTechnique` models this spec extends (Phase 3).
- `move-ecology-emergent` — proposal→candidate→canonical promotion pathway (reused for tier promotion).
- `superpower-move-extensions` — the six superpowers + domain awareness (this spec makes `Superpower` canonical and channel-agnostic).
- `nation-move-profiles` — channel↔element↔nation mapping (confirms the Rosetta table).

## References
- `src/lib/allyship-deck/types.ts`, `src/lib/allyship-deck/move-library.ts` (CAPABILITIES, SUBMOVES, AUTHORED)
- `src/lib/quest-grammar/move-aspect.ts`, `src/lib/quest-grammar/types.ts`
- MTGOA manuscript (Drive): "MTGOA (TEAL) [8/5/25]"; Part VI "Emotional Alchemy: The Game Engine" (Tier-1 tools); Part III "The Superpowers".
- Ethos: `CLAUDE.md` — "Composting, not necromancy"; "The game creates the game"; dual-track awareness.
- Prisma workflow: `.agents/skills/prisma-migration-discipline/SKILL.md`, `.cursor/rules/fail-fix-workflow.mdc`.
