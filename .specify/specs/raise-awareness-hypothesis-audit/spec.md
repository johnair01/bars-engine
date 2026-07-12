# Spec: Raise Awareness Hypothesis Audit

## Purpose

Prove or falsify a single product hypothesis with a real measurement, not a vibe:

> **If a player plays through all the Raise Awareness cards, they will predictably increase
> awareness — as THEY THEMSELVES define it — within a fixed period of time.**

This spec defines the **audit instrument and measurement design**, not new product mechanics.
It rides on the completion substrate the deck-practice engines already produce (a `MoveAttempt`
in `completed` state, bound to `deckCardId` + `campaignRef`) and adds **one net-new instrument**:
a player-authored, self-defined awareness pre/post measure. The audit runs as **two parallel
trials of the same claim** in two live campaign contexts — a **Cascade Camp** campaign and a
**Mastering the Game of Allyship (MTGOA) launch** campaign — so the result is comparable across
contexts and gets a weak form of replication.

**Problem:** The Raise Awareness deck is being shipped as a campaign resource on the premise that
working it raises awareness. That premise is currently an assumption. Ouroboros discipline says:
**define the measure before running the experiment** — expose the hidden assumption (that
"awareness" is even a stable, self-consistent target) before any conclusion is drawn from the
trials. The audit output feeds back into deck/practice design (the evolutionary loop).

**Practice:** Deftness Development — spec kit first, API-first (contract before UI), deterministic
over AI. This is a measurement; the instrument must be deterministic and auditable. No language
model sits between the player's self-rating and the recorded number.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Scope of this spec | The **audit instrument + measurement design only**. It does NOT build the deck practice engine or the `MoveAttempt` persistence — those are dependencies (see Dependencies). |
| "Played through all RA cards" | **30 distinct `MoveAttempt`s in `completed` state**, one per Raise Awareness card, keyed by `deckCardId ∈ RA set` and the player's `campaignRef`, with each completion inside the campaign window. The RA set = the 30 card ids matching `*-RA-*` in `move-library.ts` (5 moves × 6 operations). |
| "Fixed period of time" | The **campaign window** `[Campaign.startDate, Campaign.endDate]`. Fixed and identical for every player in that campaign. Already in the schema — not net-new. |
| "Increase in awareness, as they themselves define it" | Measured by the **net-new self-defined awareness instrument**: a player authors their own free-text definition of the awareness they want to grow, sets a baseline self-rating, and re-rates **against their own locked definition** at the end of the window. Delta = post − baseline. |
| Self-anchored, not standardized | We deliberately do **not** impose a validated awareness scale. The hypothesis is about awareness *as the player defines it*, so the anchor must be the player's own definition. This trades external validity for construct fidelity to the claim — stated openly as a limitation. |
| Rating scale | **0–10 integer self-rating** against the player's own definition. Single number, minimal intake, supports a delta and a rank correlation. Justified below (Measurement Design). |
| Rating cadence | **Baseline at enrollment, post at end of window, optional midpoint.** NOT per-card. Per-card re-rating would maximize measurement reactivity (the act of rating repeatedly inflates the score) and conflate "did the reps" with "was asked about awareness 30 times." Pre/post isolates the window effect; the optional midpoint is diagnostic only. |
| Definition is locked after baseline | The player's baseline definition text is **shown back to them, read-only, at post**, so they re-rate the *same* construct. Guards against silent definition drift (a major confound for a self-defined measure). |
| Persistence home | Campaign-scoped, so a `Player` record exists (member via `CampaignMembership`). The instrument is **persisted** (`PlayerAwarenessMeasure` + `PlayerAwarenessRating`), unlike the anonymous deck-only patterns — because the audit must join ratings to completion counts over a window. |
| Power / honesty | N is small (two campaigns, self-selected members). This is a **directional pilot audit**, not a powered causal study. No control group. Confirm/falsify thresholds are pre-registered but interpreted as directional signal, not proof. Stated as a first-class limitation. |

## Conceptual Model

Game language (WHO / WHAT / WHERE / Energy / Personal throughput):

