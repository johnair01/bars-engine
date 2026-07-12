# Spec: Allyship Deck Practice — Two-Engine Integration

## Purpose

The Allyship Deck's usable "practice" layer exists as **two parallel, diverging engines**: a
card-facing recommender (Engine A, deck-practice) and a vector→route→attempt-lifecycle spine
(Engine B, charge-metabolism). Neither is disposable. This feature **integrates** them over the
shared `alchemy` substrate: Engine B becomes the spine (vector, route, `MoveAttempt` lifecycle,
campaign binding); Engine A becomes the card-facing layer (card→tool affinity, quick/deep modes,
authored tool protocols, human-copy composer, QA overlays) mounted **on top of** it. The result is
a single unified recommender that a first-timer can use to turn a drawn card into one completable,
trace-guarded rep bound to a campaign.

**Problem**: Today the built practice UI (`WorkThisCardButton`) calls Engine B and **discards**
Engine A's authored protocols + copy on the deep path (it renders bare Show Up primitives); the
deck-practice-page spec calls Engine A and gets **no** lifecycle, campaign binding, or route
theory. Two vector resolvers exist and will drift. The winning parts of each engine never meet.

**Ruling (decided — see handoff)**: Engine B is the SPINE, Engine A is the CARD-FACING LAYER.
Integrate A onto B; do not pick one wholesale and do not rewrite either.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic
over AI. The integrated recommender is a pure function; no language model is required on either path.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Spine vs. card layer | **Engine B is the spine** (vector → route → `MoveAttempt` lifecycle → `{deckCardId, campaignRef}` binding). **Engine A is the card layer** (card→tool affinity, quick/deep split, authored protocols, copy composer, QA overlays). Ref: `src/lib/charge-metabolism/*`, `src/lib/allyship-deck/practice-*.ts`. |
| Single entry point | One unified recommender `recommendDeckPractice(input): UnifiedDeckPracticeResult` replaces direct calls to `recommendChargeMetabolismMove` and `recommendDeckCardPractice` from the deck surface. |
| One vector resolver | **Engine B's `resolveFeelingState` path is canonical** (via `resolveChargeState`, `recommendation-service.ts:17-22`). Engine A's present/desired must arrive as `ChargeStateInput` and be resolved through B once. **Kill** A's implicit "present/desired are already `AlchemyState`" assumption as a second resolver. |
| Quick vs. deep | **Quick** = low intake (blocker only, no vector required) → Engine A authored tool protocol + composed copy → completable **non-persisting** `MoveAttempt`. **Deep** = collect present/desired vector → Engine B plans the route → Engine A's protocol renders the "how" for each metabolize/transcend edge. Protect the quick path as the default taste; deep is opt-in. |
| Protocols-on-routes seam | Engine A's authored `ToolProtocolStep[]` (`tool-registry.ts` via `recommendDeckCardPractice(...).protocol`) becomes the **step content attached to Engine B's route edges**. B plans *which edge* to metabolize; A supplies *the authored steps* to do it. This is the waste the integration removes. |
| One completion lifecycle | Both quick and deep end in a `MoveAttempt` that can only `complete` with a trace — reuse B's existing guard unchanged (`move-attempts.ts:80-85`). **Non-persisting** for a taste; **persisting** when a campaign wants the record (`persist` flag). |
| Quick-path choose guard | On the quick path there are no Show Up primitives, but `choose` requires a recommended primitive id (`move-attempts.ts:73-78`). Decision: the **selected tool id acts as the chosen "primitive"** (`recommendedPrimitiveIds = [selectedTool.id]`, `chosenPrimitiveId = selectedTool.id`), so the existing lifecycle guards apply unchanged. |
| Carrying the protocol on the attempt | `MoveAttemptDraft` (`types.ts:73-94`) gains an optional `toolProtocolSnapshot` (`{ toolId, steps: ToolProtocolStep[], completionCriteria: string[] }`) so the authored "how" travels with the lifecycle object and survives persistence. |
| Campaign-scoped access | Deck practice is a **resource FOR a campaign**; access is via campaign membership. The `MoveAttempt` binds to `campaignRef`. Two live campaigns use it as separate `campaignRef`s: **Cascade Camp** and **MTGOA launch**. `sourceSurface` may be `allyship_deck` or `campaign_support`. |
| QA overlay harness | Keep `practice-overlays.ts` as the quality gate, **pointed at the integrated output**, retaining the `same_tool_collapse` flag so card affinity keeps influencing tool/copy even when the vector determines the route. |
| No persistence in this spec's engine | The unified recommender stays a **pure library function** (like both engines today). Actual DB writes for persisting attempts are a downstream concern (the sibling `raise-awareness-hypothesis-audit` spec rides the completion stream); this spec defines the `persist` intent and the shape, not the Prisma model. |
| Build approach | **Integration, not rewrite.** Adopt B as spine, lift A onto it, mount on the campaign-scoped deck surface by reusing `WorkThisCardButton`'s intake and swapping its recommender for the unified one; keep overlays as the gate. |

