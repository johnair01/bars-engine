# Spec: Superpower Deck Quality

## Purpose

Define what makes a move **good**, measure the six generated superpower decks against it, and do the work to make them **robust enough to actually use**. The decks currently exist as 360 deterministically-generated `status:'draft'` cards (coherent but templated). This spec sets a **Move Quality Rubric** grounded in the MTGOA book and the base Allyship Deck's authored anatomy, a **quality-level scale**, a **gap analysis**, the **schema additions** needed to carry the missing anatomy, and a **playtest harness** that validates moves against a real campaign: *raise $8,500 for a new car*, across the four domains, the six Game Master faces (operations), and the five basic WAVE moves.

**Problem**: Generated cards have a name, a templated essence, three steps (one prompt + one aspect line + one shadow check), and tags. They lack the things that make the base deck's authored cards trustworthy: a dual self/other reading, what they optimize for, anti-patterns, failure modes, a recovery, and a working-vs-performed tell. Without these, a player can't actually deploy them in a live situation — and we can't tell a good card from a weak one.

**Practice**: Deftness Development + Ouroboros evaluate→evolve. Define the bar (spec), score against it (gap analysis), close the gap (additive schema + authored content), and prove it with a deterministic playtest over a real campaign.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Quality is defined by a rubric, not vibes** | A 12-criterion **Move Quality Rubric** (below), every criterion traceable to the book or the base deck. A move's quality level is how many criteria it meets. |
| **Quality levels L0–L4** | L0 Stub (generated template) → L1 Specific (real, enactable) → L2 Anatomized (optimizes-for / forbidden / failure / remediation + dual reading) → L3 Battle-tested (passes the body, token, consent/placement, and working-vs-performed tests; survives the campaign harness) → L4 Canonical (in-voice, human-authored, `published`). **"Usable" = L3.** |
| **Gold standard = the base deck's authored anatomy** | The base `MoveCard` carries `primaryQuestion`, `campaignQuestion`, `optimizesFor`, `forbiddenMoves`, `failureModes`, `remediation`, `flavor`. Superpower cards should reach the same anatomy. |
| **Book quality markers are the tests** | The book already encodes quality tests we adopt as rubric criteria: the **Shaman's Rule** (body as first reader: energizing? clearer? more capable? repeatable?), the **token/ticket** test (does the move increase life, or just spend you?), the **Consent Gate** and **Placement Test** (is this wanted? is this my room?), and the Diplomat's-Game **working-vs-performed tell** (each move has a test that distinguishes real use from performance). |
| **Additive schema, no migration risk** | Extend `Technique` with optional fields to carry the missing anatomy: `primaryQuestion?`, `campaignQuestion?`, `forbiddenMoves?`, `remediation?`, `tell?` (working vs performed), `example?` (a concrete enactment), `qualityLevel?`. All optional → existing data and the resolver/validator are unaffected. |
| **Generator stays; it produces L1, authoring lifts to L3/L4** | Keep the deterministic generator as the L0/L1 floor (guarantees the 60-cell grid and valid tags). Quality work = enrich `profiles.ts` (richer per-move material) + author **hero cells** by hand to L4. The generator fills anatomy from profile data where it can. |
| **Validation can enforce a target level** | Add `assessQuality(technique)` → returns the level + which criteria are unmet. A test asserts no `published` superpower card is below L3. Drafts may be any level. |
| **Proof is a deterministic playtest** | A campaign harness (`raise $8,500 for a car`) walks the base grid (move × face × domain) for a chosen loadout, surfaces each superpower card, and scores it against the rubric — producing a quality report and a punch-list of weak cells. No AI in the scoring path (deterministic checklist); AI may *assist* authoring. |

## Conceptual Model

```
Move Quality Rubric (12 criteria, from book + base deck)
        │ measured by
        ▼
assessQuality(card) → { level: L0..L4, met[], unmet[] }
        │ applied across
        ▼
Campaign Harness: "$8,500 for a car"
   loadout × (5 basic moves × 6 faces × 4 domains)
        │ produces
        ▼
Quality report → punch-list → author hero cells / enrich profiles → re-score
```

The harness reuses the existing grid: the base deck IS `move × operation(face) × domain` (120 cells). For a loadout, each cell surfaces a superpower card (via the pack pool) + base techniques; the rubric scores whether that surfaced move is actually deployable for the campaign.

## The Move Quality Rubric (12 criteria)

A move is graded on whether it meets each. Source in brackets.

**Specificity & form**
1. **Enactable now** — concrete enough to do in the next hour, not a category. [base deck `remediation`]
2. **One clear practice** — a single move with 2–4 real steps, not a bundle. [book "Game" moves]
3. **Dual reading** — names the inner felt-sense *and* the outer act (or, for an aspect-fixed card, is unmistakably one and names the other as its pair). [base deck `primaryQuestion`/`campaignQuestion`]

**Anatomy (the skill-stack)**
4. **Optimizes for** — a nameable benefit/purpose. [`optimizesFor`]
5. **Forbidden moves** — explicit anti-patterns. [`forbiddenMoves`]
6. **Failure modes** — how it goes wrong. [`failureModes`]
7. **Remediation** — a small recovery when it fails. [`remediation`]

