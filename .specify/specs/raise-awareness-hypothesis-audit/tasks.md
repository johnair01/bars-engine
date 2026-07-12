# Tasks: Raise Awareness Hypothesis Audit

Implement per [spec.md](./spec.md) and [plan.md](./plan.md). Order is bottom-up:
data → deterministic library → actions → UI → verification quest. Check each box when green.

## Phase 0 — Pre-register the measure (Ouroboros: measure before experiment)

- [ ] **T0.1** Confirm the pre-registered constants with the steward and record them in
  `src/lib/awareness-audit/constants.ts` BEFORE any trial data is collected:
  `MIN_MEANINGFUL_DELTA = 1`, `CONFIRM_POSITIVE_RATE = 0.70`, `CONFIRM_MIN_FULL_COMPLETERS = 3`,
  `CONFIRM_RANK_CORR = 0.3`. Note in the file that changing them after data collection invalidates the audit.
- [ ] **T0.2** Confirm the two `campaignRef`s for the trials (Cascade Camp, MTGOA launch) and their
  `Campaign.startDate` / `endDate` windows exist / are set.

## Phase 1 — Data (net-new, Prisma)

- [ ] **T1.1** Add `model PlayerAwarenessMeasure` to `prisma/schema.prisma` per spec § Data Contract
  (`@@unique([playerId, campaignRef])`, `awarenessDefinition`, `ratingScaleMax`, `definitionLocked`).
- [ ] **T1.2** Add `model PlayerAwarenessRating` (`@@unique([measureId, phase])`, `phase`, `rating`,
  `raCompletionCountAtRating`, `note`, `onDelete: Cascade`).
- [ ] **T2** Create migration: `npx prisma migrate dev --name add_awareness_measure`. Glance at the
  generated `migration.sql` — confirm additive (two `CREATE TABLE`, no drops).
- [ ] **T3** Commit `prisma/migrations/<ts>_add_awareness_measure/` **together with** `schema.prisma`;
  then `npm run db:record-schema-hash` and `npm run db:generate` (regenerate Prisma Client).

## Phase 2 — Deterministic library (net-new, pure, tested)

- [ ] **T4.1** `src/lib/awareness-audit/ra-card-set.ts` — derive `RA_CARD_IDS` from `move-library.ts`
  (ids matching `-RA-`); export `RA_CARD_COUNT`. **Assert length === 30** (guard so "all cards" is pinned).
- [ ] **T4.2** `src/lib/awareness-audit/types.ts` — `AwarenessMeasure`, `AwarenessRating`,
  `RaCompletionSummary`, `AwarenessAuditReport`, `AwarenessAuditVerdict`.
- [ ] **T4.3** `src/lib/awareness-audit/constants.ts` — pre-registered constants (from T0.1).
- [ ] **T5** `src/lib/awareness-audit/completion.ts` — `countRaCompletions`: distinct RA `deckCardId`s
  at `status === 'completed'` with `completedAt` in `[start, end]`, deduped. Deterministic, no I/O.
- [ ] **T6** `src/lib/awareness-audit/audit.ts` — `buildAwarenessAudit`: per-player rows, campaign
  aggregates (full-completer positive-delta rate, median delta, Spearman completion↔delta, funnel),
  `verdict`, `midpointReactivityDrift` flag, and a `directionalPilot: true` label in output.
- [ ] **T7** `src/lib/awareness-audit/__tests__/*` — table-driven: confirm path (30/30, high positive
  rate, +corr), falsify path (≤0 corr or ≤0.5 rate), inconclusive (<3 completers), window-exclusion,
  duplicate-card dedupe, missing post rating, rank-correlation math. Run `npm test`.

## Phase 3 — Server Actions (net-new)

- [ ] **T8** `src/actions/awareness-measure.ts` — `loadCompletedAttempts(playerId, campaignRef)` adapter
  (single seam over the persisted `MoveAttempt` stream; swappable to the fallback log — see dependency).
- [ ] **T9** `authorAwarenessDefinition` — membership check (`CampaignMembership`), transactional
  measure + `baseline` rating upsert, validation (non-empty definition, `0..ratingScaleMax`).
- [ ] **T10** `recordAwarenessRating` — requires baseline; one row per `(measureId, phase)`; snapshot
  `raCompletionCountAtRating` via `countRaCompletions`; `post` window/grace policy (Open Q1).
- [ ] **T11** `getAwarenessMeasure` (returns locked definition + ratings) and `getAwarenessAudit(campaignRef)`
  (steward-gated; wraps `buildAwarenessAudit`) + a cross-context wrapper over both `campaignRef`s.
- [ ] **T12** Action tests: empty definition rejected, out-of-range rating rejected, duplicate `post`
  rejected, non-member caller rejected.

## Phase 4 — UI (net-new, minimal; UI_COVENANT applies)

- [ ] **T13** Read `UI_COVENANT.md`; use `cultivation-cards.css` for aesthetic, Tailwind for layout only.
- [ ] **T14** `src/components/awareness/AwarenessDefinitionForm.tsx` — free-text definition + 0–10
  baseline; posts `authorAwarenessDefinition`. Mount on the campaign-scoped RA deck surface.
- [ ] **T15** `src/components/awareness/AwarenessPostRatingForm.tsx` — locked definition shown
  **read-only**, 0–10 rating + optional note; posts `recordAwarenessRating({ phase: 'post' })`
  (+ optional midpoint variant).
- [ ] **T16** `src/app/admin/campaign/[ref]/awareness-audit/page.tsx` — per-player table, aggregates,
  verdict block with "directional pilot" label + confound flags; cross-context comparison of both campaigns.

## Phase 5 — Verification quest (required)

- [ ] **T17** Author Twine passages for `cert-awareness-instrument-v1` (5 steps per spec; final passage
  no link → mints reward). Bruised Banana Fundraiser framing (validate instrument before MTGOA launch).
- [ ] **T18** `scripts/seed-cert-awareness-instrument.ts` — idempotent seed (`CustomBar` + `TwineStory`,
  `isSystem: true`, `visibility: 'public'`, deterministic id). Add npm script `seed:cert:awareness-instrument`.
- [ ] **T19** Run the quest end-to-end: author definition → complete ≥1 RA card → post re-rate against
  locked definition → see delta + verdict row.

## Phase 6 — Fail-fix gate

- [ ] **T20** `npm run build` — full Next.js build passes.
- [ ] **T21** `npm run check` — lint + type-check passes.
- [ ] **T22** `npm run db:sync` (client regenerated after schema) — passes.
- [ ] **T23** Check off completed tasks; confirm spec § Persisted data & Prisma checklist is satisfied.

## Dependency gate (do not skip)

- [ ] **D1** Confirm persisted `MoveAttempt` stream (keyed by `deckCardId` + `campaignRef`, with a
  `completed` status + `completedAt`) is available before the **live** trials run. It does **not** exist
  in the schema today (service-first/in-memory only). Owned by the deck-practice integration
  (handoff 2026-07-12) / `charge-metabolism-move-attempts`. If not ready, wire `loadCompletedAttempts`
  (T8) to the temporary fallback completion log with the same shape (spec Open Q5). The instrument
  (Phases 1–5) can ship and be verified independently of D1.
