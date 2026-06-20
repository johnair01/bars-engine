# Spec: Mobility Quest — Superpower Polarity Campaign

## Purpose

Stand up the **Mobility Quest** campaign as an interactive route, fronted by a
**superpower-discovery CYOA intake** and backed by a **tiered, scoped
skill/time donation** system that routes a player's revealed superpower toward
real campaign milestones. The organizing primitive is the spec addendum's
equation:

> **Existing Allyship Card + Selected Superpower + Orientation = Personalized Quest**

A *personalized quest* is simultaneously the unit of self-development **and** the
unit of scoped contribution — one generator (`buildDeckSeed`), three surfaces
(intake reveal, campaign hub, milestone needs).

**Problem**: The engine has a campaign object, a dual-reading deck, an inner/outer
move grammar, a CYOA intake pipeline, and milestone/contribution models — but no
seam that lets a person (1) *discover* which superpower + orientation they bring,
and (2) *apply* it as well-scoped, needle-moving help toward a specific milestone.
Today contribution is either money (DSW) or open-ended aid (`GameboardAidOffer`),
with no skill→need matching.

**Practice**: Deftness Development — spec kit first, API-first (contract before
UI), **deterministic over AI**. The superpower-and-orientation translation is
authored data (a matrix), not generated. Dual-track: the whole flow is playable
without a language model; AI is optional flavor only. Portland-AI-allergy
sensitive — the non-AI path is first-class.

## Source Material (canonical inputs)

This spec formalizes existing creator artifacts; the implementation **re-authors**
them, it does not invent the content.

