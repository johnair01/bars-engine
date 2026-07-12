# Plan: Allyship Deck Practice — Two-Engine Integration

> Implement per [`.specify/specs/allyship-deck-practice-integration/spec.md`](./spec.md).
> **API-first**: land `recommendDeckPractice(input): UnifiedDeckPracticeResult` and the additive
> `MoveAttemptDraft.toolProtocolSnapshot` field before touching UI. **Integration, not rewrite** —
> adopt Engine B as spine, lift Engine A onto it, keep both engines callable.

## Strategy

Engine B (charge-metabolism) is the spine; Engine A (deck-practice) is the card-facing layer. Build a
single composition module that calls both and returns one result carrying: A's tool selection +
protocol + copy, B's route + state (deep only), and one trace-guarded `MoveAttemptDraft` bound to
`{deckCardId, campaignRef}`. Collapse the two vector resolvers onto B's `resolveFeelingState`. Keep
the overlay QA harness as the gate. Swap the recommender inside the existing `WorkThisCardButton`
intake; do not rewrite its UI.

## Files to touch

### New

- **`src/lib/allyship-deck/practice-engine.ts`** — the integration seam. Exports
  `recommendDeckPractice`, `UnifiedDeckPracticeInput`, `UnifiedDeckPracticeResult`,
  `DeckPracticeMode` re-export. Imports from `@/lib/charge-metabolism` (spine) and
  `@/lib/allyship-deck/practice-recommendations` + `practice-copy` + `tool-affinities` (card layer).
