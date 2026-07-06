# Surface Map: Charge Metabolism + Move Attempts

## Purpose

Map where charge currently enters BARS Engine, where it is metabolized, and where the new service-first move-attempt layer should attach.

This audit supports the next product decision: which surface should host the first player-facing move recommendation loop.

## Summary

The app already metabolizes charge in several places, but each surface owns a different fragment:

- Deck owns ritual/card context.
- Daily Charge owns repeatable cadence.
- BAR Capture owns raw charge entry.
- BAR Tune owns element/altitude/move metadata.
- 321 owns stuckness processing and aligned action.
- Alchemy Engine owns the strongest full arc.
- Quest Completion owns proof of action, but currently records too little emotional/move metadata.
- Move Library owns reusable content, not practice attempts.
- Campaign/Public Support owns low-friction collective action, not deep emotional inventory.

The missing product object is still `MoveAttempt`: the contextual instance of a recommended, chosen, practiced, reflected, or completed move.

## Chosen First Host

### Allyship Deck

Why:

- It matches the original desired game loop: draw card -> encounter blocker -> unpack vector -> receive aligned move.
- The deck already has card draw, card detail, journal, subject toggle, and "Send to BARS."
- Card context can provide domain, operation, and symbolic direction for translation.

Main gap:

- The deck does not yet ask guided dissatisfaction, desired target, or blocker.
- "Send to BARS" creates a seed quest, but not a move attempt.

Recommended first slice:

```text
Draw card
-> Work this card
-> ask guided dissatisfaction, confirm channel, choose desired target, blocker, internal/external
-> call recommendation service
-> create move-attempt draft client-side/service-side
-> show metabolize card + satisfaction card
-> capture reflection or send result to BAR
```

### Second Host: Daily Charge

Why:

- It is the repeatable daily pushup surface.
- It already enforces a daily ritual.

Main gap:

- It currently only mints or advances a BAR. It does not ask enough to infer a vector.

Recommended second slice:

```text
Spend daily charge
-> lightweight vector intake
-> recommend one move
-> log attempt/reflection
```

## Surface Audit

| Surface | Charge Enters As | Already Captures | Missing | Can Infer Vector? | Can Recommend Move? | Can Store Reflection? | MoveAttempt Timing |
|---|---|---|---|---|---|---|---|
| Allyship Deck | Card draw, card friction, card-to-BARS seed | card id, subject, draw journal, card domain/operation, seed provenance | guided dissatisfaction, desired target, blocker, orientation, completion/reflection | Not yet | Yes, after lightweight intake | Not yet, unless routed to BAR/quest | Now |
| Daily Charge | Daily ritual: mint charge or advance hand BAR | player, bar id, content for mint, maturity advance, daily marker | desired charge, blocker, vector, primitive, reflection | Not yet | Yes, after one extra intake step | Not directly | Later / second |
| BAR Capture | Raw charge text/photo | title, description, tags, field tint, seed maturity | desired state, blocker, route, primitive, completion | No | Not at capture time | No | Later; create charge intake, not attempt |
| BAR Tune | Playable charge metadata | element/nation, altitude/intensity, charge tag, move type, maturity | desired charge, route, blocker, primitive, recommendation | Partially, if tag resolves | Yes, after desired-state affordance | Not directly | Later |
| 321 / Clean Up | Stuckness and shadow material | phase snapshots, outcome, linked BAR/quest, aligned action, source charge BAR | explicit vector, primitive handoff, move attempt status | Partially | Yes, after clarity/aligned action | Yes, through session + linked artifacts | Later |
| Quest Completion | Completed task/action | quest id, player, campaign, reward/effects in some flows | emotional vector, primitive practiced, reflection outcome | Usually no | Not at completion; should record what happened | Sometimes, depending quest UI | Later, enrich completion |
| Alchemy Engine | Guided intake/action/reflection arc | channel, phase, regulation, selected action move, phase BARs, reflection BAR | Show Up primitives, cross-surface attempt object | Yes within arc | Yes | Yes | Strong candidate, but not first |
| Move Library | Reusable move browsing/admin curation | move definitions, tiers, origins, proposals, unlock/equip/use paths | contextual vector, blocker, attempt lifecycle | No | It can supply content, not decide context alone | No | Never directly |
| Campaign/Public Support | Role/domain support artifact | campaign ref, support details, role/domain-ish metadata, campaign BARs | full emotional inventory, player profile, deep vector | No by design | Yes, simplified role/domain moves only | Light support artifact only | Later / shallow |