## Conceptual Model

Game language: a drawn card is the **WHAT** (a move lens — Wake/Open/Clean/Grow/Show through an
operation, in an allyship domain / **WHERE**). The player is **WHO** (self/other/collective). The
charge vector is **Energy** to be metabolized. **Personal throughput** is the Show Up completion —
a trace-guarded `MoveAttempt`.

```
draw a card  (in a campaign that owns deck access → campaignRef)
  │
  ├─ Engine A: getDeckCardToolAffinities(card) + mode
  │     ├─ QUICK  → low intake: one blocker → authored tool protocol + composed copy
  │     │           → concrete output, NO vector required
  │     │           → MoveAttempt (vectorStatus 'none', tool = chosen "primitive")
  │     └─ DEEP   → collect present/desired vector (+ optional blocker)
  │                   │  (present/desired resolved ONCE via B's resolveFeelingState)
  │                   └─ Engine B: plan route (present→desired) → route-hand
  │                        → attach Engine A's authored protocol as the "how"
  │                          for each metabolize/transcend edge
  │                        → MoveAttempt(s) (vectorStatus 'full', routeSnapshot present)
  │
  └─ BOTH paths → ONE MoveAttempt lifecycle, bound to { deckCardId, campaignRef },
       completion-guarded (needs a trace), NON-persisting for a taste /
       persisting when the campaign wants the record.
```

## API Contracts (API-First)

> The integrated recommender is a **pure function** (Server Action / RSC-callable, not a Route
> Handler — no external consumer or webhook). It composes Engine A and Engine B and returns one
> result. All types below are grounded in the real code cited.

### `recommendDeckPractice(input): UnifiedDeckPracticeResult`

Proposed home: `src/lib/allyship-deck/practice-engine.ts` (imports both `@/lib/charge-metabolism`
and `@/lib/allyship-deck/practice-*`). Re-exported from `@/lib/charge-metabolism` barrel so
`WorkThisCardButton` can swap its import with minimal churn.

**Input** — reconciles `DeckPracticeRecommendationInput` (`practice-recommendations.ts:22-32`) with
`MoveRecommendationServiceInput` (`types.ts:60-71`, which extends `MoveAttemptContext` `types.ts:48-58`):

```ts
import type { MoveCard } from '@/lib/allyship-deck/types'
import type { ChargeStateInput, MoveAttemptSource } from '@/lib/charge-metabolism/types'
import type { EmotionalAlchemyToolId } from '@/lib/alchemy/tool-registry'
import type { Superpower } from '@/lib/superpowers/types'

export type DeckPracticeMode = 'quick' | 'deep'          // from practice-recommendations.ts:18
export type DeckPracticeOrientation = 'internal' | 'external'
export type DeckPracticeSubject = 'self' | 'other' | 'collective'

export interface UnifiedDeckPracticeInput {
  // WHAT — the card lens (Engine A owns this)
  card: MoveCard
  mode: DeckPracticeMode

  // WHO / framing (shared by both engines)
  orientation: DeckPracticeOrientation
  subject: DeckPracticeSubject

  // Energy — the charge vector (DEEP path). Strings OR AlchemyState; resolved ONCE
  // through Engine B's resolveFeelingState (canonical resolver). Optional on quick.
  present?: ChargeStateInput
  desired?: ChargeStateInput

  // Low-intake signal — canonical for the QUICK path
  blocker?: string
  story?: string
  selectedToolId?: EmotionalAlchemyToolId

  // Spine context — campaign-scoped binding (Engine B's MoveAttemptContext)
  context: {
    deckCardId: string                 // defaults to card.id if omitted at call site
    campaignRef?: string               // Cascade Camp | MTGOA launch, etc.
    playerId?: string
    barId?: string
    questId?: string
    stewardId?: string
    sourceSurface?: MoveAttemptSource  // default 'allyship_deck'; 'campaign_support' when campaign-driven
  }

  // Lifecycle intent
  persist?: boolean                    // false (default) = taste; true = campaign wants the record
  superpower?: Superpower
  maxAlternates?: number
}
```

