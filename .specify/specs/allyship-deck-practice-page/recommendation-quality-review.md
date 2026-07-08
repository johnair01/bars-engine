# Recommendation Quality Review

Date: 2026-07-05

Scope: hostile quality pass for `recommendDeckCardPractice(input)` after introducing the MVP tool registry and card practice recommendation service.

## Review Target

The recommendation API should compose:

- card lens: WAVE move, operation, domain, output BAR
- emotional vector: present charge to desired satisfaction
- player mode: quick action or go deeper
- blocker/story hints: belief, ask/boundary, body, mapping, part
- tool registry: protocol, output kinds, completion criteria

The system should prefer vector-family logic and MVP tools before falling back to generic affinity. It should not create fake confidence, overfit blocker keywords, or recommend a tool that cannot produce an inspectable player output.

## Hostile Questions

- Does the same tool win everywhere?
- Does Happy Apples win just because Open Up + Gather Resources makes it look attractive?
- Does quick mode become emotional processing instead of action/help?
- Does deep mode become premature external action?
- Do blocker/story keywords overpower the emotional vector?
- Does operation change the actual recommendation, or only decorate the copy?
- Does the selected practice lens and output kind match the player context?

## Golden Matrix

Tested cards:

- `OPEN-GR-CHALLENGER`
- `CLEAN-RA-SAGE`
- `SHOW-DA-CHALLENGER`

Tested vectors:

- sadness:dissatisfied -> sadness:satisfied
- anger:dissatisfied -> anger:satisfied
- fear:dissatisfied -> fear:satisfied
- joy:dissatisfied -> joy:satisfied
- neutrality:dissatisfied -> neutrality:satisfied

### `OPEN-GR-CHALLENGER`

| Vector | Selected tool | Top 3 | Lens | Rating |
|---|---|---|---|---|
| sadness -> satisfaction | Find the Felt Thread | felt_thread, charge_dialogue_321, make_it_real | clean_up | Green |
| anger -> satisfaction | 321 Charge Dialogue | charge_dialogue_321, story_turnaround, clean_line | clean_up | Green |
| fear -> satisfaction | Find the Felt Thread | felt_thread, charge_dialogue_321, story_turnaround | clean_up | Green |
| joy -> satisfaction | Make It A Game | make_it_a_game, happy_apples, make_it_real | clean_up | Green |
| neutrality -> satisfaction | Find the Felt Thread | felt_thread, happy_apples, clean_line | clean_up | Green |

Notes:

- Sadness, fear, and neutrality route toward sensing/clarifying the charge before any social action.
- Anger routes toward 321 over raw action, which is acceptable for deep mode.
- Joy now routes to Make It A Game when the vector itself supports joy/bliss. This resolves the earlier next-tier dependency.

### `CLEAN-RA-SAGE`

| Vector | Selected tool | Top 3 | Lens | Rating |
|---|---|---|---|---|
| sadness -> satisfaction | 321 Charge Dialogue | charge_dialogue_321, felt_thread, make_it_real | clean_up | Green |
| anger -> satisfaction | Story Turnaround | story_turnaround, charge_dialogue_321, bar_capture | clean_up | Green |
| fear -> satisfaction | Story Turnaround | story_turnaround, charge_dialogue_321, felt_thread | clean_up | Green |
| joy -> satisfaction | Make It A Game | make_it_a_game, make_it_real, happy_apples | clean_up | Green |
| neutrality -> satisfaction | Find the Felt Thread | felt_thread, happy_apples, story_turnaround | clean_up | Green |

Notes:

- Clean Up + Sage correctly pulls inquiry, part dialogue, and felt-sense work.
- Joy to satisfaction chooses Make It A Game. Make It Real and Happy Apples remain useful supporting candidates, but the default joy/bliss route no longer depends on next-tier tools.

### `SHOW-DA-CHALLENGER`

| Vector | Selected tool | Top 3 | Lens | Rating |
|---|---|---|---|---|
| sadness -> satisfaction | 321 Charge Dialogue | charge_dialogue_321, make_it_real, felt_thread | clean_up | Green |
| anger -> satisfaction | Story Turnaround | story_turnaround, charge_dialogue_321, clean_line | clean_up | Green |
| fear -> satisfaction | Story Turnaround | story_turnaround, charge_dialogue_321, felt_thread | clean_up | Green |
| joy -> satisfaction | Make It A Game | make_it_a_game, make_it_real, happy_apples | clean_up | Green |
| neutrality -> satisfaction | Find the Felt Thread | felt_thread, happy_apples, clean_line | clean_up | Green |

Notes:

- Deep mode correctly starts with charge stabilization even when the card is Show Up.
- The card can still surface action-capable tools in the top three.
- Joy now has an MVP-native processing tool. Remaining thinness is about operation-aware protocol variation, not tool availability.

## Same Vector, Different Card Lens