| Dimension | In this audit |
|-----------|---------------|
| **WHO** | An enrolled **Player** who is a member of one of the two campaigns (`CampaignMembership`). Secondary WHO: the **steward/analyst** who reads the aggregated audit. |
| **WHAT** | The **30 Raise Awareness cards** worked as reps (each = one completed `MoveAttempt`), and the **self-defined awareness instrument** (definition + baseline + post rating). |
| **WHERE** | The **Raise Awareness** allyship domain, inside two campaign contexts: **Cascade Camp** and **MTGOA launch** (two `campaignRef`s). The deck is a **campaign-scoped resource** — a player works it *for the campaign they belong to*. |
| **Energy** | Emotional energy metabolized per card, evidenced by each `MoveAttempt`'s completion trace (artifact / reflection / outcome — the lifecycle's traceable-completion guard). |
| **Personal throughput** | The 5 moves (Wake → Open → Clean → Grow → Show) × 6 operations that make up the 30 RA cards. "Playing through all RA cards" walks the full move × operation grid within the Raise Awareness WHERE. |

```
Enroll (member of campaign C)
  │
  ├─ AUTHOR awareness definition (free text)  ─┐
  ├─ SET baseline self-rating (0–10)          ─┴─→ PlayerAwarenessMeasure (playerId, campaignRef)
  │
  │        …campaign window [startDate, endDate]…
  │        work RA cards → each completed rep = MoveAttempt{ status: completed, deckCardId∈RA, campaignRef }
  │        (optional MIDPOINT re-rating against the locked definition)
  │
  └─ POST re-rating (0–10) against the SAME locked definition  ──→ PlayerAwarenessRating{ phase: post }

Audit = for each player: raCompletionCount(0..30) × awarenessDelta(post − baseline),
        aggregated per campaignRef, compared across the two contexts.
```

## API Contracts (API-First)

All actions are **Server Actions** (`'use server'`) — they back player-facing forms and a steward
audit view, not external webhooks. Shape: `{ success, error?, data? }`. The read/aggregate helper is
a pure library function so it is unit-testable and deterministic.

### `authorAwarenessDefinition` (Server Action)

**Input:** `{ playerId: string; campaignRef: string; awarenessDefinition: string; baselineRating: number; note?: string }`
**Output:** `{ success: boolean; error?: string; data?: AwarenessMeasure }`

```ts
// Creates the measure + a baseline PlayerAwarenessRating in one transaction.
// Idempotent per (playerId, campaignRef): re-submission before window end updates the draft;
// once a baseline exists and the window has advanced past enrollment, definition text locks.
function authorAwarenessDefinition(input: AuthorAwarenessDefinitionInput): Promise<ActionResult<AwarenessMeasure>>
```

### `recordAwarenessRating` (Server Action)

**Input:** `{ playerId: string; campaignRef: string; phase: 'midpoint' | 'post'; rating: number; note?: string }`
**Output:** `{ success: boolean; error?: string; data?: AwarenessRating }`

```ts
// Appends a rating row. Snapshots the current RA completion count at rating time
// (raCompletionCountAtRating) for the confound analysis. Rejects 'post' outside/ before the window
// close policy; rejects if no baseline exists.
function recordAwarenessRating(input: RecordAwarenessRatingInput): Promise<ActionResult<AwarenessRating>>
```

### `getAwarenessMeasure` (Server Action / read)

**Input:** `{ playerId: string; campaignRef: string }`
**Output:** `{ success: boolean; data?: AwarenessMeasure & { ratings: AwarenessRating[] } }` — returns the
locked definition text to display read-only at post.

### `countRaCompletions` (pure library fn — reads the MoveAttempt stream)

**Input:** `{ playerId: string; campaignRef: string; attempts: MoveAttemptRecord[]; window: { start: Date; end: Date } }`
**Output:** `{ completed: number; completedCardIds: string[]; total: 30 }`

```ts
// Deterministic. Counts DISTINCT deckCardIds in the RA set whose MoveAttempt reached
// status 'completed' with completedAt inside the window. Dedupes multiple attempts of the same card.
function countRaCompletions(input: CountRaCompletionsInput): RaCompletionSummary
```

### `buildAwarenessAudit` (pure library fn — aggregation)

**Input:** `{ campaignRef: string; measures: MeasureWithRatings[]; completions: Map<playerId, RaCompletionSummary> }`
**Output:** `AwarenessAuditReport` (per-player rows + campaign aggregates + confirm/falsify verdict fields)