**Output** — carries Engine A's selection/copy, Engine B's route/state, and ONE `MoveAttemptDraft`:

```ts
import type { AlchemyState } from '@/lib/alchemy/alchemy-graph'
import type { AlchemyPracticeRoute } from '@/lib/alchemy/move-planner'
import type { EmotionalAlchemyTool, ToolOutputKind, ToolProtocolStep } from '@/lib/alchemy/tool-registry'
import type { VectorMovePracticeLens } from '@/lib/alchemy/vector-move-families'
import type { DeckPracticeRankedTool } from '@/lib/allyship-deck/practice-recommendations'
import type { DeckPracticeCopy, PracticeCopyReviewFlag } from '@/lib/allyship-deck/practice-copy'
import type {
  MoveAttemptDraft,
  MoveAttemptMissingField,
  MoveAttemptVectorStatus,
} from '@/lib/charge-metabolism/types'

export interface UnifiedDeckPracticeResult {
  mode: DeckPracticeMode

  // Engine A — card-facing selection (always present, both paths)
  cardAffinity: {
    selectedTool: EmotionalAlchemyTool
    rankedTools: DeckPracticeRankedTool[]         // practice-recommendations.ts:34-38
    selectedPracticeLens: VectorMovePracticeLens
    expectedOutputKinds: ToolOutputKind[]
  }
  protocol: ToolProtocolStep[]                     // authored "how" — the seam onto B's route edges
  copy: DeckPracticeCopy                           // practice-copy.ts:24-41 (composed human copy)

  // Engine B — spine (populated on DEEP; null/empty on QUICK)
  route: AlchemyPracticeRoute | null
  vectorStatus: MoveAttemptVectorStatus            // 'none' (quick) | 'partial' | 'full'
  presentState: AlchemyState | null
  desiredState: AlchemyState | null
  nextQuestion: string | null                      // B's intake nudge when vector incomplete on deep
  missingFields: MoveAttemptMissingField[]

  // ONE lifecycle object, bound to { deckCardId, campaignRef }, trace-guarded on complete
  attempt: MoveAttemptDraft                        // carries new toolProtocolSnapshot (see below)
  persist: boolean

  // QA — union of copy + overlay flags; carries same_tool_collapse forward
  reviewFlags: PracticeCopyReviewFlag[]
}
```

**`MoveAttemptDraft` extension** (additive; `types.ts:73-94`):

```ts
// NEW optional field so Engine A's authored protocol travels with Engine B's lifecycle object
toolProtocolSnapshot?: {
  toolId: EmotionalAlchemyToolId
  steps: ToolProtocolStep[]
  completionCriteria: string[]
}
```

**Route vs. Action**: `recommendDeckPractice` is a pure library call used from a Server Component /
Server Action (`WorkThisCardButton` intake), returning `{ success, error, data }`-style results at
the action boundary. No Route Handler — there is no external consumer, webhook, or public API surface.

**Lifecycle reuse (unchanged)**: `chooseMoveAttempt`, `practiceMoveAttempt`, `reflectMoveAttempt`,
`completeMoveAttempt`, `abandonMoveAttempt`, `markMoveAttemptNeedsFollowup`, `skipMoveAttemptSet`
(`move-attempts.ts`). `completeMoveAttempt` continues to require a trace (`hasTrace`,
`move-attempts.ts:34-43,80-85`) on BOTH paths.

## User Stories

### P1: One recommender for the deck surface

**As a** deck practitioner in a campaign, I want a single call that turns my drawn card into a
recommended tool, a step-by-step protocol, and a completable move, **so** I don't hit two divergent
engines or lose the card's authored guidance.

**Acceptance**: `recommendDeckPractice(input)` returns `cardAffinity`, `protocol`, `copy`, and one
`attempt` for both `mode: 'quick'` and `mode: 'deep'`. No deck-surface code calls
`recommendChargeMetabolismMove` or `recommendDeckCardPractice` directly.

### P2: Quick taste with minimal intake

**As a** first-timer ("mom") with two minutes, I want to name only a blocker and get one authored
tool protocol I can complete, **so** the deck is usable without a vector interview.

