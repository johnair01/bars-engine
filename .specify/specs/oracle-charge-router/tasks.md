# Tasks: Oracle Charge Router

## Discovery

- [ ] Confirm canonical Emotional Alchemy move action/API surface.
- [ ] Confirm current active lens quest data shape and lookup path.
- [ ] Confirm whether allyship deck runtime should use `public/oracle/deck.json` or assembled allyship deck JSON.
- [ ] Decide intensity model. Proposed: self-reported only in V1 plus explicit charge trend.
- [ ] Decide RTCM V1 mode. Proposed: structured reflection around prior reading/event.
- [ ] Decide oracle route history storage. Proposed: recent private history in `storyProgress.state`, shareable outputs by consent, dedicated table later.
- [ ] Decide allyship deck draw mode. Proposed: both; consult-indexed for routed work, random for open inspiration.
- [ ] Decide lens quest matching. Proposed: current quest, selected lens/domain, then lightweight search candidates with confirmation.
- [ ] Decide launch free-draw allowance per day. Proposed: 1 free I Ching draw per day in V1.
- [ ] Decide vibeulon cost for additional I Ching draws. Proposed: 1 vibeulon in V1.
- [ ] Decide vibeulon cost for RTCM clarification. Proposed: 1 vibeulon in V1.
- [ ] Decide RTCM subscription/economy framing. Proposed: subscription includes access; vibeulons price same-day delay/uncertainty.
- [ ] Decide economy audit storage. Proposed: real queryable event store or existing vibeulon event mechanism, no private charge text.
- [ ] Decide ambiguity/relationality controls. Proposed: optional explicit plain-language chips, no hidden inference.
- [ ] Decide free clarification token rule. Proposed: completed oracle-linked quests grant 1 token in V1.1 if storage is not already available.
- [ ] Decide reset boundary. Proposed: player timezone when available, server day as fallback.

## Contracts

- [ ] Add `OracleRoute` union.
- [ ] Add `ChargeIntensity`, `ChargeTrend`, `ExplicitSignalLevel`, and `OracleSignalChip`.
- [ ] Add `OracleChargeInput`.
- [ ] Add `OracleChargeRouteResult`.
- [ ] Add `OracleRouteDecision`.
- [ ] Add `OracleRouteAvailability`.
- [ ] Add `RtcmInput` and `RtcmResult`.
- [ ] Add `OracleAttachment` shape for reading/card/move/RTCM attachment.
- [ ] Add `OracleDrawBudget`.
- [ ] Add `OracleDrawGate`.
- [ ] Add `OracleScarcityPolicy`.
- [ ] Add `OracleEconomyEvent` or map to existing vibeulon event type.
- [ ] Add optional explicit `ambiguity` and `relationality` input fields or equivalent route chips.
- [ ] Add fallback fields to route result for gated/declined oracle paths.
- [ ] Add `OraclePrivacyClass`.
- [ ] Add `PrivateOracleRouteHistory`.
- [ ] Add `ShareableOracleArtifact`.
- [ ] Add `ChargeCheckpoint`.
- [ ] Ensure `OracleChargeRouteResult` contains `primaryPath`, optional `gatedPath`, optional `fallbackPath`, `fallbackReason`, `privacyClass`, and optional `chargeCheckpoint`.

## Router

- [ ] Implement pure `routeOracleCharge(input)`.
- [ ] Add intensity thresholds.
- [ ] Add explicit charge trend handling.
- [ ] Add player-selected ambiguity handling.
- [ ] Add player-selected relational/campaign context handling.
- [ ] Treat ambiguity/relationality as explicit player choices, not inferred text analysis.
- [ ] Route unchanged or increasing charge toward 321 or stronger regulating paths.
- [ ] Add current-quest preference.
- [ ] Add route alternatives, capped at two.
- [ ] Include draw gate state when the recommended path requires I Ching or RTCM.
- [ ] Return no-spend fallback when I Ching/RTCM is gated by allowance, balance, or player choice.
- [ ] Prefer fallback order: quest attachment, Emotional Alchemy, allyship card for relational/campaign context, 321 for unchanged/increasing charge, wait.

## Scarcity and Vibeulons

- [ ] Implement `resolveOracleDrawGate`.
- [ ] Track free draws remaining today.
- [ ] Set V1 allowance to 1 free I Ching draw per day unless product decision changes.
- [ ] Track next free draw time.
- [ ] Require explicit confirmation before vibeulon spend.
- [ ] Add no-spend alternative when free allowance is exhausted.
- [ ] Set V1 paid draw cost to 1 vibeulon unless product decision changes.
- [ ] Set V1 paid RTCM clarification cost to 1 vibeulon unless product decision changes.
- [ ] Ensure RTCM cost copy frames vibeulons as delay/uncertainty friction, not subscription upsell.
- [ ] Resolve reset boundary from player timezone, falling back to server day.
- [ ] Include reset basis in draw gate response or audit trail.
- [ ] Ensure 321, Emotional Alchemy, allyship card draw, and quest attachment remain free.
- [ ] Add audit/persistence event for paid clarity.
- [ ] Record free draw consumption, confirmed spends, failed spends, reset basis, and token events.
- [ ] Ensure economy/audit events do not include private charge text.
- [ ] Scope free clarification tokens as V1.1 unless existing token storage makes it cheap in V1.
- [ ] Add tests for free draw, exhausted allowance, insufficient vibeulons, and confirmed spend.

## Privacy Boundaries

