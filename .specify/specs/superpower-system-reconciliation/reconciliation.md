# Superpower System Reconciliation

Two branches independently built superpower systems. This doc reconciles them into
one model so we don't ship two incompatible designs. It records the decisions
made, the target unified model, and the concrete actions per branch.

- **Branch A — `claude/admiring-shannon-wlddtw`** (this branch): the **technique
  library + superpower decks**. `src/lib/technique-library/` — `Technique` schema,
  resolver (`resolveTechniques`), citation (`citeSuperpowerMove`), 6 superpower
  decks × 60 cards, quality rubric (`assessQuality`), 24 hand-authored L4 hero
  cells, the `go-deeper` spec.
- **Branch B — `claude/determined-ramanujan-rfq6a4`**: the **quiz + intake +
  mobility campaign**. `src/lib/superpowers/` — `scoreQuiz`, item bank, result
  descriptions, routing/translate/needs engines, `SuperpowerReveal`,
  `submitSuperpowerIntake`; specs `superpower-quiz-design` &
  `mobility-quest-superpower-campaign`; `MilestoneNeed` model; `offers.ts` rework.

The two are currently disconnected — Branch B does **not** import the technique
library.

---

## Decisions (made 2026-06-20)

1. **Superpower set = 7.** Add **`coach`** to the canonical enum (Branch B's set wins).
2. **Loadout model = two superpowers**: `{ inner, outer }` — inner = self-defense
   (inner allyship), outer = help-others (outer allyship). (Not "one power +
   orientation.")
3. This document is the reconciliation deliverable; spec/code changes follow from it.

---

## Inventory: what each branch has

| Concern | Branch A (technique-library) | Branch B (superpowers/quiz) | Reconciliation |
|---|---|---|---|
| `Superpower` enum | 6, in `technique-library/vocabulary.ts` | **7** (adds `coach`), in `src/lib/superpowers/types.ts` + `SuperpowerDef`, orientation helpers | **One enum = 7.** Canonical home = `src/lib/superpowers/types.ts`; technique-library **re-exports** it (it already re-exports other axes). |
| Loadout | `Loadout { inner, outer }` (two superpowers) | `primary + secondary + orientation(internal/external)` from the quiz, DB-free | Target = **two superpowers**. Quiz output maps to inner/outer (see §Mapping). |
| Aspect / orientation | `MoveAspect = inner \| outer`; subject `self \| other \| collective` | `orientation = internal \| external`; subject `self \| campaign`; has `orientationToMoveAspect`, `orientationToSubject` | Canonical = **aspect inner/outer** + subject `self/other/collective`. "orientation/internal/external" and "campaign" are quiz-layer synonyms; keep the existing adapter fns. |
| Card → move ("go deeper") | `resolveTechniques` / `citeSuperpowerMove` over **360 authored cards** + quality gating | `SuperpowerTranslation` / `translate.ts` (lighter per-card lens) | **Content engine = technique-library** (it has the authored cards + quality). Branch B's `translate.ts` becomes a thin adapter or is retired. |
| Quiz | (none — go-deeper Slice 2 proposed one) | **Full, real** quiz: item bank, `scoreQuiz`, anti-Barnum research, reveal UI | **Quiz = Branch B.** Drop go-deeper Slice 2; consume Branch B's output. |
| Offers / SKUs | go-deeper Slice 3 proposed pack + bundle SKUs | `offers.ts` reworked: `OfferGroup`, bundles, Founding Ally Bundle | Adopt Branch B's `offers.ts` structure; add superpower pack SKUs + loadout bundle **within** it. |
| Campaign | `campaigns.ts` test lenses (car, mutual-aid, coworker) — agnostic | `mobility-quest-superpower-campaign` (a real campaign) + `MilestoneNeed` | No conflict — ours are test lenses; theirs is a real campaign. Keep both. |
| Persistence | go-deeper proposed `Player.superpowerInner/Outer` | DB-free intake (no Player fields yet) | Add `Player.superpowerInner/Outer` (Branch A's plan); Branch B's intake writes into it. |

---

## Target unified model

### 1. One `Superpower` enum (7), one home
- **Canonical home:** `src/lib/superpowers/types.ts` (Branch B) — it already carries the 7-member enum, `SUPERPOWER_DEFS`, and orientation helpers.
- `technique-library/vocabulary.ts` **stops defining** `Superpower` and instead **re-exports** it from `@/lib/superpowers/types` (consistent with how it already re-exports `BasicMove`, `Channel`, etc. — single source of truth).
- A no-drift type test (like `vocabulary-no-drift.test.ts`) asserts the re-export matches.

### 2. Add Coach to the deck system
- New profile `coach` in `technique-library/superpowers/profiles.ts`.
- Regenerate decks → **7 × 60 = 420** generated cards (was 360). Update count assertions in `superpower-decks.test.ts` and `superpower-quality` baseline.
- Coach hero cells: author later (Coach starts at the L2 floor like the others).

### 3. Loadout = two superpowers; map the quiz to it
Branch B's quiz yields `primary`, `secondary`, `orientation`. The agreed model is
`{ inner, outer }`. Two viable mappings — **pick one** (open item OQ1):

- **Option M1 (reuse quiz as-is):** orientation places the primary.
  `internal → inner = primary, outer = secondary`; `external → outer = primary,
  inner = secondary`. Zero quiz rework; deterministic.
- **Option M2 (truer to the two-superpower intent):** the quiz gains a second
  pass so it scores an **inner axis** and an **outer axis** separately; `inner =
  argmax(innerAxis)`, `outer = argmax(outerAxis)`. More faithful, more quiz work.

Recommendation: **M1 for v1** (ship now, no quiz rebuild), revisit M2 if the
inner/outer split feels off in playtest.

### 4. One translation/"go deeper" engine
- **technique-library** is the content + resolution engine (`resolveTechniques`,
  `citeSuperpowerMove`, published-card gating). The `go-deeper` spec already
  defines the server-action seam.
- Branch B's `translate.ts` / `SuperpowerTranslation`: keep only if it does
  something the resolver doesn't (a quick reveal-time lens line); otherwise retire
  to avoid two engines. Default: **retire**, point reveal copy at the resolver.

### 5. Offers
- Base on Branch B's `offers.ts` (`OfferGroup`, bundle hero treatment).
- Add: `superpower-<x>-pack` ×7, `loadout-bundle` (deck + both packs), and the
  **deferred inner-pack grant** on loadout-save (from go-deeper Slice 3).

### 6. Persistence
- `Player.superpowerInner String?`, `superpowerOuter String?`, `quizCompletedAt
  DateTime?` (go-deeper Slice 1). Branch B's `submitSuperpowerIntake` persists the
  mapped inner/outer here instead of staying DB-free.

---

## Naming standardization

| Use everywhere | Not | Bridge (keep) |
|---|---|---|
| `aspect: inner \| outer` | `orientation: internal \| external` | `orientationToMoveAspect()` adapter |
| subject `self \| other \| collective` | subject `self \| campaign` | map `campaign → other` at the quiz boundary |
| `Loadout { inner, outer }` | `primary/secondary` (loadout layer) | quiz keeps primary/secondary internally; maps out via M1 |

---

## Action items

**On the merged line (whoever integrates):**
- [x] Make `src/lib/superpowers/types.ts` the canonical `Superpower` (7); have `technique-library/vocabulary.ts` re-export it; no-drift test still holds. *(commit 36d09b2)*
- [x] **OQ1 decided = M1.** `quizResultToLoadout` (`src/lib/superpowers/quiz-loadout.ts`) maps `orientation internal → {inner: primary, outer: secondary}`, `external → swap`, `null → internal default`. Accepts both `QuizResult` and `SuperpowerRoutingResult`. *(commit 36d09b2)*
- [ ] Retire or adapter-wrap Branch B `translate.ts` in favor of the resolver. *(OQ4 — deferred)*

**Branch A (technique-library):**
- [ ] Add `coach` profile; regenerate to 420 cards; fix count tests + quality baseline.
- [ ] Update `go-deeper` spec: **drop Slice 2 (quiz)**; consume Branch B's intake; reference this doc.
- [ ] Keep decks/resolver/quality as the content engine.

**Branch B (quiz/intake):**
- [x] Persist mapped `{inner,outer}` to `Player` (use go-deeper Slice 1 fields). `submitSuperpowerIntake` now calls `saveSuperpowerLoadout` (best-effort, logged-in only) — also fires the deferred inner-pack grant for deck owners; result gains `loadoutSaved`. *(commit 36d09b2)*
- [ ] Adopt the shared aspect/subject vocabulary at the boundary.
- [ ] Coordinate `offers.ts`: superpower pack SKUs land in their structure. *(go-deeper Slice 3)*

**Merge order (suggested):** land the shared `Superpower` enum + Coach in the deck
system first (unblocks both) → merge Branch B's quiz/offers → wire go-deeper
(loadout persistence + resolver) last.

---

## Open questions
- **OQ1 — quiz→loadout mapping:** ✅ **RESOLVED = M1** (orientation places the
  primary). Implemented in `quiz-loadout.ts` (commit 36d09b2). Revisit M2 only if
  the inner/outer split feels off in playtest.
- **OQ2 — Coach's emotional channel / domain emphasis:** Branch B's `SUPERPOWER_DEFS.coach`
  defines a profile; confirm its `verb/inner/outer` row for the deck generator.
- **OQ3 — does Coach get an expansion pack** like the other 6 (7 packs), or is it
  bundled/role-specific? Affects offers + entitlement mapping.
- **OQ4 — translate.ts:** retire fully, or keep as a reveal-time lens distinct from
  the full go-deeper move?
