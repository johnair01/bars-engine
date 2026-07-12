# Two Practice Engines — Comparison & Integration

> **Context.** The Allyship Deck's usable "practice" layer is built but orphaned, and it exists
> in **two parallel implementations** that diverge. The deck-practice-page spec calls one; the
> only built practice UI (`WorkThisCardButton`) calls the other. This doc analyzes both,
> rules on which is the stronger *spine* vs. the stronger *card-facing layer*, and specifies
> the integration — because neither is disposable and picking one wholesale loses real value.

---

## TL;DR — the ruling

- **Engine B (Charge Metabolism) is the stronger SPINE.** Vector → route → **attempt
  lifecycle** → **context binding** (esp. `campaignRef`). It's theory-true, stateful, already
  wired to working UI, and already designed to bind a practice to a *campaign* — which is
  exactly the access model just chosen (campaign-scoped deck use).
- **Engine A (Deck Practice) is the stronger CARD-FACING LAYER.** Card→tool affinity, a real
  **quick vs deep** mode split, authored step-by-step **tool protocols**, a **human-copy
  composer**, and a **per-card QA harness**. These are the parts that make a *card* usable to a
  first-timer ("mom").
- **Integrate:** put Engine A's card/tool/copy layer **on top of** Engine B's vector/route/
  attempt spine, over the one shared `alchemy` substrate. Keep A's protocols + quick/deep +
  copy; keep B's route model + lifecycle + campaign/BAR/quest binding.

---

## What each engine actually is (grounded)

### Engine A — Deck Practice
Files: `allyship-deck/practice-recommendations.ts` (`recommendDeckCardPractice`),
`practice-copy.ts` (`composeDeckPracticeCopy`), `practice-overlays.ts`, `tool-affinities.ts`,
over `alchemy/tool-registry.ts` (11 authored tools).

- **Input:** `{ card, mode: 'quick'|'deep', orientation, subject, present?, desired?, blocker?, story?, selectedToolId? }`.
- **Does:** scores the 11 emotional-alchemy **tools** against the *card* (move/operation/
  domain/outputBar affinity via `getDeckCardToolAffinities`) + optional vector + blocker
  keyword hints + mode fit. Returns `selectedTool`, `rankedTools`, the tool's authored
  `protocol` (step `{prompt, output}`), `completionCriteria`, `expectedOutputKinds`.
- **`practice-copy.ts`** composes the human-facing rep: `playerSituationSummary`, `whyThisTool`,
  `protocolIntro`, `stepCopy[]`, `expectedOutput`, `saveOrShareSummary`, `reviewFlags`.
- **`practice-overlays.ts`** is a **QA/authoring harness**: for a pilot set of 10 cards it
  pre-builds quick + deep example practices, sample vectors, preferred tools, and quality
  flags (`same_tool_collapse`, `no_quick_example`, …) with a `reviewStatus`.
- **Persistence:** none. Pure functions.

### Engine B — Charge Metabolism
Files: `charge-metabolism/recommendation-service.ts` (`recommendChargeMetabolismMove`),
`move-attempts.ts` (lifecycle), `types.ts`, over `alchemy/move-planner`,
`alchemy/show-up-primitives`, `alchemy/alchemy-graph`, `alchemy/vector-move-families`.

- **Input:** `MoveRecommendationServiceInput` = `{ present?, desired?, blocker?, orientation,
  subject, superpower, domain, cardContext?, mode?, maxAlternates? }` **plus rich context**:
  `playerId, campaignRef, stewardId, barId, questId, deckCardId, shadow321SessionId, alchemyArcId`.
- **Does:** resolves present/desired into an **AlchemyState vector**, **plans a route** through
  the alchemy graph (`planBeginnerRouteHand` / `planPracticeRoutes`) — a sequence of
  metabolize/translate/transcend edges — then recommends **Show Up primitives** for those
  edges. Returns routes, route-hand recommendations, metabolize/satisfaction picks, and
  **`MoveAttemptDraft`s**.
