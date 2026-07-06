# Spec: Oracle Charge Router - I Ching, RTCM, Allyship Deck, 321, and Lens Quests

## Purpose

Create a lightweight action-routing layer for players who are charged, inspired, confused, or stuck around their next step.

The I Ching becomes one callable option in the BARs Engine loop: faster than a full 321, more symbolic than a simple quest prompt, and robust enough to help a player notice the charge around action. The router should help the player choose the lightest adequate practice:

1. Collect charge / inspiration.
2. Assess self-reported intensity, charge trend, ambiguity, relational context, and existing quest context.
3. Route to one of:
   - existing lens quest
   - Emotional Alchemy move
   - I Ching draw
   - RTCM clarification
   - 321 Shadow Process
   - allyship deck card
4. Convert the result into a next action, BAR, quest link, or wizard draft.

This spec is the connecting layer between the current 321, I Ching, quest grammar, and allyship deck systems. It does not replace any of them.

## Thesis

BARs Engine gets stronger when "I am stuck" stops being a dead end and becomes a menu of developmentally appropriate moves.

The I Ching should not be treated as a novelty oracle. It should function as a timing-and-alignment layer: when a player has enough charge to need reflection but not enough charge to need a full 321, the draw helps them identify the pattern, the line-level Game Master operations, and a concrete next step. When charge is too hot, the router should hand them to 321. When the next step is already clear, it should route them to the existing lens quest or an Emotional Alchemy move.

## Current Surface Area

| System | Existing hook | Relevance |
|--------|---------------|-----------|
| I Ching cast | `src/actions/cast-iching.ts` | Casts six lines, maps line positions to six Game Master faces, persists reading context |
| I Ching context | `src/lib/iching-cast-context.ts` | Stores reading history and campaign/thread context |
| I Ching modal | `src/components/CastIChingModal.tsx` | Current user-facing casting surface |
| Anthony/Moog layer | `content/iching-canonical.json` | Supplies BARs-oriented commentary, concepts, techniques |
| Quest grammar | `src/lib/quest-grammar/resolveMoveForContext.ts` and `packages/bars-core/src/quest-grammar/resolveMoveForContext.ts` | Can resolve move recommendations from domain/lens context |
| 321 | `src/app/shadow/321/Shadow321Runner.tsx` | Canonical high-charge shadow process |
| Allyship deck | `src/lib/allyship-deck/*`, `public/oracle/deck.json` | Supplies concrete allyship move cards and consultable prompts |
| Prior bridge spec | `.specify/specs/flow-321-iching-quest-wizard/spec.md` | Defines I Ching branches into 321 or quest wizard |
| Prior EFA spec | `.specify/specs/321-efa-integration/spec.md` | Defines 321 as Emotional First Aid option |

## Core Concepts

### Charge Capture

Charge capture is the entry point. It should collect a short signal, not a whole essay.

V1 contract:

```ts
type ChargeIntensity = 1 | 2 | 3 | 4 | 5
type ChargeTrend = 'unknown' | 'decreasing' | 'unchanged' | 'increasing'
type ExplicitSignalLevel = 'low' | 'medium' | 'high'

type OracleSignalChip =
  | 'timing_unclear'
  | 'people_relationship_involved'
  | 'quest_in_motion'
  | 'campaign_context'
  | 'wants_fast_action'
  | 'wants_reflection'
  | 'too_charged_for_oracle'

interface OracleChargeInput {
  chargeText: string
  inspirationText?: string
  currentQuestId?: string
  lens?: string
  allyshipDomain?: 'gather_resources' | 'raise_awareness' | 'direct_action' | 'skillful_organizing'
  contextType?: 'self' | 'relationship' | 'campaign' | 'quest' | 'creative_work'
  intensity: ChargeIntensity
  previousIntensity?: ChargeIntensity
  chargeTrend?: ChargeTrend
  ambiguity?: ExplicitSignalLevel
  relationality?: ExplicitSignalLevel
  selectedChips?: OracleSignalChip[]
  checkpoint?: ChargeCheckpointInput
  wantsFastPath?: boolean
  oracleBudget?: OracleDrawBudget
  playerPreference?: 'action' | 'reflection' | 'oracle' | 'shadow' | 'allyship'
}

interface ChargeCheckpointInput {
  checkpointType:
    | 'entry'
    | 'after_iching_acceptance'
    | 'after_rtcm'
    | 'after_allyship_card'
    | 'after_emotional_alchemy'
    | 'before_321'
  priorIntensity?: ChargeIntensity
  currentIntensity: ChargeIntensity
  sourceRoute?: OracleRoute
}

interface OracleDrawBudget {
  freeDrawsRemainingToday: number
  paidClarificationsAvailable: boolean
  vibeulonBalance?: number
  nextFreeDrawAt?: string
}
```

The router should not infer emotional intensity, ambiguity, or relationality from text in V1. Self-reported charge is canonical. Ambiguity and relationality come from optional explicit controls/chips. The system may interpret the player's own reports over time, especially whether charge is going down, staying the same, or increasing as they move through the flow.

### RTCM as a Function

RTCM means Retrospective Three-Coin Method in the Anthony/Moog practice frame.

In the engine, RTCM should not replace the primary I Ching draw and should not alter the randomness of the cast. It should be a follow-up function for clarification after a real-world action, a charged event, or an ambiguous draw.

