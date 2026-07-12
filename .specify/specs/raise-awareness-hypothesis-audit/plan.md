# Plan: Raise Awareness Hypothesis Audit

> Implement per [.specify/specs/raise-awareness-hypothesis-audit/spec.md](./spec.md).
> **API-first:** define the instrument's Server Action signatures and the two pure library
> functions (`countRaCompletions`, `buildAwarenessAudit`) and their data shapes before any UI.
> This is a **measurement/audit**, not a new product mechanic: build the net-new self-defined
> awareness instrument and the deterministic aggregation, and **read** the completion substrate
> the deck-practice engine produces — do not rebuild that engine.

## Architecture overview

```
NET-NEW (this spec)                          DEPENDENCY (not this spec)
─────────────────────────                    ─────────────────────────
PlayerAwarenessMeasure  ─┐                    MoveAttempt persistence
PlayerAwarenessRating   ─┴─ instrument        (charge-metabolism integration)
                                              status:'completed', deckCardId, campaignRef
authorAwarenessDefinition ─ action                     │
recordAwarenessRating      ─ action                    ▼
getAwarenessMeasure        ─ read      countRaCompletions(attempts, RA set, window) → 0..30
                                                       │
buildAwarenessAudit(measures, completions) ────────────┘ → AwarenessAuditReport
                                                       │
Awareness instrument UI (enroll form, post form)  +  Steward audit view
```

Three layers, built bottom-up: **data → deterministic library → actions → UI + verification quest.**

## What is net-new vs. already present

| Piece | Status | Where |
|-------|--------|-------|
| Campaign fixed window (`startDate`/`endDate`) | **Exists** | `prisma/schema.prisma` `model Campaign` |
| Campaign membership (playerId/campaignId/role) | **Exists** | `prisma/schema.prisma` `model CampaignMembership` |
| `campaignRef` convention | **Exists** | pervasive; `MoveAttemptContext.campaignRef` |
| RA card set (30 `*-RA-*` ids) | **Exists** | `src/lib/allyship-deck/move-library.ts` |
| `MoveAttempt` lifecycle + traceable completion | **Exists (in-memory only)** | `src/lib/charge-metabolism/{types,move-attempts}.ts` |
| **Persisted `MoveAttempt` table** | **MISSING — dependency** | not in schema; owned by deck-practice integration / `charge-metabolism-move-attempts` |
| **Self-defined awareness instrument** | **NET-NEW — this spec** | new tables + actions + UI below |
| **Completion counter + audit aggregation** | **NET-NEW — this spec** | new pure lib below |

## Phase 1 — Data (net-new)

Add to `prisma/schema.prisma` (per spec § Self-Defined Awareness Data Contract):
- `model PlayerAwarenessMeasure` — one per `@@unique([playerId, campaignRef])`; `awarenessDefinition`,
  `ratingScaleMax`, `definitionLocked`.
- `model PlayerAwarenessRating` — `@@unique([measureId, phase])`; `phase`, `rating`,
  `raCompletionCountAtRating`, `note`.

Migration: `npx prisma migrate dev --name add_awareness_measure`; commit `prisma/migrations/…` with the
schema; `npm run db:record-schema-hash`; `npm run db:generate`. Additive only (two `CREATE TABLE`).

## Phase 2 — Deterministic library (net-new, pure, unit-tested)

New dir `src/lib/awareness-audit/`:

- `ra-card-set.ts` — derive the RA set from `move-library.ts` (filter ids matching `-RA-`); export
  `RA_CARD_IDS: string[]` and a `RA_CARD_COUNT = 30` constant. Assert-length guard so "all cards" is
  pinned to 30.
- `completion.ts` — `countRaCompletions(input): RaCompletionSummary`. Input carries the attempt records
  (from the persisted `MoveAttempt` stream, or the fallback log), the window, and the player/campaign.
  Counts DISTINCT RA `deckCardId`s at `status === 'completed'` with `completedAt` in-window; dedupes.
- `audit.ts` — `buildAwarenessAudit(input): AwarenessAuditReport`. Per-player rows (`raCompletionCount`,
  `baseline`, `post`, `delta`), campaign aggregates (full-completer positive-delta rate, median delta,
  Spearman rank correlation completion↔delta, enrollment→completion funnel), and the confirm/falsify
  `verdict` against pre-registered constants. Include a `midpointReactivityDrift` flag when midpoint
  ratings exist. Output self-labels "directional pilot".
- `constants.ts` — pre-registered `MIN_MEANINGFUL_DELTA = 1`, `CONFIRM_POSITIVE_RATE = 0.70`,
  `CONFIRM_MIN_FULL_COMPLETERS = 3`, `CONFIRM_RANK_CORR = 0.3`. **Fixed before trials (Ouroboros).**
- `types.ts` — `AwarenessMeasure`, `AwarenessRating`, `RaCompletionSummary`, `AwarenessAuditReport`,
  `AwarenessAuditVerdict = 'confirmed_directional' | 'falsified' | 'inconclusive'`.
