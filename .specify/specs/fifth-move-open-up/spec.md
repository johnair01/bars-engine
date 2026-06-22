# Spec: Fifth Move — "Open Up"

## Purpose

Add **Open Up** as the fifth personal-throughput move, expanding the WAVE from four to five: **Wake → Open → Clean → Grow → Show**. Open Up is the receptive/generative opening — the player opens to receive (others, feedback, input), opens possibilities (reveals options that were hidden), and opens to emergence (lets something new come through) after waking to a charge and before cleaning what's in the way.

**Problem**: The engine's personal-throughput grammar is locked at four moves (`Wake/Clean/Grow/Show`) across `WaveStage`, `PersonalMoveType`, and the conceptual model. There is no move for the receptive/opening phase between noticing a charge (Wake) and clearing blockers (Clean).

**Practice**: Deftness Development — spec kit first, deterministic over AI. This is an **ontology + grammar-first** slice; UI and Nation-field rollout are explicitly deferred.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Meaning | Open Up = **all three** at once: open to *receive*, open *possibilities*, open to *emerge*. A receptive/generative move, not a single narrow function. |
| WAVE position | **After Wake, before Clean**: Wake → Open → Clean → Grow → Show. Notice the charge, then open to it, then clear the way. |
| Moves ↔ elements | **Independent.** Adding a fifth move does NOT force a 5-move-to-5-element alignment. The 15 emotional moves keep their existing `primaryWaveStage` mappings; element grammar is untouched. |
| Scope (this slice) | **Ontology + grammar only.** Update the conceptual model + foundations docs and the `quest-grammar` type unions and their exhaustive maps/arrays. **Out of scope:** `Nation.openUp` schema field, `CustomBar.moveType` data rollout, and all move UIs — deferred to a later slice. |
| Move → allyship domain | There are 4 allyship domains for 5 moves. `openUp → 'Gather Resource'` (receptivity/intake — its inner cell) for `WAVE_TO_DOMAIN`. **Resolved** (see Open Questions §1). |
| Type values | `WaveStage`: add `'Open'`. `PersonalMoveType`: add `'openUp'`. Display label: "Open Up". |

## Conceptual Model

| Dimension | This Spec |
|-----------|-----------|
| **WHO** | Player (and Nation/Archetype WAVE profiles, later) |
| **WHAT** | The personal-throughput move grammar |
| **WHERE** | `src/lib/quest-grammar/*`, `.specify/memory/conceptual-model.md`, `FOUNDATIONS.md` |
| **Energy** | Open Up is a receptive phase; it precedes the emotional-energy work of Clean Up |
| **Personal throughput** | **5 moves**: Wake Up · **Open Up** · Clean Up · Grow Up · Show Up |

**The 5 Moves (Personal Throughput):**

| Move | Meaning |
|------|---------|
| Wake Up | See more of what's available (who, what, where, how) |
| **Open Up** | **Open to receive, open possibilities, open to emergence — the receptive/generative phase after noticing a charge** |
| Clean Up | Get more emotional energy; unblock vibeulon-generating actions |
| Grow Up | Increase skill capacity through developmental lines |
| Show Up | Do the work of completing quests |

## API / Type Contracts

No runtime API surface changes. Type-level only:

```ts
// src/lib/quest-grammar/types.ts
export type WaveStage = 'Wake' | 'Open' | 'Clean' | 'Grow' | 'Show'
export type PersonalMoveType = 'wakeUp' | 'openUp' | 'cleanUp' | 'growUp' | 'showUp'
```

Adding `'openUp'` to `PersonalMoveType` makes every exhaustive `Record<PersonalMoveType, …>` and `PersonalMoveType[]` require the new key/value — these must be updated in lockstep or the build breaks (this is the intended type-safety net).

## Functional Requirements

### Phase 1 — Docs (ontology)
- **FR1**: `.specify/memory/conceptual-model.md` — "4 Moves" → "5 Moves"; add the Open Up row; update WAVE order to Wake → Open → Clean → Grow → Show; note moves stay independent of elements.
- **FR2**: `FOUNDATIONS.md` (and `ARCHITECTURE.md` if it enumerates moves) — same update.

### Phase 2 — Grammar types
- **FR3**: Add `'Open'` to `WaveStage` and `'openUp'` to `PersonalMoveType` in `types.ts`, ordered per the WAVE.

### Phase 3 — Exhaustive maps/arrays (lockstep)
- **FR4**: `WAVE_NAMES` (`choice-privileging-context.ts`) + `WAVE_LABELS` (`compileQuestCore.ts`): add `openUp: 'Open Up'`.
- **FR5**: `ALL_WAVE_MOVES` (`compileQuestCore.ts`) + `VALID_STAGES` (`archetype-wave.ts`): insert `'openUp'` in WAVE order (`['wakeUp','openUp','cleanUp','growUp','showUp']`).
- **FR6**: `WAVE_TO_DOMAIN` (`canonical-kernel.ts`): `openUp: 'Gather Resource'` (receptivity/intake — its inner cell).
- **FR7**: Parity for non-exhaustive lists/validators: `z.enum([...])` in `spoke-generator.ts`, `cyoa-intake/*`, and test arrays (`battery-6face.ts`) — add `'openUp'`.

### Phase 4 — Verify
- **FR8**: `npm run check` green; no exhaustiveness errors remain. `npm run build` route/registry steps unaffected.

## Non-Functional Requirements

- **No behavior regression** for the existing four moves: ordering changes are additive (Open Up inserted), and existing entries keep their values.
- **No Prisma change** in this slice (Nation.openUp deferred).
- **Backward compatibility**: existing `moveType` data ('wakeUp'… ) remains valid; 'openUp' is newly accepted, not required.

## Out of Scope (later slices)

- `Nation.openUp String?` schema field + migration; Archetype WAVE profiles for Open Up.
- `CustomBar.moveType` UI pickers, move dashboards, room/stage UIs that render exactly four moves.
- The 15-emotional-move engine remapping (kept independent per decision).

## Open Questions

1. ~~**Move → allyship domain** for Open Up — defaulting to `'Raise Awareness'`; should it instead be `'Gather Resource'` (receiving) or a new domain?~~ **RESOLVED (2026-06-16):** `openUp → 'Gather Resource'`. Open Up = receptivity/intake (its inner cell is Gather Resource: "opening to the emotional energy to do the work"). `WAVE_TO_DOMAIN` is narrative-flavor only (seeds Q1 of generated quests) with no progress/energy/quest-selection effect, so a single coherent mapping is correct. See FOUNDATIONS.md Wilber-divergence note. (Deeper `domain × inner/outer` two-axis model deferred to its own spec.)
2. **Element affinity** — does Open Up eventually get one or more of the 15 emotional moves mapped to it as `primaryWaveStage`, or stay element-agnostic?

## Dependencies / References

- `src/lib/quest-grammar/types.ts`, `move-engine.ts`, `compileQuestCore.ts`, `choice-privileging-context.ts`, `canonical-kernel.ts`, `archetype-wave.ts`
- `.specify/memory/conceptual-model.md`, `FOUNDATIONS.md`
- Conceptual reference: [spec-kit-translator SKILL](../../../.agents/skills/spec-kit-translator/SKILL.md) (canonical move definitions)