**Acceptance**: With `mode: 'quick'`, `blocker` set, and no `present`/`desired`, the result has
`vectorStatus: 'none'`, a non-null `cardAffinity.selectedTool`, a non-empty `protocol`, and an
`attempt` whose `chosenPrimitiveId === selectedTool.id`. `completeMoveAttempt` succeeds only with a
trace. `persist` defaults to `false`. No `nextQuestion` blocks completion.

### P3: Deep metabolization with authored steps on the route

**As a** practitioner with a real charge, I want the deck to plan a route from where I am to where I
want to be **and** show authored steps for each edge, **so** deep work is theory-true *and* legible.

**Acceptance**: With `mode: 'deep'` and both `present`/`desired` supplied (as strings or
`AlchemyState`), the result has `vectorStatus: 'full'`, a non-null `route`, and `attempt`
`routeSnapshot` populated, **and** `attempt.toolProtocolSnapshot.steps` equals Engine A's authored
protocol for the selected tool (not bare Show Up primitives). The present/desired were resolved
through B's `resolveFeelingState`.

### P4: One completion lifecycle, campaign-bound

**As a** campaign steward, I want each completed practice to bind to `{deckCardId, campaignRef}` and
require a trace, **so** "played through all Raise Awareness cards" is countable per campaign.

**Acceptance**: `attempt.context.campaignRef` and `attempt.context.deckCardId` reflect the input;
`completeMoveAttempt` fails without an artifact/reflection/outcome trace; Cascade Camp and MTGOA
launch produce attempts under distinct `campaignRef`s over the same engine.

### P5: Card keeps influencing tool + copy even when the vector rules the route

**As a** deck author, I want the drawn card's affinity to shape the tool and copy even on the deep
path, **so** the card never becomes irrelevant scenery behind the route theory.

**Acceptance**: On deep, `cardAffinity.selectedTool` still reflects `getDeckCardToolAffinities(card)`
influence; the overlay harness run against integrated output still raises `same_tool_collapse` when
distinct deep samples collapse to one tool (`practice-overlays.ts:246-248`).

### P6: Mount on the existing intake, swap the recommender

**As an** implementer, I want to reuse `WorkThisCardButton`'s intake (dissatisfaction → channel →
desired → blocker → orientation) and only swap the recommender, **so** this is integration, not a UI
rewrite.

**Acceptance**: `WorkThisCardButton` builds `UnifiedDeckPracticeInput` from its existing state and
calls `recommendDeckPractice`; a mode toggle selects quick vs. deep; deep uses the full intake,
quick collapses to blocker + orientation.

### P7: Verification quest (user-facing)

See **Verification Quest** section — a Twine walkthrough proving the integrated quick + deep flow
end-to-end on the campaign-scoped deck surface, framed toward the Bruised Banana Fundraiser.

## Functional Requirements

### Phase 1: Unified contract + resolver collapse

- **FR1**: Define `UnifiedDeckPracticeInput` / `UnifiedDeckPracticeResult` exactly as in API
  Contracts, in `src/lib/allyship-deck/practice-engine.ts`.
- **FR2**: Add optional `toolProtocolSnapshot` to `MoveAttemptDraft` (`types.ts`) — additive only.
- **FR3**: Route all present/desired through Engine B's `resolveChargeState`/`resolveFeelingState`.
  Remove any code path where Engine A treats present/desired as an already-resolved second resolver.
- **FR4**: `recommendDeckPractice` composes: (a) `getDeckCardToolAffinities` + Engine A scoring for
  tool/lens/protocol/copy; (b) on deep, Engine B `recommendChargeMetabolismMove` for route + state;
  (c) one `MoveAttemptDraft` bound to `context`.

### Phase 2: Quick path

- **FR5**: Quick path requires no vector; `vectorStatus: 'none'`, `route: null`, `nextQuestion`
  must NOT block completion.
- **FR6**: Quick path emits a `MoveAttemptDraft` with `recommendedPrimitiveIds = [selectedTool.id]`,
  `chosenPrimitiveId = selectedTool.id`, `toolProtocolSnapshot` from the selected tool.
- **FR7**: `persist` defaults to `false`; a completable non-persisting attempt is the "taste."

### Phase 3: Deep path (protocols-on-routes seam)

