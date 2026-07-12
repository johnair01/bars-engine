# Tasks: Allyship Deck Practice — Two-Engine Integration

> Implement per [`./spec.md`](./spec.md) and [`./plan.md`](./plan.md). API-first order: contract →
> resolver collapse → quick → deep → QA → UI → verification quest → fail-fix. Integration, not
> rewrite — both engines stay callable.

## Phase 1 — Contract (API-first)

- [ ] **T1**: Add optional `toolProtocolSnapshot?: { toolId: EmotionalAlchemyToolId; steps: ToolProtocolStep[]; completionCriteria: string[] }` to `MoveAttemptDraft` in `src/lib/charge-metabolism/types.ts` (import types from `@/lib/alchemy/tool-registry`). Additive — do not change existing fields.
- [ ] **T2**: Create `src/lib/allyship-deck/practice-engine.ts` with `UnifiedDeckPracticeInput`, `UnifiedDeckPracticeResult`, and `DeckPracticeMode` re-export, matching spec §API Contracts exactly.
- [ ] **T3**: Re-export `recommendDeckPractice` + unified types from `src/lib/charge-metabolism/index.ts` (barrel) so the deck UI swaps imports minimally.
- [ ] **T4**: `npm run check` — types compile with the new field and empty function body.

## Phase 2 — Single vector resolver

- [ ] **T5**: Export/reuse Engine B's `resolveChargeState` (→ `resolveFeelingState`, `recommendation-service.ts:17-22`) so the seam resolves `present`/`desired` once.
- [ ] **T6**: In `recommendDeckPractice`, resolve `input.present` / `input.desired` (`ChargeStateInput`) to `AlchemyState | null` before passing into Engine A.
- [ ] **T7**: Confirm `recommendDeckCardPractice` (`practice-recommendations.ts`) receives already-resolved states and does not re-resolve; remove any second-resolver assumption on the deck path.
- [ ] **T8**: Test — a string charge input and its equivalent `AlchemyState` produce identical `presentState`/`desiredState` through the one path.

## Phase 3 — Quick path

- [ ] **T9**: Implement the quick branch — call `getDeckCardToolAffinities` + `recommendDeckCardPractice` (mode `quick`, no vector) + `composeDeckPracticeCopy`; return `route: null`, `vectorStatus: 'none'`.
- [ ] **T10**: Synthesize the quick `MoveAttemptDraft`: `status: 'recommended'`, `context` from input, `recommendedPrimitiveIds: [selectedTool.id]`, `chosenPrimitiveId: selectedTool.id`, `toolProtocolSnapshot` from the selected tool.
- [ ] **T11**: Default `persist` to `false`; ensure `nextQuestion` does not block quick completion.
- [ ] **T12**: Test — quick with only a blocker: non-null tool, non-empty `protocol`, `choose` then `complete` succeeds only with a trace (reuse `move-attempts.ts` guards).

## Phase 4 — Deep path (protocols-on-routes seam)

- [ ] **T13**: Implement the deep branch — call `recommendChargeMetabolismMove` with the full `MoveRecommendationServiceInput` (resolved vector, orientation, subject, superpower, domain, `cardContext`, `context` binding, `mode`, `maxAlternates`).
- [ ] **T14**: Attach Engine A's authored `protocol` as `toolProtocolSnapshot` on the metabolize/transcend attempt(s) — replacing bare Show Up primitives as the rendered "how."
- [ ] **T15**: Pass through `route`, `vectorStatus`, `presentState`, `desiredState`, `nextQuestion`, `missingFields`; keep B's intake nudge on partial vector.
- [ ] **T16**: Bind `attempt.context` to `campaignRef`, `deckCardId`, `sourceSurface` from input; set `persist` from `input.persist`.
- [ ] **T17**: Resolve Open Question #3 — decide one primary `attempt` vs. per-edge attempts for multi-edge route hands (document the choice inline).
- [ ] **T18**: Test — deep with present+desired: non-null `route`, `attempt.routeSnapshot` set, `toolProtocolSnapshot.steps === protocol`; distinct `campaignRef`s (Cascade Camp, MTGOA) yield distinct attempts.

## Phase 5 — QA overlay harness

- [ ] **T19**: Repoint `practice-overlays.ts` example builders (`composePractice`) at the integrated output.
- [ ] **T20**: Retain `same_tool_collapse` + `no_quick_example` + review status; ensure card affinity still influences tool/copy on deep.
- [ ] **T21**: Populate result `reviewFlags` = copy flags ∪ overlay flags.
- [ ] **T22**: Test — distinct deep samples that collapse to one tool still raise `same_tool_collapse` through the integrated engine (`practice-overlays.ts:246-248`).

## Phase 6 — UI swap (reuse existing intake)

- [ ] **T23**: In `WorkThisCardButton.tsx`, swap `recommendChargeMetabolismMove` → `recommendDeckPractice` (import from the `@/lib/charge-metabolism` barrel).
- [ ] **T24**: Add a quick/deep mode toggle; deep keeps the full intake (dissatisfaction → channel → desired → blocker → orientation), quick collapses to blocker + orientation.
- [ ] **T25**: Build `UnifiedDeckPracticeInput.context` from `card.id` + campaign context; render `copy.stepCopy` / `protocol` as the "Do this now" steps.
- [ ] **T26**: Keep lifecycle handlers (`chooseMoveAttempt` … `completeMoveAttempt`) unchanged; confirm trace-guarded completion on both paths in the UI.

## Phase 7 — Verification quest (required, user-facing)

- [ ] **T27**: Author Twine passages for the 7 steps in spec §Verification Quest (quick taste → trace guard → deep route → protocol-on-route → campaign binding → second `campaignRef`); final passage has no link.
- [ ] **T28**: Write `scripts/seed-cert-deck-practice-integration.ts` — idempotent; TwineStory + CustomBar `isSystem: true`, `visibility: 'public'`, deterministic id `cert-deck-practice-integration-v1`. Pattern: `scripts/seed-cyoa-certification-quests.ts`.
- [ ] **T29**: Add npm script `seed:cert:deck-practice-integration`; frame narrative toward the Bruised Banana Fundraiser (engine improvement + Cascade Camp / MTGOA launch readiness).
- [ ] **T30**: Run the seed; confirm the quest appears and completes end-to-end.

## Phase 8 — Fail-fix

- [ ] **T31**: `npm run check` (lint + type-check) — clean.
- [ ] **T32**: `npm run build` — full Next.js build passes.
- [ ] **T33**: Manually verify the integrated quick + deep flow on the campaign-scoped deck surface before it fronts a launch (prototype code — prove it runs end-to-end).
- [ ] **T34**: Check off completed tasks; note any resolved open questions back into `spec.md`.

## Notes

- **No Prisma change in this spec.** `persist: true` records intent only; the `MoveAttempt` DB model
  + the self-defined awareness measure are the sibling `raise-awareness-hypothesis-audit` spec. If an
  implementer adds a write here, add a **§ Persisted data & Prisma** section + a `migrate dev` task
  and commit the migration — do not `db push`.
- **Both engines stay callable** — `recommendChargeMetabolismMove` and `recommendDeckCardPractice`
  are not deleted; only the deck surface stops calling them directly.
- Resolve spec Open Questions #1–#5 with the author where they gate implementation (especially #1
  persistence trigger, #2 `sourceSurface`, #3 multi-edge attempts).
</content>
