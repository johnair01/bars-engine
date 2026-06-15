# Reconciliation — handoff vs. live `johnair01/bars-engine`

> Generated 2026-06-14 against branch `claude/focused-einstein-8robqk`.
> Checks every factual claim in the handoff `README.md` against the current repo.

## Verdict

The handoff is **accurate and current**. Both `source_reference/` files are byte-identical to
the live repo, the schema columns it relies on all exist, and the maturity state machine matches.
**Two corrections** are needed before building the "Open Up" slice (§G6/§7), detailed below.

## ✅ Verified claims

| Claim (README) | Live repo | Status |
|---|---|---|
| `source_reference/bars.ts` == `src/actions/bars.ts` | identical (34,717 B) | ✅ |
| `source_reference/BarCardFace.tsx` == `src/components/bars/BarCardFace.tsx` | identical | ✅ |
| Channel columns on `CustomBar`: `title`, `description`, `nation`, `intensity`, `moveType`, `archetype`, `emotionalAlchemyTag`, `seedMetabolization` | all present (`prisma/schema.prisma:286–357`) | ✅ |
| No migration needed for the core loop | confirmed — every channel rides existing columns | ✅ |
| Maturity phases `captured → context_named → elaborated → shared_or_acted` (+ reserved `integrated`) | exact match (`src/lib/bar-seed-metabolization/types.ts:10–15`) | ✅ |
| BSM helper `mergeSeedMetabolization()` | exists (`src/lib/bar-seed-metabolization/parse.ts:59`) | ✅ |
| BSM helpers `parseSeedMetabolization` / `effectiveMaturity` | exist (`parse.ts:6`, `parse.ts:37`) | ✅ |
| `growQuestFromBar()` guards on `nationId` + `archetypeId` with the quoted message | exact (`src/actions/bars.ts:758–761`) | ✅ |
| `captureDesign` column does **not** yet exist (the one needed migration) | confirmed absent | ✅ |
| Repo ships four WAVE moves `wakeUp/cleanUp/growUp/showUp` | confirmed (`src/lib/quest-grammar/types.ts:129`) | ✅ |

## ⚠️ Corrections (apply before the "Open Up" slice)

### C1 — `updateBarSeedMaturity()` lives in `actions`, not `lib`
README §6b says advance maturity "via `updateBarSeedMaturity(barId, next)`" and implies it sits in
`@/lib/bar-seed-metabolization`. It is actually a **server action** at
`src/actions/bar-seed-metabolization.ts:63` (already consumed by
`src/components/bars/BarSeedGardenPanel.tsx`). Import it from there in `tuneBar()`. Minor, but the
import path in the README is wrong.

### C2 — "Open Up" touches `PersonalMoveType`, NOT `MovementType` (README §7 mislabels the type)
README §7 instructs adding `'openUp'` to "the `MovementType` type" in quest-grammar. **`MovementType`
is unrelated** — it is the Integral translate/transcend axis:
`type MovementType = 'translate' | 'transcend'` (`src/lib/quest-grammar/types.ts:70`).

The canonical four-move union is **`PersonalMoveType`**
(`src/lib/quest-grammar/types.ts:129`). Threading `openUp` correctly means touching **all** of:

- `src/lib/quest-grammar/types.ts:129` — `PersonalMoveType` union (add `'openUp'`)
- `src/lib/quest-grammar/compileQuestCore.ts:81` — `ALL_WAVE_MOVES` array
- `src/lib/quest-grammar/archetype-wave.ts:13` — `VALID_STAGES` array
- `src/lib/quest-grammar/deriveBarDraftFrom321.ts:13,38,53` — inline `'wakeUp'|...` unions + mapper
- `src/lib/daoe/types.ts:81` — `JourneyStage` union (parallel definition)
- `src/lib/ui/move-icons.ts` — add the 5th glyph (MoveIcon set)
- `prisma/schema.prisma:2867, 3473` — `// wakeUp | cleanUp | growUp | showUp` comments
- `packages/bars-core/src/quest-grammar/` — **duplicate** quest-grammar tree exists here too; keep parity

Ordering everywhere should become **Wake · Open · Clean · Grow · Show**.

### C3 — quest-grammar is duplicated (`src/lib` AND `packages/bars-core`)
README §7 references `packages/bars-core/src/quest-grammar`. That path exists, **but** the
app primarily imports from `src/lib/quest-grammar`. Both trees define `MovementType` independently.
Whichever is the source of truth, the `openUp` change must land in **both** to avoid drift.

## Net

Core loop (Capture → Keep → Tune) is exactly as described — safe to build to the README as-is.
The Stories composer needs the single `captureDesign` migration. The "Open Up" slice is wider than
README §7 implies and the type name there is wrong (C2) — use this doc as the corrected map.