- **`move-attempts.ts`** is a real **lifecycle state machine**:
  `recommended → chosen → practiced → reflected → completed` (+ `skipped/abandoned/
  needs_followup`), with **guards** — e.g. `complete` *requires a trace* (artifact / reflection
  / outcome). You cannot mark a practice done with no evidence.
- **Persistence:** none in the lib (pure), but the draft/context is **shaped for persistence**
  (`deckCardId`, `campaignRef`, `barId`, `questId`) — it's built to bind.

---

## Head-to-head

| Axis | Engine A (Deck Practice) | Engine B (Charge Metabolism) |
|---|---|---|
| **Primary input** | the **card** (vector optional) | the **vector** (card is optional context) |
| **Core model** | tool recommender over 11 authored tools | route planner over the alchemy graph |
| **"How to do it" content** | **authored step protocols + composed copy** (self-contained) | Show Up primitives per route edge (content lives in primitives) |
| **Intake burden** | **low** (quick mode needs only a blocker) | **high** (needs full present+desired or it returns empty) |
| **State/lifecycle** | none — recommend + compose, stateless | **full attempt lifecycle + traceable completion** |
| **Context binding** | none (deck-local) | **campaignRef / barId / questId / deckCardId** |
| **Cross-surface** | deck-only | multi-source (`daily_charge`, `bar_capture`, `campaign_support`, …) |
| **Quality tooling** | **per-card overlay QA harness + review flags** | none |
| **Wired to UI?** | no (tests only) | yes — the (orphaned) `WorkThisCardButton` |
| **Theory fidelity** | card-biased tool pick (can collapse to same tool) | **vector→route is the deeper metabolism theory** |

---

## Which is stronger — by layer

They win at different layers, so "which is stronger" is the wrong question stated flatly:

- **Spine (state + theory + binding): Engine B.** The route model is the real metabolism
  theory; the lifecycle gives you *traceable completion*; the context fields already bind to a
  campaign. For campaign-scoped access and a measurable hypothesis, you need state and
  binding — that's B.
- **Card experience (usability + content + quality): Engine A.** `getDeckCardToolAffinities`,
  quick/deep modes, authored protocols, the copy composer, and the overlay QA harness are what
  turn a drawn card into a rep a beginner can complete. That's A.

Picking A alone → you lose lifecycle, campaign binding, and the route theory (and you keep a
recommender that admits `same_tool_collapse`). Picking B alone → you lose the card-first
affinity, the quick low-intake path, the authored copy, and the QA harness. **Both losses are
real. Integrate.**

---

## What to keep from each

**Keep from Engine B (the spine):**
1. `AlchemyState` vector + `move-planner` route model (`planBeginnerRouteHand` / `planPracticeRoutes`).
2. The `MoveAttempt` **lifecycle state machine** + **traceable-completion guard** (`move-attempts.ts`).
3. The **context binding** — `campaignRef`, `deckCardId`, `barId`, `questId` — and multi-`sourceSurface`.

**Keep from Engine A (the card layer):**
4. `getDeckCardToolAffinities` (card → tool preference).
5. The **quick vs deep** mode split (low-intake taste vs full metabolization).
6. The authored **tool protocols** (`tool-registry.ts`) + `composeDeckPracticeCopy` (human copy).
7. The **overlay QA harness** (`practice-overlays.ts`) — quality-gates cards before they ship.

---

## The integration architecture (the seam)

```
draw a card (in a campaign that owns deck access)
  │
  ├─ Engine A: getDeckCardToolAffinities(card) + mode
  │     ├─ QUICK  → low-intake: one blocker → authored tool protocol + composed copy
  │     │           → produce a concrete output (no vector required)
  │     └─ DEEP   → collect present/desired vector + blocker
  │                   │
  │                   └─ Engine B: plan route (present→desired) → route-hand
  │                        → attach Engine A's authored tool protocol as the "how"
  │                          for each metabolize/transcend edge
  │
  └─ BOTH paths emit a MoveAttempt (Engine B lifecycle),
       bound to { deckCardId, campaignRef },
       completion-guarded (needs a trace),
       NON-persisting for a taste / persisting when the campaign wants the record
```

