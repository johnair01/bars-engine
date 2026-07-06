# Plan: Oracle Charge Router

## Implementation Strategy

Build the router as a thin orchestration layer over existing practices.

V1 should prove the loop without committing to a large schema migration:

1. Create typed contracts for charge input, route result, RTCM result, and oracle attachments.
2. Implement a deterministic route evaluator.
3. Add oracle scarcity/budget checks for daily free draws and vibeulon clarity.
4. Wrap existing I Ching casting with optional charge context.
5. Add a small API/server-action layer.
6. Add new-player orientation and a compact player entry surface.
7. Attach results to existing lens quests before creating new quests.
8. Add tests for routing, budget gates, onboarding, and persistence behavior.

## Phase 1 - Contracts and Router

Create a shared module for:

- `OracleChargeInput`
- `OracleChargeRouteResult`
- `OracleRoute`
- `RtcmInput`
- `RtcmResult`
- `OracleAttachment`

Add `routeOracleCharge(input)` as a pure function first. It should not call AI and should not cast the I Ching.

Initial deterministic rules:

| Signal | Route |
|--------|-------|
| intensity 1-2 and current quest exists | `existing_lens_quest` |
| intensity 1-2 and no quest | `emotional_alchemy_move` |
| intensity 3 and player-selected ambiguity high | `iching_draw` |
| intensity 3 and player-selected relationality high | `allyship_card` |
| intensity 4-5 or unchanged/increasing charge after lighter moves | `shadow_321` |
| prior reading + recent event/question | `rtcm_clarification` |

## Phase 2 - Oracle Scarcity and Vibeulon Gate

Add a single allowance service before UI work.

Work:

- Define launch policy for free draws per day and vibeulon costs.
- Resolve whether the player has a free draw remaining.
- Return `free_available`, `requires_vibeulon`, or `wait_until_tomorrow`.
- Spend vibeulons only after explicit confirmation.
- Exempt 321, Emotional Alchemy, allyship card draw, and existing quest attachment from I Ching draw costs.
- Track `nextFreeDrawAt` for clear player messaging.

Guardrail:

- Scarcity should limit repeat oracle consultation, not block action.

## Phase 3 - I Ching Charge Context

Extend the existing I Ching cast path without changing casting mechanics.

Work:

- Treat NOW as an action surface that routes to `/iching`; keep `/wiki/iching` as the learning surface.
- Add optional charge context to cast request.
- Persist charge context through existing story progress state.
- Include Anthony/Moog summary in the route response when available.
- Keep `/iching` on the current aligned `castIChing` engine for V1.
- Defer changing lines and line-to-Game-Master mapping unless `/iching` is explicitly switched to `castIChingTraditional`.
- Add router phases to `CastingRitual` so draw gates happen before animation and checkpoints happen after acceptance.

Guardrail:

- Do not change the current I Ching cast engine in the same slice as charge routing.

## Phase 4 - RTCM Function

Add a small RTCM function as clarification practice.

V1 options:

| Option | Behavior | Recommendation |
|--------|----------|----------------|
| A | Structured reflection around prior reading/event, no new cast | Best V1 |
| B | New cast marked as RTCM clarification | Possible V2 |
| C | Hybrid: reflection first, optional cast | Later |

V1 should implement Option A unless the product decision is to make RTCM explicitly cast-based.

## Phase 5 - Allyship Deck Bridge

Connect route output to allyship deck cards.

Work:

- Support random draw for inspiration.
- Support consult draw when `allyshipDomain` or problem/lens is supplied.
- Return card id, title, move, operation, domain, and primary/campaign question.
- Offer card as a next-action prompt after I Ching.

## Phase 6 - Existing Lens Quest Attachment

Prefer attachment to active work.

Work:

- If `currentQuestId` is provided, attach there.
- If `lens` is provided, find compatible active quest candidates.
- Store oracle context as an artifact or progress note.
- Only open quest wizard when no good attachment target exists.

## Phase 7 - Orientation and Player UI

Add a compact surface reachable from dashboard, quest context, or I Ching modal.

Minimum UI:

- first-use orientation card
- deeper "How this works" documentation page
- charge/inspiration text area
- optional current quest/lens context
- intensity 1-5
- daily free draw allowance display
- one recommended route
- two alternatives max
- action buttons for the selected route

Post-I Ching:

- Take action now
- Attach to quest
- Draw allyship card
- Do 321 on this
- Clarify later with RTCM

Scarcity UI:

- Show free draws remaining before a draw.
- Show vibeulon cost before paid clarity.
- Offer a no-spend alternative when allowance is exhausted.

## Phase 8 - Verification

Add tests before broad UI rollout:

- low charge + quest routes to existing quest
- low charge + no quest routes to Emotional Alchemy
- medium ambiguous charge routes to I Ching
- relational campaign charge routes to allyship card
- high charge routes to 321
- prior reading + event routes to RTCM
- exhausted free draw routes to vibeulon spend or wait
- no vibeulons are spent without confirmation
- first-use orientation is shown before initial draw
- post-I Ching route preserves reading context

## Suggested Files

Potential new files:

- `src/lib/oracle-charge-router/types.ts`
- `src/lib/oracle-charge-router/route.ts`
- `src/lib/oracle-charge-router/draw-gate.ts`
- `src/lib/oracle-charge-router/rtcm.ts`
- `src/actions/oracle-charge-router.ts`
- `src/lib/oracle-charge-router/__tests__/route.test.ts`
- `src/lib/oracle-charge-router/__tests__/draw-gate.test.ts`

Potential touched files:

- `src/actions/cast-iching.ts`
- `src/lib/iching-cast-context.ts`
- `src/components/now/NowHome.tsx`
- `src/components/CastingRitual.tsx`
- `src/components/CastIChingModal.tsx`
- `src/components/deck/AllyshipDeckReader.tsx`
- quest/lens attachment action once located

## Release Shape

Recommended release:

1. V1 contract types: input, route result, fallback, privacy, economy, and charge checkpoint shapes.
2. Pure router and route-result tests.
3. Draw scarcity and vibeulon confirmation gate.
4. Economy/audit event persistence or existing vibeulon event mapping.
5. First-use orientation and "How this works" doc.
6. Post-I Ching branch UI.
7. Dashboard/quest charge capture entry.
8. Lens quest attachment.
9. RTCM clarification.
10. Polish recommendation copy after real playthroughs.