## Detailed Findings

### Allyship Deck

Files checked:

- `src/components/deck/AllyshipDeckReader.tsx`
- `src/actions/deck-journal.ts`
- `src/actions/send-deck-card-to-bars.ts`
- `src/lib/allyship-deck/types.ts`

Current behavior:

- The deck records draws through `DeckJournalEntry`.
- Drawn or selected cards can be sent to BARS.
- `sendDeckCardToBars()` creates a `CustomBar` seed with card provenance in `agentMetadata`.
- The card carries move, operation, domain, subject readings, failure modes, and remediation.

Product read:

- This is the best ritual home, but it currently treats the card as the seed rather than using the card to metabolize a present charge.
- The next layer should not replace "Send to BARS"; it should add "Work this card" before or beside it.

MoveAttempt recommendation:

- Create a move attempt only after the player enters at least a present charge and desired charge.
- If blocker is missing, the service can still recommend with a default. UX should offer blocker context as an optional modifier, not as a requirement before showing the move.

### Daily Charge

Files checked:

- `src/components/now/DailyChargePanel.tsx`
- `src/actions/daily-charge.ts`

Current behavior:

- One daily charge can either mint a fresh `charge_capture` BAR or advance a hand BAR's maturity.
- Advancing logs a lightweight `charge_capture` marker.
- Daily Charge already has a clean habit loop.

Product read:

- This is the best practice-cadence home, but it currently metabolizes by maturity advancement rather than by vector/primitive selection.

MoveAttempt recommendation:

- Do not make this first unless the product goal is daily reps over card-loop proof.
- Add after Deck or as a parallel lightweight prototype.

### BAR Capture

Files checked:

- `src/actions/bars.ts`
- `src/actions/charge-capture.ts`

Current behavior:

- Captures raw text/photo and stamps maturity as `captured`.
- May include field tint, intensity, personal move in some capture paths.

Product read:

- BAR Capture should stay frictionless. Requiring desired state or blocker here would harm the front door.

MoveAttempt recommendation:

- Do not create a move attempt at initial capture by default.
- It may create a `ChargeIntake` concept later, but not a `MoveAttempt` until the player chooses to work the charge.

### BAR Tune

Files checked:

- `src/components/bars/TuneBarClient.tsx`
- `src/actions/bars.ts` (`tuneBar`)

Current behavior:

- Tune writes `nation`, `intensity`, `emotionalAlchemyTag`, and `moveType`.
- Maturity advances to `context_named`, `elaborated`, or `shared_or_acted`.

Product read:

- BAR Tune asks "what is this charge?" but not "where is it trying to go?"
- It is close to vector inference but lacks desired state and blocker.

MoveAttempt recommendation:

- Later: add a route/planning panel before graduation.
- Good place to attach move attempts once the player asks to work a BAR.

### 321 / Clean Up

Files checked:

- `src/actions/charge-metabolism.ts`
- `src/lib/quest-grammar/deriveMetadata321.ts`
- `src/components/quest-creation/QuestWizard.tsx`

Current behavior:

- 321 persists `Shadow321Session`.
- It stores phase snapshots, outcome, linked BAR/quest, optional source charge BAR.
- It can derive a quest and move type from aligned action.
- It already has "next smallest honest action" language.

Product read:

- 321 is already a metabolism chamber. The hole is not processing; the hole is handoff from insight into Show Up primitive.

MoveAttempt recommendation:

- Later: after 321 clarity, call recommendation service using extracted present charge and desired action/resolution.
- Store the resulting attempt as linked to the `Shadow321Session`.

### Quest Completion

Files checked:

- `src/actions/quest-completion.ts`
- `src/actions/quest-engine.ts`
- `src/components/QuestDetailModal.tsx`
- `src/actions/twine.ts`

Current behavior:

- Some flows record completion effects, reward, campaign impact, and generated BARs.
- `onPlayerQuestCompletion()` itself is thin and mostly logs/revalidates.

Product read:

- Quest completion is where proof of Show Up often appears, but emotional vector and primitive are usually absent.

MoveAttempt recommendation:

- Later: quest completion should enrich an existing move attempt or create a legacy attempt snapshot if the quest was itself the move.
- Do not start here; completion is downstream.

### Alchemy Engine

Files checked:

- `src/actions/alchemy-engine.ts`
- `src/components/alchemy-engine/IntakePhaseStep.tsx`
- `src/components/alchemy-engine/ActionPhaseStep.tsx`
- `src/components/alchemy-engine/ReflectionPhaseStep.tsx`
- `src/lib/alchemy-engine/*`

Current behavior:

- Strongest full metabolism arc: intake -> action -> reflection.
- Creates phase BARs.
- Tracks regulation and channel.
- Reflection becomes an epiphany BAR.

Product read:

- This is the most complete metabolism lab, but it may be too heavy for the simple move pushup loop.

MoveAttempt recommendation:

- Strong implementation substrate.
- Not recommended as first player-facing host unless we want the move system to feel like a guided quest arc rather than a daily/card practice.

### Move Library

Files checked:

- `src/actions/move-proposals.ts`
- `src/actions/moves-library.ts`
- `src/lib/transformation-move-registry/*`
- `src/lib/nation/*`
- `src/app/admin/moves/*`

Current behavior:

- There are admin and player move-library paths.
- Move proposals and NationMoves have tier/origin concepts.
- Some moves can be unlocked, equipped, or used.

Product read:

- This is reusable move content, not proof of practice.
- It must remain separate from contextual move attempts.

MoveAttempt recommendation:

- Never create a move attempt merely because a player browses, unlocks, equips, or reads a move.
- A move library entry can be referenced by a recommendation or attempt.

### Campaign / Public Support

Files checked:

- `src/actions/the-crossing-support.ts`
- `src/actions/allyship-intake.ts`
- `src/components/event/DonationSelfServiceWizard.tsx`
- `src/app/event/donate/wizard/page.tsx`

Current behavior:

- Public/campaign flows can capture support, roles, donations, and campaign-scoped BARs.
- These flows are intentionally low-friction.

Product read:

- Public supporters should not be asked for deep emotional vector data by default.
- The move system can still offer role/domain moves.

MoveAttempt recommendation:

- Later: support shallow `campaign_support` move attempts.
- No full emotional inventory unless a supporter becomes a logged-in player and opts in.

## Data Ownership Matrix

| Data | Canonical Owner Now | Gap |
|---|---|---|
| Raw charge text | `CustomBar.description`, charge capture actions | No common charge intake wrapper |
| Element/channel | BAR `nation`, Alchemy Engine `channel`, alchemy state resolver | Multiple vocabularies: element/nation/channel |
| Altitude | BAR `intensity`, Alchemy Engine `regulation`, alchemy state altitude | Same concept appears under different names |
| Move type | BAR/Quest `moveType`, deck `move`, move library stage | WAVE move type is not Show Up primitive |
| Desired state | Mostly absent | Required for vector/route |
| Blocker | Present in some move-generator/intake flows | Not canonical |
| Route | New alchemy route planner | Not wired to surfaces |
| Primitive | New Show Up primitive layer | Not persisted |
| Recommendation | New service output | Not persisted; service-first by design |
| Attempt status | Absent | Needs lifecycle helpers |
| Reflection/outcome | 321, Alchemy Engine, some quest completion flows | Not attached to primitive/vector consistently |

## Holes To Solve

1. Present/desired/blocker intake is missing from the Deck.
2. Daily Charge lacks vector inference.
3. BAR Tune lacks desired state and route planning.
4. 321 lacks a canonical Show Up primitive handoff.
5. Quest completion lacks primitive/vector/outcome metadata.
6. Move library content is not clearly separated from contextual move attempts in product language.
7. Access levels for move attempts are not yet implemented.
8. No lifecycle helpers exist for recommended -> chosen -> practiced -> reflected -> completed.

## Implementation Recommendation

Proceed in this order:

1. Add lifecycle helpers to the service layer.
2. Build Deck "Work this card" prototype using the existing service.
3. Add completion/reflection capture for the Deck prototype.
4. Decide whether the first persisted form is a new `MoveAttempt` model or a temporary snapshot attached to the BAR/deck journal entry.
5. Expand the same panel to Daily Charge.

Do not wire BAR Capture first. It should remain the lowest-friction charge entry point.