- [ ] Store private charge text only in private route history.
- [ ] Require player approval before creating a shareable oracle artifact.
- [ ] Ensure quest attachment uses `ShareableOracleArtifact`, not raw private charge text.
- [ ] Ensure campaign/public surfaces never receive private route history.
- [ ] Add tests that economy/audit events omit charge text.
- [ ] Add tests that quest attachments require approved shareable artifacts.

## I Ching Integration

- [ ] Treat latest NOW I Ching tool as a cast action surface linking to `/iching`; keep `/wiki/iching` as learning/guidebook.
- [ ] Add `source=now` to NOW -> `/iching` link when router context is introduced.
- [ ] Keep V1 `/iching` on current aligned `castIChing` engine.
- [ ] Defer changing lines and line-to-Game-Master mapping for `/iching` unless product explicitly switches to `castIChingTraditional`.
- [ ] Preserve existing `CastingRitual -> castIChing -> acceptReading` flow.
- [ ] Add optional charge context to I Ching cast request.
- [ ] Persist charge context with reading.
- [ ] Include `currentQuestId`, `lens`, and `allyshipDomain` where supplied.
- [ ] Add `CastingRitual` router phases: `ready -> gate -> casting -> revealed -> accepted -> checkpoint`.
- [ ] Add draw gate before `CastingRitual` starts the casting animation.
- [ ] Preserve current accept-and-return behavior for non-router/plain `/iching` mode unless product chooses otherwise.
- [ ] Disable auto-return after accept when router mode is active.
- [ ] Add no-spend fallback when `/iching` is entered from NOW and the draw is gated.
- [ ] Return Anthony/Moog summary fields when available.
- [ ] Add post-reading branch options.
- [ ] Add post-acceptance charge checkpoint and next-step routing.
- [ ] Do not change I Ching randomness or alignment logic inside `castIChing`.

## Charge Checkpoints

- [ ] Capture entry intensity.
- [ ] Ask for charge after accepted I Ching reading.
- [ ] Ask for charge after RTCM clarification.
- [ ] Ask for charge after routed allyship card draw.
- [ ] Ask for charge after Emotional Alchemy move.
- [ ] Ask for charge before routing from lighter path into 321.
- [ ] Do not ask for repeated charge ratings during passive reading-only screens.
- [ ] Route decreasing charge toward action or quest attachment.
- [ ] Route unchanged/increasing charge toward 321 or stronger regulating path.

## RTCM

- [ ] Implement `clarifyWithRtcm(input)`.
- [ ] Link RTCM result to prior reading when supplied.
- [ ] Route to 321 when RTCM follow-up self-report shows unchanged or increasing charge.
- [ ] Route to quest attachment when an existing quest is supplied.
- [ ] Add tests for prior-reading and standalone event cases.

## Allyship Deck Bridge

- [ ] Add helper to draw random allyship card.
- [ ] Add helper to consult by domain/lens/problem.
- [ ] Add deck draw mode: `random` for open inspiration, `consult` for routed work.
- [ ] Return card action prompt in router response.
- [ ] Allow I Ching post-reading flow to draw or recommend allyship card.
- [ ] Add tests for relational/campaign routing.

## Lens Quest Attachment

- [ ] Locate active lens quest lookup path.
- [ ] Implement explicit `currentQuestId` attachment.
- [ ] Implement candidate matching by lens/domain.
- [ ] Implement lightweight active quest search as ranked candidates.
- [ ] Require player confirmation before attaching search-matched quest candidates.
- [ ] Store oracle context without overwriting quest fields.
- [ ] Open quest wizard only when no suitable quest exists.

## UI

- [ ] Add first-use orientation card.
- [ ] Add deeper "How this works" documentation.
- [ ] Explain I Ching as timing/action aid, not prediction.
- [ ] Explain daily free draws.
- [ ] Explain vibeulon spend for additional clarity.
- [ ] Explain wait-until-tomorrow option.
- [ ] Explain when 321 is a better path.
- [ ] Add charge/inspiration capture surface.
- [ ] Add intensity control.
- [ ] Show free draws remaining before casting.
- [ ] Show vibeulon balance and exact cost before paid clarity.
- [ ] Display one recommended path and at most two alternatives.
- [ ] Add route action buttons.
- [ ] Add post-I Ching branch UI.
- [ ] Add "Do 321 on this reading" handoff.
- [ ] Add "Attach to existing quest" handoff.
- [ ] Add "Draw allyship card" handoff.
- [ ] Add "Clarify later with RTCM" handoff.

## Verification

- [ ] Unit test router decisions for low/medium/high charge.
- [ ] Unit test existing quest preference.
- [ ] Unit test relational allyship route.
- [ ] Unit test RTCM route.
- [ ] Unit test route result shape for available, gated, declined, and fallback paths.
- [ ] Unit test oracle draw gate.
- [ ] Unit test vibeulon spend confirmation.
- [ ] Unit test no-spend fallback.
- [ ] Unit test charge checkpoint trend calculation.
- [ ] Unit test privacy class separation.
- [ ] Regression test I Ching casting remains unchanged.
- [ ] Manual playthrough: first-use orientation -> free I Ching draw.
- [ ] Manual playthrough: exhausted draw allowance -> spend vibeulon or wait.
- [ ] Manual playthrough: charge capture -> I Ching -> allyship card -> attach to quest.
- [ ] Manual playthrough: high charge -> 321 -> quest/BAR branch.

## Product Review

- [ ] Review player-facing copy for simplicity.
- [ ] Review privacy defaults for high-charge material.
- [ ] Review whether repeated oracle draws should be limited or gently redirected.
- [ ] Review six Game Master framing in the post-I Ching result.
- [ ] Review scarcity copy for fairness and non-punitive tone.
- [ ] Review whether daily draw limits should vary by player progression.