Function shape:

```ts
interface RtcmInput {
  originalReadingId?: string
  eventText: string
  question: string
  suspectedPattern?: string
  currentQuestId?: string
}

interface RtcmResult {
  mode: 'rtcm_clarification'
  question: string
  eventSummary: string
  recommendedUse: 'confirm_pattern' | 'identify_misread' | 'choose_next_action' | 'route_to_321'
  nextAction: string
  linkedReadingId?: string
  linkedQuestId?: string
}
```

RTCM is best used when the player says, "Something just happened, and I need to understand what the oracle was pointing at." It is less useful for vague curiosity.

### Allyship Deck Bridge

The allyship deck supplies a concrete move when the I Ching gives developmental timing but the player still needs an action prompt.

The bridge should treat:

| I Ching | Allyship deck | Lens quest |
|---------|---------------|------------|
| Pattern, timing, line pressure | Move card, relational action, campaign register | Existing path for metabolizing work |

The router can draw or recommend an allyship card when:

- the charge is relational or campaign-facing
- the player needs a concrete action after an I Ching reading
- an existing lens quest needs a move prompt rather than a whole new quest
- the player wants fast action rather than a deeper reflective process

### Existing Lens Quest Bridge

If the player already has a relevant lens quest, the router should prefer attachment over creating a new quest.

Expected behavior:

- Match `currentQuestId` when explicitly supplied.
- Search active lens quests when a lens/domain is supplied.
- Offer "attach this reading/card/move to your existing quest" before creating a new quest.
- Preserve I Ching and allyship data as context, not as a replacement for the quest's existing goal.

## API Layer

### `routeOracleCharge`

Primary server action/API contract.

```ts
type OracleRoute =
  | 'existing_lens_quest'
  | 'emotional_alchemy_move'
  | 'iching_draw'
  | 'rtcm_clarification'
  | 'shadow_321'
  | 'allyship_card'

type OracleRouteAvailability =
  | 'available'
  | 'gated_requires_vibeulon'
  | 'gated_insufficient_vibeulons'
  | 'gated_wait_until_tomorrow'
  | 'declined_by_player'

interface OracleRouteDecision {
  path: OracleRoute
  availability: OracleRouteAvailability
  reason: string
  nextAction: string
  drawGate?: OracleDrawGate
}

interface OracleChargeRouteResult {
  primaryPath: OracleRouteDecision
  gatedPath?: OracleRouteDecision
  fallbackPath?: OracleRouteDecision
  fallbackReason?: string
  reason: string
  chargeAssessment: {
    intensity: ChargeIntensity
    previousIntensity?: ChargeIntensity
    trend: ChargeTrend
    ambiguity?: ExplicitSignalLevel
    relationality?: ExplicitSignalLevel
    selectedChips?: OracleSignalChip[]
  }
  nextAction: string
  alternatives: OracleRouteDecision[]
  currentQuestId?: string
  lens?: string
  shouldOffer321: boolean
  shouldOfferQuestAttachment: boolean
  privacyClass: OraclePrivacyClass
  chargeCheckpoint?: ChargeCheckpoint
  drawGate?: OracleDrawGate
}

interface OracleDrawGate {
  status:
    | 'not_required'
    | 'free_available'
    | 'requires_vibeulon'
    | 'insufficient_vibeulons'
    | 'wait_until_tomorrow'
  freeDrawsRemainingToday: number
  vibeulonCost?: number
  vibeulonBalance?: number
  nextFreeDrawAt?: string
  resetBasis?: 'player_timezone' | 'server_day'
  message: string
}

type OraclePrivacyClass = 'private_charge' | 'shareable_artifact' | 'economy_audit'

interface ChargeCheckpoint {
  checkpointType: ChargeCheckpointInput['checkpointType']
  priorIntensity?: ChargeIntensity
  currentIntensity: ChargeIntensity
  trend: ChargeTrend
  sourceRoute?: OracleRoute
  createdAt: string
}

interface PrivateOracleRouteHistory {
  privacy: 'private_charge'
  chargeText: string
  intensity: ChargeIntensity
  chargeTrend: ChargeTrend
  selectedChips?: OracleSignalChip[]
  readingId?: string
  routeTaken: OracleRoute
  createdAt: string
}

interface ShareableOracleArtifact {
  privacy: 'shareable_artifact'
  title: string
  summary: string
  actionPrompt: string
  sourceReadingId?: string
  sourceCardId?: string
  approvedByPlayer: true
  approvedAt: string
}

interface OracleEconomyAuditEvent {
  privacy: 'economy_audit'
  eventType:
    | 'free_draw_used'
    | 'paid_draw_confirmed'
    | 'paid_rtcm_confirmed'
    | 'spend_failed'
    | 'reset_resolved'
    | 'token_granted'
    | 'token_redeemed'
  playerId: string
  route?: OracleRoute
  costVibeulons?: number
  resetBasis?: 'player_timezone' | 'server_day'
  readingId?: string
  createdAt: string
}
```

Routing defaults:

| Condition | Preferred route |
|-----------|-----------------|
| Low charge, clear next step | existing lens quest or Emotional Alchemy move |
| Medium charge, ambiguous timing | I Ching draw |
| Medium charge, relational action needed | allyship card, optionally paired with I Ching |
| Self-reported high charge, unchanged charge after lighter moves, or increasing charge | 321 |
| After an action/event that reframes a prior reading | RTCM clarification |