- **Route Handler vs Server Action:** All player writes and the steward audit read are Server Actions.
  No external consumer needs this data, so no `/api/*` route is introduced.

## Self-Defined Awareness Data Contract (the net-new instrument)

Minimal, campaign-scoped, deterministic. Two tables: one measure per (player, campaign), many ratings.

```prisma
/// Player-authored, self-defined awareness measure — one per (player, campaign).
/// The core net-new instrument of the Raise Awareness hypothesis audit.
model PlayerAwarenessMeasure {
  id                  String   @id @default(cuid())
  playerId            String
  campaignRef         String
  /// Free text: the awareness THIS player wants to grow, in their own words. Locked after baseline.
  awarenessDefinition String
  /// Scale ceiling for self-ratings (default 0..10).
  ratingScaleMax      Int      @default(10)
  /// Set true once the window advances past enrollment; definition text becomes read-only.
  definitionLocked    Boolean  @default(false)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  ratings             PlayerAwarenessRating[]

  @@unique([playerId, campaignRef])
  @@index([campaignRef])
  @@map("player_awareness_measures")
}

/// A single self-rating against the player's own locked definition.
model PlayerAwarenessRating {
  id                        String   @id @default(cuid())
  measureId                 String
  /// 'baseline' | 'midpoint' | 'post'
  phase                     String
  /// 0..ratingScaleMax integer, self-rated against the player's own definition.
  rating                    Int
  /// Optional qualitative note (why this number).
  note                      String?
  /// Snapshot of RA completions (0..30) at the moment this rating was recorded — confound guard.
  raCompletionCountAtRating Int?
  recordedAt                DateTime @default(now())
  measure                   PlayerAwarenessMeasure @relation(fields: [measureId], references: [id], onDelete: Cascade)

  @@unique([measureId, phase])
  @@index([measureId])
  @@map("player_awareness_ratings")
}
```

Rationale for the shape:
- **Definition as free text on the measure, ratings as rows** — lets us add midpoint/post without
  schema change and snapshot the completion count per rating.
- **`@@unique([measureId, phase])`** — exactly one baseline, one midpoint, one post per player.
- **`raCompletionCountAtRating`** — links "how many reps were done" to "what the player rated" at
  that instant, which is the join the whole hypothesis turns on.
- **No PII beyond `playerId`** — the analyst reads aggregates; individual definitions stay campaign-scoped.

See **§ Persisted data & Prisma**.

## User Stories

### P1: Author my own awareness target

**As an enrolled player**, I want to write, in my own words, the awareness I want to grow and rate
where I'm starting, so the audit measures *my* target, not a generic one.

**Acceptance:** Given I am a member of a campaign, when I submit a non-empty definition and a 0–10
baseline rating, then a `PlayerAwarenessMeasure` with a `baseline` rating is created and shown back
to me. I cannot submit an empty definition or an out-of-range rating.

### P2: Re-rate against my own definition at window end

**As an enrolled player**, I want to re-rate my awareness against **the same definition I wrote**,
so my delta reflects change on my own construct, not a redefined one.

**Acceptance:** At post, my original definition is shown **read-only**; I submit a 0–10 rating; a
`post` rating is recorded with the current RA completion count snapshotted. I cannot submit a second
`post` rating (unique per phase).

### P3: Count "played through all RA cards" per player

**As the audit**, I want to count, per player, how many of the 30 RA cards reached a completed
`MoveAttempt` within the window, so "played through all RA cards" is a hard number (0..30).

**Acceptance:** `countRaCompletions` returns 30 only when 30 distinct RA `deckCardId`s each have a
`completed` attempt inside `[startDate, endDate]`; duplicate attempts of one card count once;
completions outside the window do not count.

### P4: Read the audit per campaign and across both contexts

**As the steward/analyst**, I want a per-campaign report pairing each player's completion count with
their awareness delta, plus the pre-registered confirm/falsify verdict, so I can see whether the
effect shows and whether it replicates in Cascade Camp and MTGOA.

**Acceptance:** `buildAwarenessAudit` returns per-player rows (`playerId`, `raCompletionCount`,
`baseline`, `post`, `delta`), campaign aggregates (median delta, positive-delta rate among
full-completers, completion↔delta rank correlation), and a `verdict ∈ {confirmed_directional,
falsified, inconclusive}` computed against the pre-registered thresholds — for each `campaignRef`
independently and pooled.