- **FR8**: Deep path calls Engine B for `route`/`routeHandRecommendations`/state; attaches Engine A's
  authored `protocol` as `toolProtocolSnapshot` on the metabolize/transcend edge attempt(s).
- **FR9**: Preserve B's `nextQuestion`/`missingFields` when vector is partial on deep, so the intake
  can ask the next question (`recommendation-service.ts:43-48`).

### Phase 4: Completion + campaign binding

- **FR10**: Both paths reuse `move-attempts.ts` unchanged; `complete` requires a trace.
- **FR11**: `attempt.context` carries `campaignRef`, `deckCardId`, `sourceSurface` from input.
- **FR12**: `persist: true` marks the attempt for the record; the actual write is downstream
  (sibling audit spec) — this engine stays pure.

### Phase 5: QA harness + UI swap

- **FR13**: Point `practice-overlays.ts` at integrated output; keep `same_tool_collapse` and the
  quick-example checks; `reviewFlags` in the result union copy + overlay flags.
- **FR14**: `WorkThisCardButton` swaps `recommendChargeMetabolismMove` → `recommendDeckPractice`,
  adds a quick/deep toggle, and renders `copy.stepCopy` / `protocol` for the "how."

## Non-Functional Requirements

- **Backward compatibility**: `MoveAttemptDraft` change is additive; existing `recommendChargeMetabolismMove`
  and `recommendDeckCardPractice` remain callable (the deck surface just stops calling them directly).
- **Determinism**: pure functions; identical input → identical output; no LM on either path.
- **Non-AI first-class**: the whole flow works with zero model calls (Portland community allergy).
- **Performance**: synchronous, in-memory; no added I/O in the recommender.

## Non-Goals

- Rewriting either engine, the 120 card bodies, or `WorkThisCardButton`'s intake UI.
- Prisma models / DB persistence for attempts. `MoveAttempt` persistence is owned upstream by
  `.specify/specs/charge-metabolism-move-attempts/spec.md` (the producer owns the record) and is
  realized when this integration is implemented; the `raise-awareness-hypothesis-audit` spec only
  *consumes* that completion stream.
- The self-defined awareness pre/post measure (NET-NEW — owned by the sibling audit spec).
- New campaign access-control system (campaign membership already gates deck access).
- Merging `resolveFeelingState` internals — only collapsing the deck surface onto it.
- Adding new tools, routes, or Show Up primitives.

## Persisted data & Prisma

No `schema.prisma` change in this spec. The unified recommender stays a pure function; `persist: true`
records **intent** only. The `MoveAttempt` Prisma model + write path are owned by
`.specify/specs/charge-metabolism-move-attempts/spec.md` (the producer of attempts owns their
persistence, not the auditor that reads them); implementing this integration is what motivates
realizing that model. The `raise-awareness-hypothesis-audit` spec **consumes**
`recommendDeckPractice(...).attempt` via a `loadCompletedAttempts` adapter and adds only the
awareness-measure tables. If any implementer adds a write here, move it into a Persisted-data section
with a `migrate dev` task per the template — do not `db push`.

## Verification Quest (required — user-facing)

- **ID**: `cert-deck-practice-integration-v1`
- **Frame (Bruised Banana Fundraiser)**: "Verify the integrated deck practice so campaign guests can
  take a card from stuck to a completed, trace-backed move at the residency launch." Ties to engine
  improvement + campaign (Cascade Camp / MTGOA) readiness.
- **Steps (one Twine passage each; final passage has no link so completion mints the reward)**:
  1. Open a campaign-scoped card and choose **Quick** — name only a blocker.
  2. Confirm one authored tool + protocol steps appear with **no** vector interview.
  3. Complete the quick move by leaving a trace; confirm it refuses to complete with an empty trace.
  4. Reopen the card, choose **Deep**, and pick present + desired charge.
  5. Confirm a route appears **and** the authored protocol steps render as the route's "how."
  6. Complete the deep move with a trace; confirm the attempt shows `{deckCardId, campaignRef}`.
  7. Confirm the same card under a second `campaignRef` (MTGOA vs. Cascade Camp) is a distinct attempt.
- **Structure**: TwineStory + CustomBar, `isSystem: true`, `visibility: 'public'`, deterministic id
  `cert-deck-practice-integration-v1`, idempotent seed script. Reference:
  [`.specify/specs/cyoa-certification-quests/`](../cyoa-certification-quests/) and
  [`scripts/seed-cyoa-certification-quests.ts`](../../../scripts/seed-cyoa-certification-quests.ts).