### `prepareIChingChargeRoute`

Prepare charge context, draw gate state, and post-cast routing around the existing I Ching ritual.

Requirements:

- Preserve the existing casting mechanics and current cast engine.
- Persist `chargeText`, `currentQuestId`, `lens`, and `allyshipDomain` into reading context.
- Return the hexagram, Anthony/Moog summary when available, and suggested next path.
- Do not promise changing-line or six-line Game Master mapping in V1 unless the product explicitly switches `/iching` from `castIChing` to `castIChingTraditional`.

### NOW / `/iching` Integration

Current behavior:

- Latest `origin/main` has `src/components/now/NowHome.tsx` linking the I Ching tool card directly to `/iching`.
- `/wiki/iching` remains the learning/guidebook surface, not the NOW action surface.
- `src/components/dashboard/DashboardTwoChannelHub.tsx` links "Cast I Ching" to `/iching`, optionally with `instanceId`.
- `src/app/iching/page.tsx` builds optional cast context from query params and renders `CastingRitual`.
- `src/components/CastingRitual.tsx` calls `castIChing({ context })`, reveals the hexagram, then calls `acceptReading(hexagram.id, context)` on acceptance.
- `src/actions/cast-iching.ts` owns the actual casting/persistence path.

V1 integration rule:

The router should wrap the existing `/iching` ritual rather than replacing it. The existing `castIChing` function remains the V1 source of the hexagram. The router handles pre-cast charge context when present, draw gates, fallback routing, and post-acceptance next-step options.

V1 cast engine decision:

- Use the current aligned `castIChing` path for `/iching`.
- Do not switch `/iching` to `castIChingTraditional` in the same slice as charge routing.
- Treat changing lines and line-to-Game-Master mapping as V2 unless the product explicitly chooses traditional casting for the NOW ritual.

Recommended flow:

1. NOW's "I Ching" activated tool routes directly to `/iching`, ideally with `source=now` once routing is added.
2. `/iching` optionally receives `source=now`, `currentQuestId`, `lens`, `allyshipDomain`, or campaign context.
3. Before `CastingRitual` starts the casting animation, a gate phase checks whether a free draw, vibeulon spend, token, or wait/fallback applies.
4. If the draw is allowed, `CastingRitual` calls the existing `castIChing` action.
5. On accept, `acceptReading` persists the reading as it does today, extended with charge context when available.
6. After acceptance, the router asks for a charge checkpoint and offers next steps: attach to quest, Emotional Alchemy, allyship card, RTCM, 321, or return to NOW.

`CastingRitual` phase requirements:

- Existing rough phases are `ready -> casting -> revealed -> accepted`.
- Router mode should become `ready -> gate -> casting -> revealed -> accepted -> checkpoint`.
- The gate phase must occur before the dramatic casting pause/animation.
- Router mode must disable the current automatic return-home behavior after acceptance so the checkpoint and next-step options can render.
- Non-router/plain `/iching` mode may preserve the current accept-and-return behavior until the new flow is proven.

Non-goals:

- Do not change the randomness or alignment logic inside `castIChing`.
- Do not make NOW responsible for casting.
- Do not collapse the wiki learning surface into the NOW cast action.
- Do not force charge capture for a plain guidebook/wiki visit.

### `clarifyWithRtcm`

Run the RTCM clarification flow.

Requirements:

- Requires either `originalReadingId` or enough event/question text to stand alone.
- Produces a narrow recommendation.
- May route to 321 if the event reveals high charge.
- May attach to an existing quest.

### `resolveOracleDrawGate`

Resolve whether the player can draw or clarify now.

Requirements:

- Grant a small daily allowance of free I Ching draws.
- Reset free draws on a clear day boundary.
- Allow additional clarity through a vibeulon spend.
- Let the player wait until the next day instead of spending.
- Communicate scarcity as practice rhythm, not punishment.
- Never charge vibeulons for routes that do not perform an oracle draw or paid clarification.

V1 policy should be configurable:

```ts
interface OracleScarcityPolicy {
  freeDrawsPerDay: number
  clarificationCostVibeulons: number
  paidDrawCostVibeulons: number
  subscriptionIncluded: boolean
  rtcmCostMode: 'free_reflection' | 'vibeulon_delay_cost'
  timezoneMode: 'player_timezone' | 'server_day'
}
```

Initial recommendation:

| Action | Cost |
|--------|------|
| First daily I Ching draw | Free |
| Additional same-day I Ching draw | Vibeulon spend or wait |
| RTCM clarification on an existing reading | 1 vibeulon as a delay/uncertainty cost, unless granted as part of a post-action quest reward |
| Allyship card draw | Free in V1 unless later tied to deck economy |
| 321 | Free; earns/recognizes effort elsewhere |
| Emotional Alchemy move | Free |
| Existing lens quest attachment | Free |

Subscription note: the paid subscription grants access to the oracle system. The vibeulon cost is not a second subscription fee or a premium-content upsell. It is an in-game friction that prices additional uncertainty, repeated clarification, and delayed action.

### `recordOracleEconomyEvent`

Record draw, spend, reset, and token events outside private narrative history.

Requirements:

- Record every free draw consumption.
- Record every vibeulon spend confirmation.
- Record failed spend attempts caused by insufficient balance.
- Record reset basis: player timezone or server fallback.
- Record free clarification token grants/redemptions when that feature ships.
- Do not store private charge text in the economy/audit event.

Narrative history may remain in `storyProgress.state`, but economy/audit events should be queryable and supportable.

### `attachOracleResultToLensQuest`

Attach a reading, RTCM result, allyship card, or Emotional Alchemy move to a quest.

Requirements:

- Never silently overwrite quest goal, domain, or lens.
- Store oracle material as context/artifact.
- Offer a quest wizard draft only when no appropriate quest exists.

## User Experience

### New Player Orientation

New players encountering the oracle layer need an orientation flow before their first draw.

The orientation should explain:

- The I Ching is a timing-and-action aid, not a prediction machine.
- A draw is most useful when the player brings a real charge, question, or next-step tension.
- Free draws are limited each day so the practice stays meaningful.
- Vibeulons can be spent for additional clarity, but waiting until tomorrow is always valid.
- If the charge feels hot, personal, compulsive, or projection-heavy, 321 may be the better move.
- The allyship deck helps turn insight into a relational or campaign action.
- Existing lens quests are preferred landing places when the player already has work in motion.

Orientation should end with a first-use choice:

1. "I have a charged question."
2. "I am stuck on a quest."
3. "I need a relational move."
4. "This feels too charged; take me to 321."

The system should not force a player to read a long doctrine page before using the feature. Use a short orientation card, a deeper "How this works" page, and contextual tooltips.

### Entry Prompt

The player should see a small charge capture prompt:

- "What feels charged or alive right now?"
- optional: "What next step are you trying to take?"
- optional: intensity slider 1-5

The interface then recommends a path with alternatives.

### Path Menu

Recommended path is primary. Alternatives remain available.

| Path | Player-facing meaning |
|------|-----------------------|
| Emotional Alchemy | "Do one quick regulating/move-making practice." |
| I Ching | "Ask for timing, pattern, and the right relation to action." |
| RTCM | "Clarify what a recent event or prior reading was showing." |
| 321 | "Work directly with a charged figure, projection, or shadow pattern." |
| Allyship card | "Draw a concrete relational move." |
| Lens quest | "Use this in the quest already in motion." |

### Post-I Ching Branch

After a reading:

1. Show hexagram and line/GM face pattern.
2. Offer "Take action now", "Attach to quest", "Draw allyship card", "Do 321 on this", and "Clarify later with RTCM".
3. If charge remains high, promote 321.
4. If charge becomes action-ready, promote lens quest or Emotional Alchemy move.

### Scarcity and Vibeulon UX

The draw gate should be visible before the player commits to a draw.

Examples:

- "You have 1 free I Ching draw today."
- "You used today's free draw. Spend 1 vibeulon for more clarity, or wait until tomorrow."
- "This may not need another draw. Try attaching the reading to your quest or doing a small move."

The spend prompt should appear only when the player explicitly asks for another draw or RTCM clarification after the free allowance is used. It should show:

- current vibeulon balance, when available
- exact cost
- next free draw time
- a no-spend alternative

No vibeulons should be spent implicitly.

## Six Game Master Analysis

### Shaman

Usefulness: high. The I Ching gives symbolic containment to charge before it turns into avoidance or overthinking. Pairing it with the allyship deck gives the ritual a practical landing place.

Risk: mystical drift. If the system lets players keep drawing without acting, the oracle becomes a bypass.

Recommendation: frame every draw as "pattern plus next action." Require a post-reading action choice.

### Challenger

Usefulness: high if it shortens the path from stuckness to action. The router can challenge the player's default loop: if they want more reflection but the charge is low, send them to action; if they want action but the charge is high, send them to 321.

Risk: over-consulting. The player may use repeated draws to avoid the next step.

Recommendation: timebox oracle use. After one draw and one optional clarification, route to action or 321.

### Regent

Usefulness: high for strengthening the basic BARs loop because it makes "stuck" governable. Instead of every stuck moment becoming an ad hoc UI branch, the router provides a clear contract.

Risk: too many paths can make the system feel indecisive.

Recommendation: one primary recommendation, two alternatives max, with clear persistence and audit events.

Scarcity read: Regent supports the daily limit because it gives the oracle a fair rule and protects the game economy. The policy must be transparent and configurable.

### Architect

Usefulness: very feasible. The needed parts already exist: I Ching cast persistence, six-face line mapping, 321 runner, allyship deck data, quest grammar move resolution, and prior wizard bridge specs.

Risk: data-model creep. A large new schema could slow the work down.

Recommendation: begin with a server action and lightweight persisted context. Add database tables only after the loop proves useful.

Scarcity read: Architect sees this as feasible if allowance checks are isolated in one service. Avoid scattering "can draw?" checks through UI components.

### Diplomat

Usefulness: high for relational and campaign work. The allyship deck is the natural bridge from oracle insight into how a player treats people, communities, and commitments.

Risk: vulnerable charge needs care. Some material should not be turned into a public or campaign-facing action too quickly.

Recommendation: privacy-first defaults. High-charge or identity-threat language routes inward to 321 before being attached to public quests.

### Sage