### P5: Verification quest (see Verification Quest section)

## Functional Requirements

### Phase 1: Instrument (net-new)

- **FR1:** Persist `PlayerAwarenessMeasure` and `PlayerAwarenessRating` per the data contract.
- **FR2:** `authorAwarenessDefinition` creates the measure + baseline rating atomically; validates
  non-empty definition and `0 ≤ baselineRating ≤ ratingScaleMax`.
- **FR3:** `recordAwarenessRating` appends `midpoint`/`post`; requires an existing baseline; snapshots
  `raCompletionCountAtRating`; enforces one row per `(measureId, phase)`.
- **FR4:** At post, the UI shows the player's locked baseline definition read-only; the action sets
  `definitionLocked = true` no later than the first post-enrollment rating.

### Phase 2: Completion read (over the dependency)

- **FR5:** `countRaCompletions` counts distinct RA `deckCardId`s with a `completed` attempt inside the
  window, deduped, deterministic. The RA set is derived from `move-library.ts` (`*-RA-*`, expect 30).
- **FR6:** A guard/test asserts the RA set has exactly 30 ids so "all cards" can never silently mean
  fewer.

### Phase 3: Measurement design (aggregation + verdict)

- **FR7:** `buildAwarenessAudit` computes per-player rows and campaign aggregates (below) and emits the
  confirm/falsify verdict against pre-registered thresholds, per campaign and pooled.
- **FR8:** The report labels itself a **directional pilot** (small N, no control) in its output, and
  surfaces the confound flags (see Risks) it can detect from data (e.g. selection: completion rate
  among enrollees; reactivity: midpoint-vs-post drift).

## Measurement Design

**Unit of analysis:** one enrolled player in one campaign.
**Independent variable:** `raCompletionCount` (0..30), from `countRaCompletions`.
**Dependent variable:** `awarenessDelta = post.rating − baseline.rating`.
**Design:** within-subject pre/post (optional midpoint), aggregated per campaign, replicated across
two campaign contexts. No control group — stated limitation.

**Aggregates per campaign:**
1. **Full-completer positive-delta rate** = share of players with `raCompletionCount == 30` who have
   `delta ≥ MIN_MEANINGFUL_DELTA`.
2. **Median delta among full-completers.**
3. **Completion↔delta association** = a rank correlation (Spearman) between `raCompletionCount` and
   `delta` across *all* enrolled players (dose-response check).
4. **Enrollment→completion funnel** = share of enrollees who reach 30 (selection/adherence context).

**Pre-registered constants (fix BEFORE the trials run — Ouroboros):**
- `MIN_MEANINGFUL_DELTA = +1` on the 0–10 scale (a one-point self-anchored move is the smallest
  change we agree to call "increase").
- `CONFIRM_POSITIVE_RATE = 0.70` and `CONFIRM_MIN_FULL_COMPLETERS = 3` per campaign.
- `CONFIRM_RANK_CORR = +0.3` (weak positive dose-response, directional).

## Acceptance Criteria — Confirm / Falsify

The hypothesis is judged **per campaign** and **pooled**. Because N is small, "confirmed" means
**confirmed-directional**, never proven.

**CONFIRMED (directional)** when *all* hold for a campaign:
- Among full-completers (`count == 30`, at least `CONFIRM_MIN_FULL_COMPLETERS`), the positive-delta
  rate `≥ CONFIRM_POSITIVE_RATE`, AND median full-completer delta `≥ MIN_MEANINGFUL_DELTA`; AND
- completion↔delta rank correlation `≥ CONFIRM_RANK_CORR` across all enrollees.
- **Cross-context:** the claim is only called "confirmed-directional overall" if it confirms in
  **both** Cascade Camp and MTGOA (replication). Confirming in one only = "context-specific signal."

**FALSIFIED** when, for a campaign with enough full-completers to judge:
- full-completer positive-delta rate `≤ 0.50` (no better than a coin flip on self-anchored ratings),
  OR median full-completer delta `≤ 0`; OR
- completion↔delta rank correlation `≤ 0` (more reps did not track more awareness).