- **One shared substrate:** both already sit on `alchemy` (A uses `tool-registry`; B uses
  `move-planner`/`show-up-primitives`) over the same `AlchemyState`. Integration means A's
  tool/copy layer *feeds* B's route/attempt spine, not two parallel stacks.
- **Tool protocols become the route's "how."** Engine B plans *what edge* to metabolize;
  Engine A supplies *the authored steps* to actually do it. Today B points at Show Up
  primitives and A's rich protocols go unused on the deep path — that's the waste the
  integration removes.
- **Completion is one lifecycle.** Quick and deep both end in a `MoveAttempt` that can complete
  only with a trace. That single completion event is what the audit (below) counts.

---

## How this serves the other two threads

### Campaign-scoped access (decided)
Engine B's context already carries `campaignRef` and a `campaign_support` source. The
integrated attempt binds a practice to the campaign, so "use the deck as a resource *for this
campaign*" is a native property, not a bolt-on. Two campaigns (Cascade Camp, MTGOA launch) =
two `campaignRef`s over the same engine.

### The hypothesis audit (to design next)
> *Playing through all Raise Awareness cards predictably increases self-defined awareness in a
> fixed window.*

The integrated engine gives you two of the three instruments for free:
1. **Per-card completion** = `MoveAttempt` in `completed` state, keyed by `deckCardId` +
   `campaignRef` (Engine B lifecycle). "Played through all RA cards" becomes countable.
2. **Fixed window** = the campaign period.
3. **Self-defined awareness measure (NET-NEW)** = a player-authored awareness definition + a
   pre/post self-rating against it. Neither engine has this; it's the one piece to build for
   the audit. Engine A's overlay QA harness is the model for proving per-card practice quality
   before the trial runs.

This is a **sibling spec** to write next: `raise-awareness-hypothesis-audit` — self-defined
awareness pre/post + completion tracking over a campaign window, in both contexts.

---

## Build order (integration, not rewrite)

1. **Adopt Engine B as the spine** for the deck practice surface; route the card layer through it.
2. **Lift Engine A onto it:** card affinities + quick/deep intake feed B's route; A's tool
   protocol + copy render the steps; both emit a `MoveAttempt`.
3. **Mount it** on the campaign-scoped deck surface (the orphaned `WorkThisCardButton` is the
   closest existing UI — reuse its intake, swap its recommender for the integrated one).
4. **Keep the overlay QA harness** pointed at the integrated output to quality-gate cards.
5. **Then** the audit spec rides on the `MoveAttempt` completion stream.

## Risks
- **Two vector resolvers** (`resolveChargeState` in B, the optional present/desired in A) must
  collapse to one, or they drift again. Pick B's `resolveFeelingState` path.
- **The orphaned code is self-labeled "prototype"** — verify it runs end-to-end before it
  fronts a launch.
- **Intake creep:** the deep path can get heavy. Protect the quick path as the default taste;
  deep is opt-in.
- **Don't let the route theory bury the card:** keep card affinity influencing tool + copy even
  when the vector determines the route (this is Engine A's existing `same_tool_collapse`
  guard — carry it into the integrated engine).

---

### Source
- Engine A: `src/lib/allyship-deck/{practice-recommendations,practice-copy,practice-overlays,tool-affinities}.ts`, `src/lib/alchemy/tool-registry.ts`.
- Engine B: `src/lib/charge-metabolism/{recommendation-service,move-attempts,types}.ts`, `src/lib/alchemy/{move-planner,show-up-primitives,alchemy-graph,vector-move-families}.ts`.
- Spec that assumes Engine A: `.specify/specs/allyship-deck-practice-page/spec.md`.
- Built UI that uses Engine B: `src/components/deck/WorkThisCardButton.tsx`.