Usefulness: high as a synthesis layer. The I Ching, RTCM, 321, Emotional Alchemy, allyship deck, and lens quests become a coherent family of practices rather than separate features.

Risk: conceptual overload.

Recommendation: keep the player-facing language simple: "What's charged?", "What is the lightest useful move?", "Where does this attach?" Let the system carry the deeper Anthony/Moog and BARs grammar behind the scenes.

Scarcity read: Sage frames scarcity as discernment. Limited draws help players ask better questions and take action between consultations.

## Feasibility and Value

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Technical feasibility | High | Existing cast, deck, 321, and quest systems provide most of the substrate |
| Product usefulness | High | Directly strengthens the core stuck-to-action loop |
| Design risk | Medium | Too many options can confuse players unless routing is opinionated |
| Safety risk | Medium | High charge should route to 321 or private work, not public action |
| Implementation size | Medium | V1 can be small if API-first and persistence-light |
| Narrative coherence | High | Fits BARs as charge metabolism through practices, quests, and artifacts |
| Economy fit | High | Daily free draws plus vibeulon clarity strengthens meaning and reduces oracle spam |
| Onboarding need | High | New players need a simple explanation before scarcity feels fair |

## Non-Goals

- Do not replace 321.
- Do not replace Emotional Alchemy.
- Do not replace I Ching casting randomness with deterministic pseudo-oracle logic.
- Do not require a new database schema in V1 unless existing persistence is insufficient.
- Do not auto-create quests when attachment to an existing quest is appropriate.
- Do not make repeated oracle draws the default response to stuckness.
- Do not spend vibeulons automatically or hide the cost of additional clarity.
- Do not make scarcity block 321, Emotional Alchemy, or lens quest action.

## Acceptance Criteria

- [ ] Player can enter charge/inspiration and receive one recommended path plus alternatives.
- [ ] Router can recommend 321 for self-reported high charge or unchanged/increasing charge after lighter moves.
- [ ] Router can recommend I Ching for medium-charge ambiguity around timing/action.
- [ ] Router can recommend or draw an allyship card for relational/campaign-facing charge.
- [ ] Router can attach a reading/card/move to an existing lens quest when available.
- [ ] I Ching reading context can include charge, lens, allyship domain, and current quest.
- [ ] RTCM can clarify a prior reading or charged event and produce a next action.
- [ ] Post-I Ching flow offers action, quest attachment, allyship card, 321, or RTCM.
- [ ] Player has a visible daily free draw allowance before drawing.
- [ ] Additional same-day clarity requires explicit vibeulon spend or waiting until the next day.
- [ ] No-spend alternatives are offered when the free draw allowance is exhausted.
- [ ] New players see a concise orientation before their first oracle charge route.
- [ ] Orientation documentation explains I Ching, scarcity, vibeulons, RTCM, 321, allyship deck, and lens quest attachment.
- [ ] Tests cover route decisions for low, medium, high, relational, and existing-quest cases.

## Open Questions

### Six Game Master Recommendations - First Pass

#### 1. Should intensity be self-reported only, inferred from text, or both?

| Game Master | Take |
|-------------|------|
| Shaman | Let the player name the felt intensity. Charge is embodied before it is legible to the system. |
| Challenger | Do not infer intensity from prose if the app cannot do it reliably. Challenge through follow-up measurement: "Did the charge go down?" |
| Regent | Self-report is canonical. Recommendations should be based on the player's reported intensity and charge trend, not hidden interpretation. |
| Architect | Implement `intensity` and `chargeTrend` as explicit fields. Do not add inferred risk signals in V1. |
| Diplomat | This preserves trust. The player should not feel diagnosed by their text. |
| Sage | Best synthesis: the system interprets the player's self-reports over time, not the private meaning of their words. |

Recommendation: self-reported intensity is canonical. V1 should not infer charge from text. The router may interpret the player's self-reported charge trend: if charge decreases, continue toward action; if charge stays unchanged or increases after lighter moves, recommend 321 or a stronger regulating path.

#### 2. Should RTCM produce a new I Ching cast, or should V1 treat it as a structured reflection around a prior reading/event?

| Game Master | Take |
|-------------|------|
| Shaman | RTCM should feel like returning to the field of the event, not immediately asking for another symbol. |
| Challenger | Do not let RTCM become a loophole for unlimited extra draws. Make the player work with what happened. |
| Regent | V1 should be structured reflection. New casts create economy and rules complexity. |
| Architect | Reflection-first is much cheaper and safer to implement. Add cast-based RTCM later behind the same draw gate if needed. |
| Diplomat | Reflection-first helps vulnerable material stay grounded in lived context instead of escalating symbolic interpretation. |
| Sage | RTCM is best as "what did this event reveal about the reading?" not "give me another reading." |

Recommendation: V1 RTCM should be structured reflection around a prior reading/event, with no new cast by default. V2 can add optional cast-based RTCM behind the same scarcity/vibeulon gate.

#### 3. Where should oracle route history live: `storyProgress.state`, a `PlayerBar`, or a dedicated table later?

| Game Master | Take |
|-------------|------|
| Shaman | Preserve the story trail. Readings matter because they become part of the player's mythic continuity. |
| Challenger | Do not overbuild history before proving players return to it. Keep it close to action. |
| Regent | Store enough to audit costs, choices, and quest attachments. Do not bury economy events in opaque blobs. |
| Architect | V1 can use existing story progress for recent route history, with separate vibeulon/audit events if those already exist. Add a table when query needs become real. |
| Diplomat | Private charge text should not be casually attached to public quest artifacts. Separate private route history from shareable outputs. |
| Sage | Treat history in three layers: private route log, action artifact, and later analytics table. |