**INCONCLUSIVE** when: fewer than `CONFIRM_MIN_FULL_COMPLETERS` full-completers (the funnel, not the
hypothesis, is what failed), or confound flags dominate (e.g. large midpoint-vs-post reactivity drift,
or near-zero enrollment→completion funnel). Inconclusive results feed back into deck/practice design
(fix adherence, shorten the deck, lengthen the window) before re-running — the evolutionary loop.

## Non-Goals

- Not building the deck practice engine, the RA cards, or the `MoveAttempt` persistence (dependencies).
- Not a standardized/validated psychometric awareness scale — the anchor is intentionally self-defined.
- Not a powered causal study, RCT, or control-group design. No claim of causation beyond directional.
- Not AI-scored — no model judges the free-text definition or the ratings.
- Not cross-campaign identity merging — a player in both campaigns has two independent measures.

## Non-Functional Requirements

- **Determinism:** `countRaCompletions` and `buildAwarenessAudit` are pure, unit-tested, no AI.
- **Privacy:** analyst reads aggregates; free-text definitions stay campaign-scoped; no export of raw
  definitions in the audit report.
- **Backward compatibility:** additive schema only; two new tables, no changes to existing models.
- **Dual-track:** the instrument is language-model-free and works on the non-AI deck path — completing
  a card by hand still mints a `MoveAttempt`; the rating form is plain input.

## Persisted data & Prisma (required — schema changes)

> Shipping a schema change without a committed migration breaks `migrate deploy`. See
> [.agents/skills/prisma-migration-discipline/SKILL.md](../../../.agents/skills/prisma-migration-discipline/SKILL.md).

| Check | Done |
|-------|------|
| Prisma models named in **Design Decisions / Data Contract** (`PlayerAwarenessMeasure`, `PlayerAwarenessRating`) | ✅ named |
| **`tasks.md`** includes: `npx prisma migrate dev --name add_awareness_measure`, commit `prisma/migrations/…` with `schema.prisma`, then `npm run db:record-schema-hash` | ✅ (tasks T2–T3) |
| **Verification:** `npm run db:sync` after schema edit; `npm run check` | ✅ (tasks) |
| **Human** glanced at new `migration.sql` (additive — two `CREATE TABLE`, no drops) | pending author |

**Do not** rely on `db push` for changes that merge to main.

## Verification Quest (required — UX feature)

- **ID:** `cert-awareness-instrument-v1`
- **Fundraiser framing:** *"Validate the awareness instrument so we can trust the Raise Awareness
  trials before the MTGOA launch and the Bruised Banana residency."* Proving the measure is itself an
  in-game artifact — the audit becomes legible in the game world (game creates the game).
- **Steps (each = one Twine passage; final passage has no link → mints reward):**
  1. Enroll in the certification campaign and open the awareness instrument.
  2. Author a free-text awareness definition and set a baseline 0–10 rating → confirm a
     `PlayerAwarenessMeasure` + baseline rating exists.
  3. Complete at least one Raise Awareness card so a `completed` `MoveAttempt` (deckCardId ∈ RA) is
     counted for you.
  4. Return to the instrument at "post"; confirm your **original definition shows read-only**; submit
     a post rating.
  5. View the mini audit row: your `raCompletionCount` and `delta` render; confirm the verdict block
     labels itself a directional pilot. (No link → reward minted.)
- **Structure:** `TwineStory` + `CustomBar`, `isSystem: true`, `visibility: 'public'`, deterministic id
  `cert-awareness-instrument-v1`, idempotent seed script.
- **Reference:** [cyoa-certification-quests](../cyoa-certification-quests/),
  [scripts/seed-cyoa-certification-quests.ts](../../../scripts/seed-cyoa-certification-quests.ts).

## Risks & Confounds