- `__tests__/` — table-driven tests: 30/30 → confirm path; 0 correlation → falsify; <3 completers →
  inconclusive; out-of-window and duplicate-card dedupe cases; empty/partial ratings.

No AI, no I/O in this dir — pure functions over passed-in data (so the audit is reproducible).

## Phase 3 — Server Actions (net-new)

New file `src/actions/awareness-measure.ts` (`'use server'`), returning `{ success, error?, data? }`:
- `authorAwarenessDefinition(input)` — verifies caller is a `CampaignMembership` of `campaignRef`;
  upserts the measure + `baseline` rating in one `prisma.$transaction`; validates non-empty definition
  and `0 ≤ baselineRating ≤ ratingScaleMax`.
- `recordAwarenessRating(input)` — requires an existing baseline; enforces one row per `(measureId,
  phase)`; snapshots `raCompletionCountAtRating` by calling `countRaCompletions` over the current
  attempt stream; applies the window/grace policy for `post` (Open Question 1).
- `getAwarenessMeasure(input)` — returns measure + ratings (locked definition text for read-only post).
- `getAwarenessAudit(campaignRef)` — steward-gated read: loads measures + completion summaries, calls
  `buildAwarenessAudit`, returns the report for one campaign; a thin wrapper aggregates both
  `campaignRef`s for the cross-context view.

Completion source: these actions consume the persisted `MoveAttempt` stream. Encapsulate the read
behind a single `loadCompletedAttempts(playerId, campaignRef)` adapter so that if persistence is not
yet shipped, only that adapter swaps to the temporary fallback log (spec Dependencies / Open Q5).

## Phase 4 — UI (net-new, minimal)

- **Enroll / author form** — `src/components/awareness/AwarenessDefinitionForm.tsx`: free-text
  definition + 0–10 baseline slider/select; posts `authorAwarenessDefinition`. Mounted on the
  campaign-scoped deck surface where a member starts working the RA deck.
- **Post form** — `AwarenessPostRatingForm.tsx`: shows locked definition **read-only**, 0–10 rating,
  optional note; posts `recordAwarenessRating({ phase: 'post' })`. Optional midpoint variant.
- **Steward audit view** — `src/app/admin/campaign/[ref]/awareness-audit/page.tsx`: renders the report
  table (per-player rows), aggregates, verdict block (with the "directional pilot" label and confound
  flags). Layout via Tailwind; game aesthetic via `cultivation-cards.css` per `UI_COVENANT.md`.

## Phase 5 — Verification quest (required, UX feature)

- Twine passages per spec § Verification Quest (5 steps); `CustomBar` + `TwineStory`, `isSystem`,
  `visibility: 'public'`, deterministic id `cert-awareness-instrument-v1`.
- Seed script `scripts/seed-cert-awareness-instrument.ts` (idempotent), npm script
  `seed:cert:awareness-instrument`. Pattern: `scripts/seed-cyoa-certification-quests.ts`.
- Narrative framed toward the Bruised Banana Fundraiser (validate the instrument before the MTGOA
  launch trial).

## Files likely touched / added

**Added:**
- `prisma/schema.prisma` (two models) + `prisma/migrations/<ts>_add_awareness_measure/migration.sql`
- `src/lib/awareness-audit/{ra-card-set,completion,audit,constants,types}.ts` + `__tests__/`
- `src/actions/awareness-measure.ts`
- `src/components/awareness/{AwarenessDefinitionForm,AwarenessPostRatingForm}.tsx`
- `src/app/admin/campaign/[ref]/awareness-audit/page.tsx`
- `scripts/seed-cert-awareness-instrument.ts`

**Read / referenced (not modified):**
- `src/lib/allyship-deck/move-library.ts` (RA set derivation)
- `src/lib/charge-metabolism/{types,move-attempts}.ts` (attempt shape / lifecycle)
- `prisma/schema.prisma` `Campaign`, `CampaignMembership` (window + membership)

## Test / verification strategy

- Unit: `src/lib/awareness-audit/__tests__/*` — deterministic confirm/falsify/inconclusive tables,
  window + dedupe edge cases, rank-correlation math.
- Integration: action tests for validation (empty definition, out-of-range rating, duplicate phase,
  non-member caller).
- Manual: run the `cert-awareness-instrument-v1` verification quest end-to-end.
- Fail-fix gate: `npm run build`, `npm run check`; after schema — `npm run db:sync`,
  `npm run db:record-schema-hash`.

## Sequencing note (dependency)

The instrument (Phases 1, 3, 4) can be built and shipped **independently** of the `MoveAttempt`
persistence. The completion counter (`countRaCompletions`) is pure and testable against fixtures now;
the live audit numbers only become real once the persisted attempt stream exists (dependency). Build
the instrument first so it is validated (verification quest) before either live trial starts —
this is the Ouroboros discipline: the measure exists before the experiment.