Recommendation: V1 should store recent oracle route history in `storyProgress.state` or the existing I Ching reading history shape, attach shareable outputs to `PlayerBar` or quests only when the player chooses, and rely on existing vibeulon/audit mechanisms for spends. Add a dedicated `OracleRouteEvent` table later if analytics, search, or economy auditing requires it.

#### 4. Should the allyship deck draw be random, consult-indexed, or both in this flow?

| Game Master | Take |
|-------------|------|
| Shaman | Keep random draw available. The deck needs some living oracle quality. |
| Challenger | If the player came with a real problem, do not let randomness dodge the work. Use consult mode. |
| Regent | Both are valid, but the route should declare which mode is being used. Random is inspiration; consult-indexed is intervention. |
| Architect | Implement a single helper with `mode: 'random' | 'consult'`. Consult mode can filter by domain, move, lens, or problem index. |
| Diplomat | Relational or campaign-facing charge should usually use consult mode so the action fits the people involved. |
| Sage | Random draws open imagination; consult draws translate context into action. The router needs both. |

Recommendation: support both. Use consult-indexed draw when the player arrives from charge capture, a lens quest, a campaign context, or an I Ching post-reading action need. Use random draw for open inspiration or when the player explicitly asks for a card without a problem frame.

#### 5. Should existing lens quest matching use current quest state, player-selected lens, or lightweight search over active quests?

| Game Master | Take |
|-------------|------|
| Shaman | The live quest matters most; attach the oracle to the story already unfolding. |
| Challenger | Do not let the system invent a match too eagerly. The player should confirm attachment. |
| Regent | Use a priority order: explicit current quest, selected lens, then search candidates. Never auto-attach from search alone. |
| Architect | Implement matching as a resolver that returns ranked candidates with reasons. Keep attachment as a separate confirmed action. |
| Diplomat | Player consent matters because charge text can be private. Show what will attach before saving. |
| Sage | The right pattern is "suggest, then ask." Existing work should be honored without stealing agency. |

Recommendation: use all three in priority order. First honor explicit `currentQuestId`. Second use player-selected lens/domain. Third run a lightweight search over active quests and return candidates for confirmation. Do not auto-attach from search results.

#### 6. What exact daily free draw count is right for launch: 1, 2, or a progression-based allowance?

| Game Master | Take |
|-------------|------|
| Shaman | One daily draw gives the oracle ritual weight. It asks the player to bring a real question. |
| Challenger | Start stricter. If players need more, they can earn or spend for clarity instead of refreshing endlessly. |
| Regent | One is easiest to explain and govern. Progression-based allowances can come later after usage data. |
| Architect | One per day is simplest to implement and test. Avoid progression logic in V1. |
| Diplomat | One free draw is fair if alternatives remain free and waiting is framed gently. |
| Sage | One daily draw plus free non-oracle paths gives scarcity without trapping the player. |

Recommendation: launch with 1 free I Ching draw per day. Additional same-day clarity requires explicit vibeulon spend or waiting until tomorrow. Progression-based allowances can be V2 after the team sees whether scarcity helps players act or merely frustrates them.

#### 7. What should additional clarity cost in vibeulons?

| Game Master | Take |
|-------------|------|
| Shaman | The cost should create reverence, not anxiety. One vibeulon is enough to make the player pause without making clarity feel scarce in a harsh way. |
| Challenger | Make the cost real. If additional clarity is free or nearly free, players will use it to avoid action. |
| Regent | V1 needs a simple rule: one additional I Ching draw or RTCM clarification costs one vibeulon. Tune later with data. |
| Architect | A flat cost is easiest to implement, explain, and test. Avoid dynamic pricing in V1. |
| Diplomat | Keep the spend small and always show no-spend alternatives. Players should never feel pressured to pay to regulate. |
| Sage | One vibeulon works if the copy frames it as "spend for clarity" and the system still offers action, 321, or waiting. |

Recommendation: V1 additional clarity should cost 1 vibeulon per paid I Ching draw or RTCM clarification. No dynamic pricing in V1. Always show the exact cost, current balance when available, next free draw time, and a no-spend alternative.

#### 8. Should quest completion ever grant a free clarification token?

| Game Master | Take |
|-------------|------|
| Shaman | Yes, when the player completes action that came from a reading. The oracle should reward lived follow-through. |
| Challenger | Grant tokens for action, not for consumption. The player earns more clarity by doing the work. |
| Regent | Use a narrow rule. Completion of an oracle-linked quest may grant one non-transferable clarification token. |
| Architect | Add this after V1 if token storage is not already available. The first implementation can use vibeulons only. |
| Diplomat | A token is good if it feels like recognition, not manipulation. It should invite reflection after action. |
| Sage | This closes the loop: ask, act, complete, clarify. It turns divination into developmental rhythm. |

Recommendation: yes, but not as part of the minimum V1 if it complicates implementation. The intended rule is: completing a quest explicitly linked to an I Ching reading or oracle route can grant 1 free clarification token. The token should be non-transferable, expire after a reasonable window, and be usable for RTCM or one additional clarification, not for unlimited redraws.