## Risks

| Risk | Remediation |
|------|-------------|
| **Two vector resolvers drift again** | Collapse to Engine B's `resolveFeelingState` (`resolveChargeState`); FR3 removes A's second resolver. Add a test asserting string and `AlchemyState` inputs resolve identically through one path. |
| **Orphaned code is self-labeled "prototype"** | `WorkThisCardButton` copy says "for this prototype"; verify the integrated engine end-to-end (Verification Quest) before it fronts a launch. |
| **Intake creep buries the quick path** | Protect quick as the default taste (blocker-only, no vector); deep is opt-in. FR5–FR7. |
| **Route theory buries the card** | Keep `getDeckCardToolAffinities` influencing tool + copy on deep; carry `same_tool_collapse` into the integrated overlay run. P5, FR13. |
| **Quick path breaks lifecycle guards** | Tool id doubles as the chosen "primitive" so `choose`/`complete` guards apply unchanged. Design Decision + FR6. |
| **Persistence scope creep** | Keep the engine pure; `persist` is intent; the `MoveAttempt` DB model is owned by `charge-metabolism-move-attempts`, not this spec or the audit. |

## Open Questions

1. **Persistence trigger**: does `persist: true` get set by the campaign config, by the steward at
   completion, or by the player choosing "save the record"? (Affects who owns the flag.)
2. **`sourceSurface` for campaign-driven use**: should campaign-initiated deck practice use
   `campaign_support` while player-initiated uses `allyship_deck`, or always `allyship_deck` with
   `campaignRef` distinguishing? (`types.ts:17-27`.)
3. **Deep multi-edge attempts**: when B returns a route hand of >1 edge (metabolize + transcend),
   does each edge get its own `toolProtocolSnapshot`/attempt, or does the unified result expose one
   primary attempt plus alternates? (Handoff shows both `attemptDraft` and `routeHandAttemptDrafts`.)
4. **Quick path tool override**: should quick honor `selectedToolId` player override the same way
   deep does (`practice-recommendations.ts:315-325`)?
5. **Overlay pilot set**: the harness covers 10 pilot cards (`PILOT_CARD_PRACTICE_OVERLAY_IDS`).
   Do Cascade Camp / MTGOA require a specific card set (e.g. all Raise Awareness) gated before launch?

## Dependencies

- `.specify/specs/allyship-deck-practice-page/spec.md` — Engine A's product lane and
  `getDeckCardToolAffinities` contract.
- Sibling spec: `raise-awareness-hypothesis-audit` — *consumes* this completion stream and adds only
  the self-defined awareness measure (it does NOT own `MoveAttempt` persistence).
- Persistence owner: `.specify/specs/charge-metabolism-move-attempts/spec.md` — the `MoveAttempt`
  Prisma model + write path; realized when this integration is implemented.
- Source handoff: `docs/handoffs/2026-07-12-two-practice-engines-comparison-and-integration.md`.

## References

- Engine A: `src/lib/allyship-deck/practice-recommendations.ts` (`recommendDeckCardPractice`,
  `DeckPracticeRecommendationInput`, `DeckPracticeRecommendation`),
  `src/lib/allyship-deck/practice-copy.ts` (`composeDeckPracticeCopy`, `DeckPracticeCopy`),
  `src/lib/allyship-deck/practice-overlays.ts` (`same_tool_collapse`, pilot overlays),
  `src/lib/allyship-deck/tool-affinities.ts` (`getDeckCardToolAffinities`),
  `src/lib/alchemy/tool-registry.ts` (`ToolProtocolStep`, `EmotionalAlchemyTool`).
- Engine B: `src/lib/charge-metabolism/recommendation-service.ts` (`recommendChargeMetabolismMove`,
  `resolveChargeState`), `src/lib/charge-metabolism/move-attempts.ts` (lifecycle + trace guard),
  `src/lib/charge-metabolism/types.ts` (`MoveRecommendationServiceInput`, `MoveAttemptDraft`,
  `MoveAttemptContext`).
- UI to reuse: `src/components/deck/WorkThisCardButton.tsx`.
- Prisma workflow (if any write is added downstream):
  [prisma-migration-discipline skill](../../../.agents/skills/prisma-migration-discipline/SKILL.md),
  [fail-fix-workflow](../../../.cursor/rules/fail-fix-workflow.mdc).
</content>
</invoke>