Vector: fear:dissatisfied -> fear:satisfied.

| Card | Selected tool | Top 3 | Rating |
|---|---|---|---|
| `OPEN-GR-SHAMAN` | Find the Felt Thread | felt_thread, charge_dialogue_321, story_turnaround | Green |
| `OPEN-GR-CHALLENGER` | Find the Felt Thread | felt_thread, charge_dialogue_321, story_turnaround | Green |
| `OPEN-GR-DIPLOMAT` | Find the Felt Thread | felt_thread, charge_dialogue_321, story_turnaround | Green |
| `OPEN-GR-SAGE` | Find the Felt Thread | felt_thread, charge_dialogue_321, story_turnaround | Green |

Finding:

The vector stays primary, which is correct. The operation lens changes reasons and score strength but does not overpower the fear vector. This is currently sane for MVP, but a future richer operation layer should change the selected protocol variation, not merely the reason text.

## Same Card, Different Blocker

Card: `OPEN-GR-CHALLENGER`.

Vector: sadness:dissatisfied -> sadness:satisfied.

| Blocker/story hint | Selected tool | Expected behavior | Rating |
|---|---|---|---|
| belief/not enough/perfect | Find the Felt Thread | Story Turnaround rises but does not dominate sadness vector | Green |
| ask/boundary/message | Find the Felt Thread | Clean Line rises but does not dominate sadness vector | Green |
| body/heavy/tight | Find the Felt Thread | Felt-sense work is reinforced | Green |
| roles/resources/sequence unclear | Find the Felt Thread | Put It On The Board rises but does not dominate sadness vector | Green |
| triggered part/disappear | 321 Charge Dialogue | Part cue can override into 321 | Green |

Finding:

Blocker hints behave as nudges. The only override is a part/projection signal into 321, which is appropriate because sadness may need the part to speak before the care/distance can be restored.

## Quick vs Deep

Card: `OPEN-GR-CHALLENGER`.

| Case | Selected tool | Lens | Rating |
|---|---|---|---|
| quick, no vector | Clean Line | show_up | Green |
| deep sadness vector | Find the Felt Thread | clean_up | Green |
| deep anger vector | 321 Charge Dialogue | clean_up | Green |

Finding:

Before tuning, quick mode selected Happy Apples because Open Up + Gather Resources + Experience made appreciation look stronger than the action need. That was a red failure. The service now applies a small next-tier tool penalty so MVP tools are preferred unless the vector fit is stronger. Quick action now chooses Clean Line, which better matches "The Ask You're Avoiding."

## Tuning Applied

File: `src/lib/allyship-deck/practice-recommendations.ts`

- Added `NEXT_TIER_PENALTY = 12`.
- Applied it to tools marked `tier: 'next'`.
- Added an explicit reason: `next-tier tool held behind MVP tools unless fit is stronger`.

Why this tuning:

- It fixes the immediate Happy Apples quick-mode failure.
- It preserves joy-vector access to Happy Apples and Make It Real as supporting candidates while Make It A Game owns the MVP default.
- It keeps the remediation at the scoring/metadata layer rather than inventing UI or AI inference.

## Tests Added

File: `src/lib/allyship-deck/__tests__/practice-recommendation-quality.test.ts`

Locked expectations:

- Golden matrix does not collapse each card into one universal tool.
- Quick `OPEN-GR-CHALLENGER` selects Clean Line, not Happy Apples.
- Operation lens changes score/reason without overpowering vector.
- Blocker hints raise the relevant tool without dominating sadness vector.
- Part/projection blocker can select 321.
- Quick and deep modes produce different selected tools.
- Sadness and anger vectors produce different selected tools.

## Remaining Yellow Areas

1. Joy-native MVP processing is thin.
   - Current joy routes now have an MVP tool through Make It A Game.
   - Recommendation: author a joy-native MVP tool or promote/adapt one existing tool once its protocol has enough teeth.

2. Operation lens is visible but not yet protocol-transforming.
   - Shaman/Challenger/Diplomat/Sage affect ranking and reasons.
   - Recommendation: later add operation-aware protocol modifiers so the same tool changes its steps or output shape.

3. Desired satisfaction spirit is not yet explicit in the payload.
   - The vector is used, but the recommendation does not yet expose "in the spirit of peace/triumph/poignance/bliss/wonder" as a first-class modifier.
   - Recommendation: add satisfaction-spirit metadata after the current service has UI consumption.

4. Deep Show Up starts with Clean Up, by design.
   - This is right when the player enters through dissatisfaction, but it may confuse product copy.
   - Recommendation: the UI should name this as "first card/tool" rather than "the whole move."

## Current Judgment

MVP recommendation quality is Green for API-first development.

It is not yet ready to generate full move-card copy or scenario-specific practices at scale. The next valuable work is to connect this service to an intake surface and make sure the selected tool, protocol, blocker field, and exportable output feel playable.
