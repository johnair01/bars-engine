# Pilot Review: Allyship Deck Practice Overlays

Date: 2026-07-05

Scope: 10-card pilot generated from `buildPilotCardPracticeOverlays()` after adding diagnostic blocker-shape samples.

Judgment scale:

- Green: usable pilot overlay
- Yellow: structurally valid but needs tuning before scale
- Red: wrong enough to block UI exposure

## What Changed

The first pilot review only sampled Wake and Clean cards by emotional channel. That made it look like some moves were missing. The revised pilot now samples by **blocker shape** as well:

- body / unclear signal
- field confusion
- belief / story
- part / projection
- capture / artifact
- care distance
- commitment practice
- action pressure
- joy trust

This better answers the real question:

```text
Do the existing moves/tools appear when the player gives the system the right kind of context?
```

## Matrix

| Card | Status | Preferred tools | Diagnostic samples | Quick example | Flags | Rating |
|---|---|---|---|---|---|---|
| `WAKE-GR-SHAMAN` What's Actually Scarce | pilot | Put It On The Board, Find the Felt Thread, 321 Charge Dialogue | body -> Felt Thread; field -> Felt Thread with Board in candidates; part -> 321; capture -> Felt Thread with BAR Capture in candidates | none | no quick, operation modifier gap | Green |
| `WAKE-SO-ARCHITECT` The Structure That Wants to Exist | pilot | Put It On The Board, BAR Capture, Find the Felt Thread | body -> Felt Thread; field -> Felt Thread with Board in candidates; part -> 321; capture -> Felt Thread with BAR Capture in candidates | none | no quick, operation modifier gap | Green |
| `OPEN-GR-CHALLENGER` The Ask You're Avoiding | pilot | Happy Apples, Clean Line, Find the Felt Thread | care distance -> Felt Thread | Clean Line -> clean ask/boundary | missing vector, external Show Up, operation modifier gap | Green |
| `OPEN-GR-DIPLOMAT` The Tenderness of Asking | pilot | Make It Real, Happy Apples, Find the Felt Thread | care distance -> Felt Thread | Clean Line -> clean ask/boundary | missing vector, external Show Up, operation modifier gap | Green |
| `CLEAN-RA-SAGE` What the Truth Taught | pilot | Story Turnaround, 321 Charge Dialogue, BAR Capture | belief -> Story Turnaround; field -> Story Turnaround with Board in candidates; part -> 321; capture -> Felt Thread with BAR Capture in candidates; joy -> Make It A Game | none | joy/bliss sample, no quick, operation modifier gap | Green |
| `CLEAN-DA-CHALLENGER` The Enemy Story | pilot | Story Turnaround, 321 Charge Dialogue, Clean Line | belief -> Story Turnaround; field -> Story Turnaround with Board in candidates; part -> 321; body -> Felt Thread; capture -> Felt Thread with BAR Capture in candidates | none | no quick, operation modifier gap | Green |
| `GROW-SO-REGENT` Practice Delegating | pilot | Put It On The Board, BAR Capture, Clean Line | commitment -> Felt Thread with Board/BAR/Clean Line in candidates; part -> 321 | Put It On The Board -> field map | missing vector, internal Show Up, operation modifier gap | Green |
| `GROW-RA-SAGE` Who Truth-Telling Makes You | pilot | BAR Capture, Story Turnaround, 321 Charge Dialogue | commitment -> Felt Thread with BAR Capture in candidates; part -> 321 | BAR Capture -> BAR-ready reflection | missing vector, internal Show Up, operation modifier gap | Green |
| `SHOW-DA-CHALLENGER` Make the Move | pilot | Clean Line, One True Next Move, Story Turnaround | action pressure -> Story Turnaround with Clean Line / One True Next Move in candidates | Clean Line -> clean ask/boundary | missing vector, external Show Up, operation modifier gap | Green |
| `SHOW-SO-ARCHITECT` Build to Last | pilot | One True Next Move, Put It On The Board, Clean Line | action pressure -> Story Turnaround with Board / Clean Line / BAR Capture in candidates | BAR Capture -> BAR-ready reflection | missing vector, external Show Up, operation modifier gap | Green |

## Diagnostic Coverage Counts

### Wake Up

Across the two Wake cards, diagnostic samples now surface:

- Find the Felt Thread for body / unclear signal
- Put It On The Board in field-confusion candidates
- 321 Charge Dialogue for part / projection
- BAR Capture in capture / artifact candidates