#### 9. Should the draw reset use player timezone or server day?

| Game Master | Take |
|-------------|------|
| Shaman | The daily ritual should follow the player's lived day. Midnight should mean their midnight. |
| Challenger | Do not let timezone complexity stall the feature. Use the best available player timezone, with a server fallback. |
| Regent | Policy should be fair and auditable: player timezone when known, server day when unknown, record which basis was used. |
| Architect | Store or resolve timezone explicitly. Use server day only as fallback so tests remain predictable. |
| Diplomat | Player timezone feels less arbitrary and avoids punishing players outside the server's region. |
| Sage | The oracle belongs to the player's practice rhythm, so the reset should follow the player's day whenever possible. |

Recommendation: use player timezone when available, server day as fallback. Store the reset basis in the draw gate response or audit trail so support/debugging can explain why the allowance reset when it did.

### Hostile Review Resolutions

#### 10. In a paid subscription app, should RTCM be an additional paid option?

Context: the subscription should include access to the oracle system. The question is not whether RTCM is premium content. The question is whether repeated clarification should carry an in-game cost because RTCM can become a delay loop.

| Game Master | Take |
|-------------|------|
| Shaman | RTCM should remain available as a sacred clarification practice, but not as an infinite cave to hide in. A small vibeulon cost marks the threshold. |
| Challenger | Charge for repeated clarification. Not because the player owes more money, but because uncertainty has a gameplay cost. |
| Regent | Subscription grants access; vibeulons govern pacing. This distinction must be explicit in copy and code. |
| Architect | Implement RTCM as included capability with a draw-gate-style cost after the free daily draw has been consumed. Keep pricing configurable. |
| Diplomat | Avoid making regulation feel paywalled. Always offer no-spend alternatives: wait, attach to quest, take a small move, or go to 321. |
| Sage | RTCM should cost attention. Vibeulons are the ritualized cost of asking for more clarity before acting. |

Recommendation: RTCM is included in the subscription as a feature, but same-day RTCM clarification should cost 1 vibeulon in V1 unless the player has an earned clarification token. The cost represents delay/uncertainty friction, not premium access. The UI must say this plainly and always offer no-spend alternatives.

#### 11. Should V1 use a real audit table/event stream for draw/spend events while keeping narrative history in `storyProgress.state`?

| Game Master | Take |
|-------------|------|
| Shaman | Keep the story in the story layer. Do not let accounting machinery swallow the meaning of the reading. |
| Challenger | If something spends currency, it needs an audit trail. Otherwise people can argue with the system and the system cannot answer. |
| Regent | Yes. Economy events must be governable: draw consumed, spend confirmed, insufficient balance, reset basis, token grant/redemption. |
| Architect | Add a minimal `OracleEconomyEvent` or reuse an existing wallet/vibeulon event table if one already fits. Do not store charge text there. |
| Diplomat | Separate private material from supportable facts. Support can see that a spend happened without seeing the user's charged question. |
| Sage | Two histories: mythic/narrative history for the player, economic history for fairness and trust. |

Recommendation: yes. V1 should persist economy/audit events in a real queryable store or existing vibeulon event mechanism, while keeping private narrative route history in `storyProgress.state`. Economy events should never include private charge text.

#### 12. Should ambiguity and relationality be explicit player controls?

| Game Master | Take |
|-------------|------|
| Shaman | Ask lightly. The player can usually feel whether the question is foggy or relational. |
| Challenger | Do not make the intake form into a tax form. If controls add friction, the stuck player will bail. |
| Regent | Use explicit controls only when needed for routing. Defaults should be simple and optional. |
| Architect | Add optional fields: `ambiguity` and `relationality`, or infer them only from explicit button choices like "stuck on timing" or "relational move." |
| Diplomat | Explicit controls avoid covert interpretation and preserve trust. Make them plain-language choices. |
| Sage | Best route: one simple first prompt, then optional follow-up chips if needed. |

Recommendation: yes, but as optional explicit controls, not hidden inference. Use plain-language chips such as "timing feels unclear," "people/relationship involved," and "quest already in motion." Route from those explicit choices. Do not require every player to rate ambiguity and relationality on every use.

### Spec Hardening Review

#### 13. How should fallback behavior work when the recommended oracle path is unavailable or declined?

| Game Master | Take |
|-------------|------|
| Shaman | Never strand the player at the threshold. If the oracle gate is closed, offer a grounded practice that keeps the ritual moving. |
| Challenger | A blocked draw is a challenge to act. If they will not spend or wait, route to the smallest concrete move. |
| Regent | The router must not return an unusable primary recommendation. If a path is gated, the result needs a fallback path and a reason. |
| Architect | Add `primaryPath`, `gatedPath`, and `fallbackPath` or equivalent fields. The UI should not guess. |
| Diplomat | Declining to spend should feel respected, not like failure. Offer no-spend choices: attach to quest, Emotional Alchemy, 321, allyship card, or wait. |
| Sage | The fallback is not second-best; it is the system saying, "This is the next available right action." |

Recommendation: route results must include explicit fallback behavior whenever I Ching or RTCM is gated by allowance, vibeulon balance, or player choice. The UI should show the gated option and the recommended no-spend fallback. Fallback order: existing quest attachment, Emotional Alchemy move, allyship card for relational/campaign contexts, 321 for self-reported high or unchanged/increasing charge, or wait until next free draw.