**Trustworthiness tests**
8. **Working-vs-performed tell** — a test that distinguishes real use from performance. [Diplomat's Game tells]
9. **Shadow check** — names the superpower's overuse trap. [book superpower shadows]
10. **Body test** — passes the Shaman's Rule (energizing / clearer / more capable / repeatable). [book]
11. **Token/ticket + consent/placement** — increases life rather than just spending you; honors consent and "is this my room?" for outer moves. [book token-ticket, Consent Gate, Placement Test]

**Voice**
12. **In-voice & specific to the cell** — matches the superpower's register and is differentiated by its move, level, and aspect (not a template clone). [base deck `flavor`, MTGOA tone]

**Level mapping**: L1 = {1,2}; L2 = L1 + {3,4,5,6,7}; L3 = L2 + {8,9,10,11}; L4 = L3 + {12}.

## Data / API Contracts (additive)

Extend `Technique` (all optional — no migration, resolver/validator unaffected):

```ts
interface Technique {
  // …existing…
  primaryQuestion?: string     // introspective reading (inner)
  campaignQuestion?: string    // for-others / milestone reading (outer)
  forbiddenMoves?: string[]    // anti-patterns
  remediation?: string         // small recovery when it fails
  tell?: { working: string; performed: string }   // working-vs-performed test
  example?: string             // a concrete enactment (e.g. campaign-anchored)
  qualityLevel?: 0 | 1 | 2 | 3 | 4   // last assessed level (cached; assessQuality is source of truth)
}
```

New quality module `src/lib/technique-library/quality.ts`:

```ts
export interface QualityAssessment { level: 0|1|2|3|4; met: number[]; unmet: number[] }
export function assessQuality(t: Technique): QualityAssessment   // deterministic, criterion-by-criterion
export const RUBRIC: { id: number; name: string; group: string; source: string }[]
```

Campaign harness `src/lib/technique-library/__tests__/fixtures/campaign-car.ts` + `scripts/superpower-quality-report.ts`:

```ts
export const CAR_CAMPAIGN = {
  id: 'raise-8500-for-a-car',
  goal: 'Raise $8,500 to get a new car',
  // domain framings used to judge applicability of a surfaced move
  domainFraming: Record<AllyshipDomain, string>
}
// For a loadout, score every (move × face × domain) cell's surfaced superpower card.
```

## User Stories

### P1: Tell a good move from a weak one
**As the author**, I can run `assessQuality` on any card and see its level + exactly which criteria it fails.
**Acceptance**: current generated cards score L0/L1 with `unmet` listing the missing anatomy; a hand-authored hero cell scores L4.

### P2: Prove a deck is usable for a real campaign
**As the author**, I run the car-campaign harness for a loadout and get a per-cell quality report across domains × faces × moves, with a punch-list of cells below L3.
**Acceptance**: `scripts/superpower-quality-report.ts` prints, for `inner: escape_artist / outer: connector`, a 120-cell table and the count below L3.

### P3: Guard the published bar
**As a maintainer**, no superpower card can be `published` below L3.
**Acceptance**: a test fails if any `status:'published'` superpower card scores < L3.

## Functional Requirements

### Phase 1 — Rubric + assessment (measurement first)
- **FR1**: Additive `Technique` fields above.
- **FR2**: `quality.ts` — `RUBRIC` (12 criteria) + deterministic `assessQuality` (each criterion a pure predicate over a card's fields/tags).
- **FR3**: Tests for `assessQuality` (a stub scores low; a fully-anatomized card scores L4).

### Phase 2 — Gap analysis (this spec's `gap-analysis.md`)
- **FR4**: Score the current six decks; produce `gap-analysis.md` with the distribution, the schema gaps, the content gaps, and worked $8,500 examples (current vs target) across ≥3 domains / faces / moves.

### Phase 3 — Campaign harness
- **FR5**: `CAR_CAMPAIGN` fixture + `superpower-quality-report.ts` scoring every (move × face × domain) cell for a loadout against the rubric; emit a report + punch-list.
- **FR6**: A test asserting the harness runs and that the report is deterministic.

### Phase 4 — Close the gap (content)
- **FR7**: Enrich `profiles.ts` so the generator emits L2 anatomy (optimizesFor/forbidden/failure/remediation/tell derived from richer per-move material).
- **FR8**: Hand-author **hero cells** to L4 for the highest-value campaign coordinates (the Gathering-Resources column across faces, both aspects) for the most fundraising-relevant superpowers (Connector, Storyteller, Strategist).
- **FR9**: Guard test: no `published` superpower card below L3.

### Phase 5 — Promote (author-gated)
- **FR10**: Promote cells that reach L3+ to `published`; re-run the harness; record the lift.

## Non-Functional Requirements
- Deterministic assessment + harness; no AI in scoring.
- Additive only; base deck, resolver, validator unchanged.
- Drafts may be any level; only `published` is gated to L3+.

## Verification Quest
Deferred (no UI surface). Verification = `assessQuality` tests + the car-campaign quality report + the published-bar guard test. Becomes a real Verification Quest when a draw/authoring UI ships.

## Dependencies
- `superpower-move-decks` — the decks being graded.
- `allyship-technique-vocabulary` — `Technique`, resolver, validator.
- `allyship-deck` — the authored-anatomy gold standard + the 120-cell grid the harness walks.
- `inner-outer-allyship-moves` — the aspect duality criterion #3 leans on.

## References
- `src/lib/allyship-deck/move-library.ts` (AUTHORED cards — the L4 exemplars)
- `src/lib/allyship-deck/types.ts` (MoveCard anatomy)
- `src/lib/quest-grammar/types.ts` (`FACE_META` — the six Game Master faces)
- MTGOA: Shaman's Rule, token/ticket, Consent Gate, Placement Test, Diplomat's-Game tells
- Ethos: Ouroboros evaluate→evolve; Deftness skill