Conclusion:

The Wake moves/tools exist. The earlier 4/4 Felt Thread result was a sample-scope artifact, not proof of missing Wake moves.

Remaining concern:

Felt Thread still often remains the selected tool even when Board or BAR Capture rises in candidates. That may be okay for deep emotional-vector work, but UI copy should show likely alternatives rather than only the selected first tool.

### Clean Up

Across the two Clean cards, diagnostic samples now surface:

- Story Turnaround for belief / story blockers
- 321 Charge Dialogue for part / projection blockers
- Put It On The Board in field-confusion candidates
- Find the Felt Thread for body / unclear signal
- BAR Capture in capture / artifact candidates

Conclusion:

The Clean moves/tools exist. The earlier 4/5 Story Turnaround result was caused by story-shaped sample blockers.

Remaining concern:

`CLEAN-RA-SAGE` still contains an intentional joy/bliss sample, but it now selects Make It A Game as an MVP tool instead of depending on Make It Real.

## Findings

### 1. Overlay Layer Works

The overlay layer preserves stable card identity while generating contextual practice examples.

Evidence:

- all 10 pilot cards are authored and found
- all overlays include stable card lens
- all overlays include preferred tools with reasons
- all overlays include at least one deep example
- at least four overlays include quick examples
- all examples produce step copy, expected outputs, and completion criteria
- diagnostic samples now include blocker shape and top candidate tool ids

Rating: Green.

### 2. Missing Wake/Clean Options Are Mostly Not Missing

Wake and Clean have the expected tool coverage when the sample set includes the right blocker shapes.

What changed:

- The review no longer treats Felt Thread or Story Turnaround repetition as proof of missing moves.
- The pilot now distinguishes selected first tool from top candidate coverage.

Rating: Green.

### 3. Joy/Bliss Has an MVP Tool, but Still Needs Protocol Modifiers

The intentional joy sample on `CLEAN-RA-SAGE` selects Make It A Game and is no longer flagged as next-tier.

Why this matters:

- Joy/bliss no longer depends on future-tool coverage.
- The sample remains visible so designers can review whether Make It A Game is being used as clean participation rather than forced fun.

Likely remediation:

- Add operation-aware protocol modifiers so Make It A Game changes shape under Sage, Challenger, Regent, Architect, Diplomat, and Shaman.
- Keep handoff notes in the tool protocol so joy can reveal sadness, fear, anger, or neutrality without bypassing them.

Rating: Green for MVP coverage; Yellow follow-up for operation-aware modifiers.

### 4. Operation Lens Still Does Not Modify Protocol

Every overlay includes `operation_protocol_modifier_gap`.

Why this matters:

- Operation currently influences ranking/reasons.
- It does not yet alter the tool protocol itself.
- Eventually, the same tool under Shaman, Challenger, Regent, Architect, Diplomat, and Sage should shift how the protocol is framed.

Likely remediation:

- Add operation-aware protocol modifiers after the practice page consumes overlays.
- Keep this as a review flag, not a blocker for the pilot.

Rating: Yellow, acceptable.

## Green Overlays

Safe to use as initial UI examples or player-facing pilot language:

- `WAKE-GR-SHAMAN`
- `WAKE-SO-ARCHITECT`
- `OPEN-GR-CHALLENGER`
- `OPEN-GR-DIPLOMAT`
- `CLEAN-RA-SAGE`
- `CLEAN-DA-CHALLENGER`
- `GROW-SO-REGENT`
- `GROW-RA-SAGE`
- `SHOW-DA-CHALLENGER`
- `SHOW-SO-ARCHITECT`

No Red overlays were found.

## Before All-120 Expansion

Required:

1. Keep diagnostic blocker-shape sampling for all cards.
2. Expose top candidate tools in designer/admin review, not just selected first tool.
3. Keep joy/bliss review visible, but do not treat it as yellow unless the chosen tool is next-tier or collapsed.
4. Decide the strategy for operation-aware protocol modifiers.
5. Use Green overlays for player-facing UI first.

## Current Judgment

The overlay pilot is successful as an API-first design artifact.

The existing Wake and Clean moves are more complete than the first review suggested. Joy/bliss now has an MVP tool through Make It A Game. The next product step can be UI handoff or practice-page integration, with operation-aware protocol modifiers remaining the major follow-up.