| Confound / risk | Why it threatens the claim | Mitigation in this design |
|-----------------|----------------------------|---------------------------|
| **Self-report bias** | Players may inflate post ratings to feel progress. | Report is directional only; pre-register thresholds; note qualitative `note` field for sanity-checking; never AI-smoothed. |
| **Selection bias** | Motivated players self-enroll and self-complete. | Report the enrollment→completion funnel alongside the delta; interpret full-completer effect in light of who dropped. |
| **Measurement reactivity / demand characteristics** | Repeatedly rating "awareness" inflates it independent of the reps. | Pre/post only (not per-card); optional midpoint used to *detect* reactivity drift, not to score. |
| **Definition drift** | Player redefines "awareness" between pre and post, invalidating the delta. | Definition is **locked** and shown read-only at post; re-rate the same construct. |
| **Regression to the mean** | Extreme baselines drift toward center regardless of reps. | Rank-correlation dose-response check across the full range, not just full-completers. |
| **Window too short** | Fixed window ends before reps can matter. | Window = real campaign period; inconclusive-funnel verdict routes back to design (lengthen window / shorten deck). |
| **History / maturation** | Life events or other campaign activity move awareness. | Acknowledged; no control group — flagged as the primary threat to causal reading. |
| **Small N, no control** | Two self-selected cohorts cannot prove causation. | Labeled a directional pilot in the report output itself; cross-context replication is the only "confirmation" claimed. |

## Open Questions

1. **Post-window grace:** is `post` collected exactly at `endDate`, or within a grace window after?
   (Affects `recordAwarenessRating` window policy.)
2. **Midpoint trigger:** time-based (window midpoint) or completion-based (e.g. at 15/30 cards)? Spec
   defaults to time-based; confirm.
3. **Multi-attempt cards:** if a player completes the same RA card twice, is that richer signal or just
   a dedupe? Current design dedupes (counts the card once).
4. **Structured sub-scale:** do we want an optional 2–3 item self-anchored sub-scale (e.g. "notice /
   name / act") instead of one 0–10, to reduce single-item noise? Deferred; single-item chosen for
   minimal intake.
5. **Dependency timing:** does `MoveAttempt` persistence land before the trials, or does the pilot run
   on a temporary completion log? (See Dependencies.)

## Dependencies

- **`MoveAttempt` persistence (blocking).** The audit reads a stream of completed attempts keyed by
  `deckCardId` + `campaignRef`. Today the `charge-metabolism` lib produces `MoveAttemptDraft`s in
  memory only — there is **no persisted `MoveAttempt` model** in `prisma/schema.prisma`. Persisting it
  is out of scope here and owned by the deck-practice integration described in the handoff
  ([docs/handoffs/2026-07-12-two-practice-engines-comparison-and-integration.md](../../../docs/handoffs/2026-07-12-two-practice-engines-comparison-and-integration.md),
  "Build order" + "The hypothesis audit") and the persistence path sketched in
  [.specify/specs/charge-metabolism-move-attempts/spec.md](../charge-metabolism-move-attempts/spec.md)
  (§ `MoveAttempt`). **This spec names that dependency and does not duplicate it.** If persistence is
  not ready when the trials run, the pilot must fall back to a temporary completion log with the same
  `(playerId, campaignRef, deckCardId, completedAt)` shape (Open Question 5).
- **Campaign window + membership (already in schema).** `Campaign.startDate` / `Campaign.endDate` (the
  fixed window) and `CampaignMembership` (playerId/campaignId/role) already exist — used as-is.
- **RA card set (already in code).** `src/lib/allyship-deck/move-library.ts` — the 30 `*-RA-*` ids.

## References

- Hypothesis + instrument framing: [docs/handoffs/2026-07-12-two-practice-engines-comparison-and-integration.md](../../../docs/handoffs/2026-07-12-two-practice-engines-comparison-and-integration.md) (§ "How this serves the other two threads → The hypothesis audit").
- Completion substrate: `src/lib/charge-metabolism/{types.ts,move-attempts.ts,recommendation-service.ts}` (lifecycle, `deckCardId`/`campaignRef` context, traceable-completion guard).
- RA card grammar: `src/lib/allyship-deck/move-library.ts`, `.specify/specs/allyship-deck/move-library-core-rules.md`.
- Schema anchors: `prisma/schema.prisma` — `Campaign` (startDate/endDate), `CampaignMembership`, `CampaignPeriod`.
- Persistence dependency: `.specify/specs/charge-metabolism-move-attempts/spec.md`.
- Prisma workflow: [prisma-migration-discipline skill](../../../.agents/skills/prisma-migration-discipline/SKILL.md), [fail-fix-workflow](../../../.cursor/rules/fail-fix-workflow.mdc).