| Source | Where | Role |
|--------|-------|------|
| **Superpower Polarity Addendum** | uploaded `.md` | Internal/external orientation polarity (this spec's trigger) |
| **Borogove Twine — "Wendell Support Quest"** | [`borogove-source.md`](./borogove-source.md) (extracted) | The campaign prototyped end-to-end: Start hub, Timebank, "Discover your contribution", Allyship Quests, Allyship Dojo. The voice source + structural blueprint. |
| **Superpower Strategy Guides** (6) + **Outlines** + **Compendium** | Google Drive (MtGoA), `owner: wendell@masteringallyship.com` | Canonical per-superpower content: element, Wake/Clean/Grow/Show path, **overuse/avoidance shadows** (→ internal orientation), **how it pairs with other superpowers** (→ collective deck-building). Authority for the translation matrix (FR2). |
| **Allyship Superpower Quiz** | Google Drive spreadsheet | The real basis for the discovery intake (FR5) — preferred over re-deriving from the Twine. |
| **"Mastering the Game of Allyship"** book drafts | Google Drive | Long-form voice corpus for re-authoring. |

> **Canon note (resolved):** the six canonical superpowers are **Connector ·
> Strategist · Disruptor · Storyteller · Alchemist · Escape Artist** (Drive
> guides + [`superpower-move-extensions`](../superpower-move-extensions/spec.md)).
> The addendum's **Coach** is added as a **7th** (Wendell, 2026-06-20) — Coach has
> no Drive guide yet, so its content is authored from the addendum (a Coach
> Strategy Guide is a content follow-up). The Drive **Superpower Quiz** file is an
> empty placeholder; the intake instrument is derived from the guides' diagnostics.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Superpower model = compose both axes** | A `Superpower` is a **translation layer** carrying **both** a domain emphasis (from [`superpower-move-extensions`](../superpower-move-extensions/spec.md)) **and** an `orientation` toggle (this addendum). The two prior specs are not in conflict — they are orthogonal axes that merge. |
| **Seven superpowers (canon 6 + Coach)** | Use all six canonical superpowers — **Connector, Strategist, Disruptor, Storyteller, Alchemist, Escape Artist** (Drive Strategy Guides + `superpower-move-extensions`) — **and add Coach as a 7th** (from the addendum). *(Wendell, 2026-06-20.)* Caveat: there is **no Coach Strategy Guide** in Drive yet, so Coach's matrix content is authored from the addendum's prompts (internal: "next honest step I can take"; external: "who needs support choosing/completing the next step") + element TBD; the other six derive from their guides. A Coach Strategy Guide is a content follow-up. |
| **Intake basis = the Superpower Quiz (guide-derived)** | The discovery CYOA is built on the **Allyship Superpower Quiz** *(Wendell, 2026-06-20)*. **The Drive quiz spreadsheet is currently an empty placeholder**, so the instrument is **constructed from each Strategy Guide's diagnostic content** — "Signs Someone Needs an X," the overuse/avoidance shadows, and the element/emotion signature — which is precisely quiz-scoring logic. Coach's quiz items are authored from the addendum. |
| **Orientation reuses `MoveAspect`** | The addendum's `internal`/`external` polarity **is** the existing `MoveAspect` `inner`/`outer` from [`inner-outer-allyship-moves`](../inner-outer-allyship-moves/spec.md). We do not introduce a parallel type; we map `internal→inner`, `external→outer`. Card metadata (`primaryQuestion`/`campaignQuestion`) already encodes the self/world reading. |
| **Superpower is a layer, not a card system** | Per the addendum's design principle, superpowers **translate** existing `allyship-deck.json` cards; the deck remains the single source of truth. No new card models. |
| **Move generator is the bridge** | `buildDeckSeed(card, subject)` gains `superpower` + `orientation` params. The same call powers the intake reveal quest, a player's personal quest, and a milestone-scoped contribution need. |
| **Donation is tiered** | **Tier 1 (primary): superpower-matched milestone needs** — a milestone decomposes into superpower-typed needs; players see needs matching their revealed superpower+orientation; completion writes a `MilestoneContribution`/`ContributionRecord`. **Tier 2 (fallback): open aid** — reuse existing `GameboardAidOffer` for anything unmatched. |
| **Need value = unit-typed, never weighted** (Six Faces ruling) | A need carries **`unit ∈ { action \| currency \| hours }`** + `value` (default `action`/`1`). Stewards choose the *unit* to match the milestone's target; they may **not** make one action "worth more" than another. Milestones **aggregate per unit** (honest sub-bars, never blended). Player-facing surfaces stay **discrete and dignified** (no point value shown). **Internal-orientation acts track separately** and are never dwarfed by external money/hours totals — protecting the polarity. Cross-unit equivalence is forbidden (engine must not judge). See [STRAND_CONSULT_SIX_FACES.md](./STRAND_CONSULT_SIX_FACES.md). |
| **Superpower result is per-campaign** | A player's revealed superpower + orientation is stored **per campaign** (a person may bring a different superpower to a different cause), with an optional global "primary" deferred. Resolves Open Q #1. |
| **CYOA re-authored in Wendell's voice** | The Borogove draft is **re-authored into ECI intake passages in Wendell's narrative voice** (not ported verbatim, not a generic register), preserving the choice structure + hidden weights. Voice samples sourced from the creator's archived material per CLAUDE.md § Voices. Resolves Open Q #4. |
| **Intake extends ECI, not a new engine** | The superpower CYOA ports onto the existing `cyoa-intake` pipeline (`LatentAllyshipIntake` + `resolveRouting`). We add `superpowerWeights` alongside the existing `sdWeights`, and the reveal infers **Superpower + Orientation** (in addition to / instead of move type). |
| **Translation matrix is authored data** | `translateCardForSuperpower(card, superpower, orientation)` is a deterministic function over an authored matrix (the six superpowers × internal/external from the addendum), not AI. |
| **Persistence is additive + phased** | Player superpower result and milestone-need typing are additive Prisma fields, gated to their phase with full migration discipline. Earlier phases ship type/library + UI on existing models only. |

## Conceptual Model

| Dimension | This Spec |
|-----------|-----------|
| **WHO** | Player (ally) + their revealed `Superpower` + `orientation`; campaign stewards who define milestone needs |
| **WHAT** | Personalized quests = card × superpower × orientation; milestone-scoped contribution needs |
| **WHERE** | Mobility Quest **Campaign** (`allyshipDomain`); the superpower's domain emphasis selects card pools |
| **Energy** | Vibeulons / `MilestoneContribution` value minted when a scoped need is completed |
| **Personal throughput** | The 5 WAVE moves; `orientation` = the inner/outer aspect of the enacted move |

### The two-axis superpower (the heart)

A superpower sits at the intersection of **domain emphasis** (where it naturally
works) and **orientation** (internal self-allyship ↔ external world-facing
allyship). The orientation question — *"Where is this card asking you to ally?"* —
is the addendum's UI toggle.

| Superpower | Domain emphasis | Element / emotion (from guides) | **Internal** (self-allyship) | **External** (world-facing) |
|------------|----------------|---------------------------------|------------------------------|-----------------------------|
| **Connector** | Raise Awareness, Gather Resources | (TBD — from guide) | Connect inner parts/desires/fears → parts map, values bridge | Connect people → introduction, warm handoff, relationship map |
| **Storyteller** | Raise Awareness | Water & Fire (Sadness→Poignance & Anger→Triumph) | What story am I telling myself about this quest? | What story would help others care? |
| **Strategist** | Skillful Organizing | (TBD — from guide) | Where is my energy leaking? inner strategy to preserve capacity | Where is the leverage in the world? |
| **Disruptor** | Direct Action | Fire (Anger→Triumph) | What inner rule / shame spell / false obligation to challenge? | What external assumption/norm/bottleneck to challenge? |
| **Alchemist** | Direct Action, emotional alchemy | ALL elements (master of alchemy) | What emotion must I metabolize before I can show up? | What relational tension/friction needs transforming? |
| **Escape Artist** | Direct Action (strategic exit) | Water (Sadness→Depth & meaning) | What failing inner system/attachment must I walk away from? | Where is misalignment, and who needs guiding out of a failing system? |
| **Coach** *(7th; no Drive guide yet)* | Gather Resources (capacity-building) | TBD (author w/ Coach guide) | What is the next honest step I can actually take? | Who needs support choosing & completing the next step? |

> `internal → MoveAspect 'inner'`, `external → MoveAspect 'outer'`. Each cell also
> names a **suggested artifact** (the addendum's Connector example), surfaced on
> the card display. Each guide also supplies the **overuse/avoidance shadow**
> (→ feeds internal-orientation prompts) and **how the superpower pairs with
> others** (→ the addendum's collective deck-building).

### Card display (addendum § Card Display)

A translated card shows: **Superpower · Orientation · Base Card · Translation ·
Suggested Artifact**.

### Tiered donation funnel

```
Milestone (e.g. "Raise $X for the move" / "Find 3 housing leads")
  └─ decomposes into superpower-typed Needs
       e.g. Need{ superpower: connector, orientation: external, cardId, value }
  ├─ Tier 1: matched player (revealed Connector·external) sees the Need as a
  │          scoped quest → completes → MilestoneContribution + ContributionRecord
  └─ Tier 2: unmatched capacity → open GameboardAidOffer fallback
```

## API Contracts (API-First)

> Define before Functional Requirements. Route vs Action per
> [deftness-development/reference.md](../../../.agents/skills/deftness-development/reference.md).

### Deterministic translation (pure lib — no I/O)

```ts
// src/lib/superpowers/types.ts
export type Superpower =
  | 'connector' | 'storyteller' | 'strategist'
  | 'disruptor' | 'alchemist' | 'escape_artist' | 'coach'
// 6 canonical (Drive Strategy Guides) + 'coach' (7th, from the addendum).

// Addendum orientation maps onto the existing MoveAspect.
export type SuperpowerOrientation = 'internal' | 'external'

export interface SuperpowerTranslation {
  superpower: Superpower
  orientation: SuperpowerOrientation
  baseCardId: string
  prompt: string            // the translated question
  suggestedArtifact: string // e.g. "introduction, warm handoff, relationship map"
}
```

```ts
// src/lib/superpowers/translate.ts (deterministic matrix, no AI)
export function translateCardForSuperpower(
  card: MoveCard,
  superpower: Superpower,
  orientation: SuperpowerOrientation,
): SuperpowerTranslation

/** internal→'inner', external→'outer' — bridge to inner-outer-allyship-moves. */
export function orientationToMoveAspect(o: SuperpowerOrientation): MoveAspect
```

### Move generator extension

```ts
// src/lib/allyship-deck/seed.ts (extend existing buildDeckSeed)
export function buildDeckSeed(
  card: MoveCard,
  subject: SeedSubject,
  opts?: { superpower?: Superpower; orientation?: SuperpowerOrientation },
): DeckSeed
// provenance gains { superpower, orientation } when supplied; backward-compatible.
```

### Intake reveal (Server Action — extends ECI routing)

```ts
// src/lib/cyoa-intake/resolveRouting.ts — extend the routing result
export interface SuperpowerRoutingResult {
  superpower: Superpower
  orientation: SuperpowerOrientation
  // existing fields (moveType, gmFace, sdScore…) preserved
}
// Hidden per-choice superpowerWeights accumulate along the CYOA path,
// exactly like the existing sdWeights, and resolve to the top superpower.
```

```ts
// src/actions/superpower-intake.ts ('use server')
export async function submitSuperpowerIntake(input: {
  pathJson: IntakePath
  endingPassageId: string
  campaignRef?: string
}): Promise<{ success: true; result: SuperpowerRoutingResult } | { error: string }>
```

### Milestone needs + scoped contribution (Server Actions)

```ts
// src/lib/superpowers/needs.ts — Six Faces ruling: unit-typed, never weighted
export type NeedUnit = 'action' | 'currency' | 'hours'

export interface MilestoneNeed {
  id: string
  milestoneId: string
  superpower: Superpower
  orientation: SuperpowerOrientation
  cardId: string             // the base allyship card translated into the need
  unit: NeedUnit             // default 'action'
  value: number              // in `unit`; default 1; NO per-action multiplier
  status: 'open' | 'claimed' | 'done'
  claimedByPlayerId?: string
}
```

```ts
// src/actions/milestone-needs.ts ('use server')
export async function listMilestoneNeedsForPlayer(input: {
  campaignRef: string
  superpower?: Superpower
  orientation?: SuperpowerOrientation
}): Promise<MilestoneNeed[]>   // Tier 1 matched first; Tier 2 open aid appended

export async function claimMilestoneNeed(needId: string):
  Promise<{ success: true; questId: string } | { error: string }>

export async function completeMilestoneNeed(needId: string):
  Promise<{ success: true; contributionId: string } | { error: string }>
```

- **Server Actions** for all of the above (form / React `useTransition`,
  `{ success, error, data }`).
- **No new Route Handler** — no external/webhook consumer in scope.

## User Stories

### P1: Discover my superpower
**As a campaign visitor**, I want a short CYOA that reveals my **superpower and
orientation**, so I understand how I ally (with myself and with others) before I
commit time.
**Acceptance**: completing the CYOA produces a `SuperpowerRoutingResult`; the
reveal page shows Superpower · Orientation · a translated sample card · suggested
artifact; works fully offline (deterministic).

### P2: Toggle orientation on a card
**As a player**, after choosing a superpower I want to answer *"Where is this card
asking you to ally?"* (Internal / External), so the same card becomes either a
self-allyship or a world-facing prompt.
**Acceptance**: `translateCardForSuperpower` returns the correct prompt + artifact
for all 6 superpowers × 2 orientations; when card metadata already specifies an
orientation it is honored, else the user can toggle (addendum acceptance criteria).

### P3: Apply my superpower to a milestone (scoped donation)
**As a matched player**, I want to see only the milestone needs that fit my
superpower + orientation, claim one as a bite-sized quest, and have completion
count toward the milestone, so my time visibly moves the needle.
**Acceptance**: `listMilestoneNeedsForPlayer` returns Tier-1 matched needs first,
Tier-2 open aid as fallback; `completeMilestoneNeed` writes a
`MilestoneContribution` + `ContributionRecord` and advances `currentValue`.

### P4: Works without AI
**As a Portland community member wary of AI**, I want the whole flow — CYOA,
translation, milestone matching — to be deterministic and offline-capable.
**Acceptance**: no phase 1–3 behavior depends on a language model; the matrix and
routing weights are authored data.

### P5: Verification quest
**As a steward**, I want a Twine verification quest that walks a tester through
discovering a superpower and claiming a milestone need, framed toward the
fundraiser, so we can confirm the flow before launch.

## Functional Requirements

### Phase 1 — Ontology + deterministic translation library
- **FR1**: `src/lib/superpowers/types.ts` — `Superpower`, `SuperpowerOrientation`,
  `SuperpowerTranslation`; document the orientation→`MoveAspect` mapping.
- **FR2**: `src/lib/superpowers/matrix.ts` — authored matrix (**7 superpowers** ×
  2 orientations: prompt + suggestedArtifact), exhaustive; per-superpower `domains`
  + element/emotion + overuse/avoidance shadow + pairings, **derived from the six
  Strategy Guides** (Coach authored from the addendum). Reconcile domain emphasis
  with [`superpower-move-extensions`](../superpower-move-extensions/spec.md).
- **FR3**: `src/lib/superpowers/translate.ts` — `translateCardForSuperpower`,
  `orientationToMoveAspect`; unit tests covering all 12 cells + the addendum's
  acceptance criteria (internal⇒self prompts, external⇒world prompts).
- **FR4**: Extend `buildDeckSeed` with optional `{ superpower, orientation }`;
  provenance carries them; existing callers unaffected. Unit test.

### Phase 2 — Superpower CYOA intake (reuse ECI)
- **FR5**: Extend `resolveRouting` with `superpowerWeights` accumulation →
  `SuperpowerRoutingResult` (top superpower + orientation). **Build the discovery
  CYOA from the Allyship Superpower Quiz** — since the Drive quiz file is empty,
  construct items from each Strategy Guide's "Signs Someone Needs an X" + shadows +
  element/emotion (Coach from the addendum); hidden `superpowerWeights` per choice;
  re-author copy in Wendell's voice (per Resolved Q).
- **FR6**: `submitSuperpowerIntake` server action (persists a
  `LatentAllyshipIntake` extended with the superpower result; anonymous-capable).
- **FR7**: Reveal page (`/campaign/[ref]/superpower` or a dedicated route) using
  `ComposerStepRenderer` + `CultivationCard`, rendering Superpower · Orientation ·
  translated card · suggested artifact per **UI_COVENANT** (tokens, three-channel).

### Phase 3 — Campaign route + tiered milestone needs
- **FR8**: Mobility Quest campaign hub section linking intake → reveal → "apply
  your superpower" (the needs list).
- **FR9**: `listMilestoneNeedsForPlayer` (Tier 1 matched, Tier 2 open-aid
  fallback), `claimMilestoneNeed`, `completeMilestoneNeed` server actions. Needs
  carry `unit` so the UI can group; **no per-action multiplier** (Six Faces).
- **FR10**: Need completion writes `MilestoneContribution` + `ContributionRecord`
  routed to the correct **unit bucket**, advancing the milestone's per-unit
  total (reuse existing contribution path; money needs reuse the DSW /
  barn-raising `wallKey` money path). Milestones render **honest per-unit
  sub-bars**, never one blended number.
- **FR11**: Steward UI/seed to author milestone needs (superpower + orientation +
  cardId + **unit** + value) for the Mobility Quest milestones. Stewards pick the
  unit to match the milestone target; they cannot weight one action above another.
- **FR11a**: Player-facing surfaces never display a per-action point value;
  **internal-orientation contributions are tracked separately** from external
  money/hours totals (Six Faces — protects the polarity).

### Phase 4 — Persistence hardening + Verification Quest
- **FR12**: Additive Prisma fields (see § Persisted data) with full migration
  discipline.
- **FR13**: Verification Quest `cert-mobility-superpower-v1` (Twine + idempotent
  seed), framed toward the MtGoA Launch + Barn Raising fundraiser.

## Non-Functional Requirements
- **Dual-track / no-AI-required**: deterministic matrix + routing; offline-capable;
  AI optional flavor only.
- **Backward compatible**: `buildDeckSeed` opts are optional; existing intake,
  milestones, and contributions unchanged when superpower fields are absent.
- **Community-sensitive**: reveal + need copy reviewed against Portland AI-allergy
  guidance; superpower language framed as self-knowledge, not gamified extraction.
- **UI_COVENANT compliant**: three-channel encoding, `cultivation-cards.css` +
  `card-tokens.ts`, Tailwind for layout only.
- **Reuse over rebuild**: extend ECI, `buildDeckSeed`, `CampaignMilestone`,
  `MilestoneContribution`, `GameboardAidOffer` — do not fork them.

## Persisted data & Prisma (Phase 4 only)

> Shipping a schema change without a committed migration breaks deploys. See
> [prisma-migration-discipline](../../../.agents/skills/prisma-migration-discipline/SKILL.md).

| Check | Done |
|-------|------|
| Fields named: per-campaign superpower result (e.g. on `CampaignMembership.superpower String?` + `.superpowerOrientation String?`, **not** global `Player`); `LatentAllyshipIntake.superpower String?` + `.superpowerOrientation String?`; **`MilestoneNeed`** model (or `CampaignMilestone` JSON `needsJson`) carrying `{ superpower, orientation, cardId, unit, value, status }` with `unit String @default("action")`, `value Float @default(1)`, **no multiplier field** (Six Faces) | ☐ |
| `tasks.md` includes `npx prisma migrate dev --name add_superpower_fields` + commit `prisma/migrations/…` with `schema.prisma` | ☐ |
| Verification: `npm run db:sync` after schema edit; `npm run check` | ☐ |
| Human glanced at `migration.sql` (additive, not destructive) | ☐ |

> Phases 1–3 ship **no** schema change (lib + UI on existing models; the
> superpower result may ride existing JSON/`pathJson` until Phase 4 promotes it).

## Scaling Checklist (when AI / upload / filesystem)

| Touchpoint | Mitigation |
|------------|------------|
| AI (optional flavor only) | Behind `aiEnabled()`; cache; env model override; never a dependency |
| Filesystem | Deck JSON is read-only from `public/`; no serverless writes |
| Request body | Intake `pathJson` is small; no `bodySizeLimit` change expected |

## Verification Quest (required — UX feature)
- **ID**: `cert-mobility-superpower-v1`
- **Steps**: (1) open the Mobility Quest superpower intake; (2) complete the CYOA;
  (3) see your Superpower + Orientation reveal + a translated card; (4) toggle
  orientation on the card; (5) open milestone needs, claim a matched need;
  (6) complete it and confirm the milestone advanced.
- **Framing**: toward the **MtGoA Launch + Barn Raising** fundraiser (e.g.
  "Discover your superpower and take one scoped action to help the move").
- Reference: [cyoa-certification-quests](../cyoa-certification-quests/),
  [scripts/seed-cyoa-certification-quests.ts](../../../scripts/seed-cyoa-certification-quests.ts).

## Out of Scope
- Reworking the deck's card content (deck.json stays source of truth).
- A new CYOA engine (reuse ECI / `cyoa-intake` + `ComposerStepRenderer`).
- AI generation of translations or quests (deterministic matrix only).
- Energy asymmetry of inner vs outer moves → [`energy-direction-volume`](../energy-direction-volume/spec.md).
- Reciprocity / relational weave between matched players → future.

## Resolved Questions
- **Sixth/seventh superpower** → keep canonical six (…Escape Artist) **and add
  Coach as a 7th**; Coach content authored from the addendum (no Drive guide yet).
  *(Wendell, 2026-06-20.)*
- **Intake basis** → the **Allyship Superpower Quiz**, constructed from the six
  Strategy Guides' diagnostics (the Drive quiz file is empty). *(Wendell, 2026-06-20.)*
- **Result home** → **per-campaign** (stored on `CampaignMembership`, not global
  `Player`); a player may bring a different superpower to a different cause.
  Optional global "primary" deferred. *(Wendell, 2026-06-20.)*
- **Need value units** → **unit-typed, never weighted** (`action`/`currency`/
  `hours`, default `action`/`1`); per-unit aggregation; internal orientation
  tracked separately; no cross-unit equivalence. *(Six Faces ruling —
  [STRAND_CONSULT_SIX_FACES.md](./STRAND_CONSULT_SIX_FACES.md).)*
- **Borogove import fidelity** → **re-author into ECI intake passages in
  Wendell's narrative voice**, preserving choice structure + hidden weights.
  *(Wendell, 2026-06-20.)*

## Open Questions
1. **Orientation source** — when card metadata already specifies orientation,
   suppress the toggle (addendum AC) vs always allow override? Lean: honor
   metadata, allow explicit override with a confirm.
2. **Internal-track visibility** — when a milestone has both internal and external
   tracks, is internal progress shown to the campaign at large or kept private to
   the player? Lean: aggregate internal counts shown, individual internal acts
   private. *(Raised by the Six Faces council.)*

## Dependencies / References
- Depends on: [`inner-outer-allyship-moves`](../inner-outer-allyship-moves/spec.md)
  (MoveAspect inner/outer), [`superpower-move-extensions`](../superpower-move-extensions/spec.md)
  (domain-keyed superpowers), `allyship-deck` (cards + `buildDeckSeed`),
  `cyoa-intake` (ECI routing), `CampaignMilestone`/`MilestoneContribution`.
- Related: [`donation-self-service-wizard`](../donation-self-service-wizard/spec.md)
  (money/time/space donation), `GameboardAidOffer` (Tier-2 open aid).
- Source addendum: **Mobility Quest Campaign Spec Addendum — Internal/External
  Superpower Polarity** (the file this spec formalizes).
- Draft CYOA: Borogove playtest (`https://cpq9dpsx.play.borogove.io/`).
- Code: `src/lib/allyship-deck/{seed,types,assemble}.ts`,
  `src/lib/quest-grammar/move-aspect.ts`, `src/lib/cyoa-intake/*`,
  `src/actions/campaign-contributions.ts`.
- Verification: [cyoa-certification-quests](../cyoa-certification-quests/);
  Prisma (Phase 4): [prisma-migration-discipline](../../../.agents/skills/prisma-migration-discipline/SKILL.md),
  [fail-fix-workflow](../../../.cursor/rules/fail-fix-workflow.mdc).