- **`tests/lib/allyship-deck/practice-engine.test.ts`** (or the repo's test location) — quick/deep,
  resolver-collapse, campaign-binding, trace-guard, `same_tool_collapse` carry-forward.

### Modified

- **`src/lib/charge-metabolism/types.ts`** — add optional `toolProtocolSnapshot?: { toolId,
  steps: ToolProtocolStep[], completionCriteria: string[] }` to `MoveAttemptDraft` (import
  `ToolProtocolStep`, `EmotionalAlchemyToolId` from `@/lib/alchemy/tool-registry`). Additive only.
- **`src/lib/charge-metabolism/index.ts`** (barrel) — re-export `recommendDeckPractice` and the
  unified types so `WorkThisCardButton` swaps imports with minimal churn.
- **`src/lib/charge-metabolism/recommendation-service.ts`** — no signature change; confirm
  `resolveChargeState` (→ `resolveFeelingState`) is the single resolver the seam depends on.
  Optionally export `resolveChargeState` for the seam to resolve present/desired once.
- **`src/lib/allyship-deck/practice-recommendations.ts`** — ensure `recommendDeckCardPractice`
  receives already-resolved `AlchemyState` (present/desired) from the seam; it must not itself imply
  a second resolver. No behavior change to its scoring.
- **`src/lib/allyship-deck/practice-overlays.ts`** — repoint `composePractice` / example builders at
  the integrated output so `same_tool_collapse`, `no_quick_example`, and review status reflect the
  unified engine. Keep the pilot id set and flags.
- **`src/components/deck/WorkThisCardButton.tsx`** — swap `recommendChargeMetabolismMove` →
  `recommendDeckPractice`; add a quick/deep mode toggle; build `UnifiedDeckPracticeInput.context`
  from `card.id` + campaign context; render `copy.stepCopy` / `protocol` as the "how"; keep the
  lifecycle handlers (`chooseMoveAttempt` … `completeMoveAttempt`) unchanged.

## Merge approach (the seam)

`recommendDeckPractice(input)`:

1. **Resolve vector once** — pass `input.present` / `input.desired` (`ChargeStateInput`) through
   Engine B's `resolveChargeState` → canonical `AlchemyState | null`. This is the only resolver.
2. **Card layer (both paths)** — call `getDeckCardToolAffinities(card)` + `recommendDeckCardPractice`
   with `{ card, mode, orientation, subject, present: resolvedPresent, desired: resolvedDesired,
   blocker, story, selectedToolId }` to get `selectedTool`, `rankedTools`, `selectedPracticeLens`,
   `expectedOutputKinds`, `protocol`. Compose `copy` via `composeDeckPracticeCopy`.
3. **Deep path only** — call `recommendChargeMetabolismMove` with the full
   `MoveRecommendationServiceInput` (`present`/`desired` as the same `ChargeStateInput`, `orientation`,
   `subject`, `superpower`, `domain` from the card/blocker, `cardContext`, context binding, `mode`,
   `maxAlternates`). Take `route`, `vectorStatus`, `presentState`, `desiredState`, `nextQuestion`,
   `missingFields`, and the metabolize/transcend `MoveAttemptDraft`(s).
4. **Attach the protocol to the route** — set `toolProtocolSnapshot = { toolId: selectedTool.id,
   steps: protocol, completionCriteria: selectedTool.completionCriteria }` on the emitted attempt so
   Engine A's authored "how" travels with Engine B's lifecycle object (replaces the bare Show Up
   primitive as the rendered steps).
5. **Quick path only** — no vector, no route. Synthesize one `MoveAttemptDraft`:
   `sourceSurface`, `status: 'recommended'`, `context` from `input.context`, `vectorStatus: 'none'`,
   `recommendedPrimitiveIds: [selectedTool.id]`, `chosenPrimitiveId: selectedTool.id`,
   `toolProtocolSnapshot` as above. This preserves `choose`/`complete` guards (`move-attempts.ts`).
6. **Assemble result** — `cardAffinity`, `protocol`, `copy`, `route` (null on quick), state fields,
   `attempt`, `persist: input.persist ?? false`, `reviewFlags` (copy flags ∪ overlay flags).

## Sequencing

1. **Contract** — add `toolProtocolSnapshot` to `MoveAttemptDraft`; define unified types in
   `practice-engine.ts`. `npm run check` clean (types compile, no UI yet).
2. **Resolver collapse** — wire the seam to resolve present/desired once via B; assert A never
   double-resolves. Unit test string vs. `AlchemyState` parity.
3. **Quick path** — implement + test the non-persisting, trace-guarded, tool-as-primitive attempt.
4. **Deep path** — implement + test route planning, protocol-on-route attachment, campaign binding,
   `nextQuestion` passthrough on partial vector.
5. **QA harness** — repoint overlays at integrated output; keep `same_tool_collapse`; test the
   carry-forward on distinct deep samples.
6. **UI swap** — `WorkThisCardButton`: quick/deep toggle, `recommendDeckPractice`, render protocol/
   copy; keep lifecycle handlers. Manual pass of the flow.
7. **Verification quest** — Twine passages (spec §Verification Quest) + seed script + npm script
   `seed:cert:deck-practice-integration`, following `cyoa-certification-quests`.
8. **Fail-fix** — `npm run build` and `npm run check`; verify end-to-end before it fronts a launch.

## Verification quest wiring (required — user-facing)

- **Passages (steps)**: the 7 steps in spec §Verification Quest (quick taste → trace guard → deep
  route → protocol-on-route → campaign binding → second `campaignRef`). Final passage has no link so
  completion mints the reward.
- **Seed script**: `scripts/seed-cert-deck-practice-integration.ts` — idempotent; TwineStory +
  CustomBar `isSystem: true`, `visibility: 'public'`, deterministic id
  `cert-deck-practice-integration-v1`. Pattern:
  [`scripts/seed-cyoa-certification-quests.ts`](../../../scripts/seed-cyoa-certification-quests.ts).
- **npm script**: `seed:cert:deck-practice-integration`.
- **Fundraiser frame**: engine improvement + Cascade Camp / MTGOA launch readiness (Bruised Banana).

## Risks & mitigations (implementation-level)

- **Additive type change ripples** — `toolProtocolSnapshot` is optional; existing
  `draftForRecommendation` (`recommendation-service.ts:64-99`) keeps compiling. Only the seam sets it.
- **Quick path lifecycle** — verify `choose` accepts `selectedTool.id` as a recommended primitive
  (guard `uniquePrimitiveId`, `move-attempts.ts:45-52`); test explicitly.
- **Overlay drift** — the harness composes many examples; keep it pointed at the seam so review flags
  describe what actually ships, not Engine A in isolation.
- **Barrel import churn** — re-export from `@/lib/charge-metabolism` so `WorkThisCardButton`'s import
  block (`WorkThisCardButton.tsx:17-28`) changes minimally.

## References

- Spec: [`./spec.md`](./spec.md). Handoff:
  `docs/handoffs/2026-07-12-two-practice-engines-comparison-and-integration.md`.
- Engine A / B source paths: see spec §References.
- Fail-fix: [`.cursor/rules/fail-fix-workflow.mdc`](../../../.cursor/rules/fail-fix-workflow.mdc).
- Verification pattern: [`.specify/specs/cyoa-certification-quests/`](../cyoa-certification-quests/).
</content>