#### 14. How should privacy boundaries be defined?

| Game Master | Take |
|-------------|------|
| Shaman | The charged question belongs to the player's inner chamber unless they choose to make an artifact from it. |
| Challenger | Do not let vague "attach context" language leak private text into quests. Force a boundary. |
| Regent | Define categories: private narrative, shareable artifact, and economy/audit event. Each category has different fields and permissions. |
| Architect | Create separate types. Do not pass one blob through all systems. Redaction should be structural, not a late string cleanup. |
| Diplomat | Consent must be explicit before anything private becomes quest-facing, campaign-facing, or visible to another player. |
| Sage | The right rule is transformation by consent: private charge can become a shareable artifact only after the player approves the form. |

Recommendation: split oracle data into three privacy classes using the canonical V1 contracts in the API layer: `PrivateOracleRouteHistory`, `ShareableOracleArtifact`, and `OracleEconomyAuditEvent`.

Private charge text must never be written into economy/audit events. Quest attachment should use a `ShareableOracleArtifact` generated from private history and approved by the player.

#### 15. When should the system ask whether charge went down?

| Game Master | Take |
|-------------|------|
| Shaman | Ask after the player has received a symbol or taken a small action. Do not interrupt the first confession of charge. |
| Challenger | Measure after moves. If charge is not changing, stop offering more interpretation and route to 321 or action. |
| Regent | Define checkpoint moments and route rules. Otherwise "charge trend" is decorative. |
| Architect | Add a lightweight `ChargeCheckpoint` type with before/after intensity and route source. |
| Diplomat | Keep the question simple and nonjudgmental: "Where is the charge now?" |
| Sage | Checkpoints close the loop. The point is not measurement; the point is knowing whether to deepen, act, or stop. |

Recommendation: ask for charge at entry and at defined checkpoints after meaningful interventions. V1 checkpoints:

1. After I Ching reading is accepted.
2. After RTCM clarification is completed.
3. After an allyship card is drawn for routed work.
4. After an Emotional Alchemy move.
5. Before routing to 321 from any lighter path.

If charge decreases, route toward action or quest attachment. If charge is unchanged or increasing, offer 321 or a stronger regulating path. Do not ask for repeated charge ratings during passive reading-only screens.

- Should intensity be self-reported only, inferred from text, or both? Proposed: self-reported only in V1; route based on reported intensity and charge trend.
- Should RTCM produce a new I Ching cast, or should V1 treat it as a structured reflection around a prior reading/event? Proposed: structured reflection in V1; optional cast-based RTCM later.
- Where should oracle route history live: `storyProgress.state`, a `PlayerBar`, or a dedicated table later? Proposed: recent private history in `storyProgress.state`, shareable outputs in `PlayerBar`/quests by consent, dedicated table later if needed.
- Should the allyship deck draw be random, consult-indexed, or both in this flow? Proposed: both; consult-indexed for routed work, random for open inspiration.
- Should existing lens quest matching use current quest state, player-selected lens, or a lightweight search over active quests? Proposed: all three in priority order, with confirmation before attachment.
- What exact daily free draw count is right for launch: 1, 2, or a progression-based allowance? Proposed: 1 free I Ching draw per day for V1.
- What should additional clarity cost in vibeulons? Proposed: 1 vibeulon per paid I Ching draw or RTCM clarification in V1.
- Should quest completion ever grant a free clarification token? Proposed: yes for completed oracle-linked quests, but may be V1.1 if token storage complicates V1.
- Should the draw reset use player timezone or server day? Proposed: player timezone when available, server day as fallback.
- In a paid subscription app, should RTCM be an additional paid option? Proposed: subscription includes RTCM access; vibeulon cost is an in-game delay/uncertainty cost for same-day clarification.
- Should V1 use a real audit table/event stream for draw/spend events while keeping narrative history in `storyProgress.state`? Proposed: yes; economy/audit events must be queryable and contain no private charge text.
- Should ambiguity and relationality be explicit player controls? Proposed: yes, optional plain-language chips/controls, never hidden inference.
- How should fallback behavior work when the recommended oracle path is unavailable or declined? Proposed: route result includes gated option plus no-spend fallback.
- How should privacy boundaries be defined? Proposed: separate private charge history, shareable artifacts, and economy/audit events.
- When should the system ask whether charge went down? Proposed: entry plus checkpoints after meaningful interventions, not passive reading screens.

## References

- `src/actions/cast-iching.ts`
- `src/lib/iching-cast-context.ts`
- `src/components/CastIChingModal.tsx`
- `src/lib/allyship-deck/types.ts`
- `src/lib/allyship-deck/assemble.ts`
- `public/oracle/deck.json`
- `src/app/shadow/321/Shadow321Runner.tsx`
- `src/lib/quest-grammar/resolveMoveForContext.ts`
- `packages/bars-core/src/quest-grammar/resolveMoveForContext.ts`
- `docs/process/spec-prework-iching-six-faces.md`
- `.specify/specs/flow-321-iching-quest-wizard/spec.md`
- `.specify/specs/321-efa-integration/spec.md`
- `.specify/specs/anthony-moog-quest-context/spec.md`
