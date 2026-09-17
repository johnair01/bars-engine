# Understood: hostile playtest lab

**Started:** September 17, 2026

**Build under review:** `f5d6a4487` on the bars-engine preview

**Evidence types:** published research, source-backed adversarial walkthroughs, and future observed play. The walkthroughs below are simulations of the implemented rules, not reports of human participants.

## What we are trying to learn

Understood tries to lengthen a fast escalation and shorten a long unresolved conflict. Test those as separate effects. A player can feel heard while the conversation is still hot; a conversation can cool while the underlying issue remains. A meter reaching zero is the player's report of resolution, not proof that an agreement was made or will hold.

For each run, ask four questions: (1) Could each player express what was actually present? (2) How many voluntary disclosures did it take to reach an owner-confirmed core issue? (3) Did it slow an escalation without trapping the conversation? (4) Did it help address the issue beyond moving chips and meters? Use the standard conflict deck and milestone definitions in [core-issue-study-and-reflection-spec.md](./core-issue-study-and-reflection-spec.md).

## Research basis for the stress cases

- In home conflict diaries, demand/withdraw patterns were associated with more negative emotion and lower conflict resolution. Test an eager asker with a partner who needs time and may pass repeatedly. [Papp, Kouros & Cummings, 2009](https://pubmed.ncbi.nlm.nih.gov/22102789/).
- Money conflicts were less frequent than some other topics in 748 diary instances, but more recurrent, pervasive, and unresolved despite more problem-solving attempts. Test a recurring material disagreement whose practical constraint cannot be changed by being heard. [Papp, Cummings & Goeke-Morey, 2009](https://pmc.ncbi.nlm.nih.gov/articles/PMC3230928/).
- The effect of demand/withdraw behavior differed with socioeconomic hardship in two longitudinal studies. Do not score every direct request, withdrawal, or lack of verbal polish as a failure; ask whether a move served that pair's actual needs. [Ross and colleagues, 2019](https://pubmed.ncbi.nlm.nih.gov/30321045/).
- Interviews with neurodiverse couples reported differences in communication and reading emotion. Test clear literal language, uncertain emotion labels, and a player who needs more time without making either style a deficit by default. [Smith and colleagues, 2021](https://pubmed.ncbi.nlm.nih.gov/33216278/).
- In observed couple discussions, higher emotional flooding was associated with worse problem solving. Test whether a high-heat player can pause and resume without the turn clock or meter goal adding pressure. Do not stage actual coercion or violence as a normal two-player playtest. [Malik and colleagues, 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7007326/).
- Mixed positive and negative feelings can co-occur. Test whether a player can hold appreciation and anger together without a forced, premature choice of a single emotional label. [Mixed Emotions and Coping, 2014](https://pubmed.ncbi.nlm.nih.gov/25084461/).
- Roommate research examined implicit harmony-preserving and explicit feeling-advocating styles across socioeconomic context. Test whether the game's spoken disclosure requirement fits a pair who usually handles conflict indirectly. [Cultural modes of conflict resolution and roommate satisfaction](https://pubmed.ncbi.nlm.nih.gov/39411031/).

These studies motivate test cases. They do not establish that the game works, or that every couple in a category behaves the same way.
Most evidence above is about romantic couples; its transfer to friends, siblings, roommates, and coworkers is an untested product assumption.

## Player journey

| ID | Moment | Player's job | What to observe |
| --- | --- | --- | --- |
| P0 | Decide to play | Both choose to engage and name one issue aloud | Is the issue specific enough? Is either person participating only to appease the other? |
| P1 | Seal private meters | Each gauges unresolvedness, then hands over the device | Does the other person glimpse the value? Does the number feel meaningful? |
| P2 | Make a first bid | Pick a color, face, stack, and spoken or silent placement | Can they map the actual feeling to a move? Can they find the control? |
| P3 | Receive the bid | Listen, ask more, pass, or respond with own chip | Does the receiver understand face up as an invitation, not a demand? |
| P4 | Notice temperature | Signal rising heat, slow down, possibly pause | Does the public heat reflect what either person notices? Can they stop without penalty? |
| P5 | Hold what is unfinished | Add a later chip to a stack, or keep a sealed layer waiting | Does stack height communicate magnitude or distinct unfinished feelings? |
| P6 | Decide if heard | Owner alone judges a spoken chip; all stack layers must be heard before release | Is “heard” distinguishable from agreement, compliance, or exhaustion? |
| P7 | Apply relief | Owner chooses cooling or private resolution; chip goes to listener | Can they explain why one track changed and the other did not? |
| P8 | Continue or conclude | Pass, disclose again, or announce personal resolution | Is there a substantive next action, or only a meter outcome? Can the other player still continue? |
| P9 | Reflect after play | Optionally name the core issue, new insight, and next action; choose whether to do a private 3-2-1 | Does reflection reveal a useful pattern without pressuring more disclosure? |
| P10 | Review a pattern later | Compare user-chosen issue tags and revised insights across sessions | Does the pattern fit the player's experience? Was follow-through checked? |

## Game journey and invariants

`setup → opening ritual → active turn → spoken/silent placement or speak waiting chip → out-of-turn question, heat, donation, trade, acknowledgment, release → explicit pass → opposite turn → both meters zero and heat zero`.

The active turn permits one placement and one spoken bid. The current implementation permits one silent placement plus speaking a previously waiting chip in the same turn. A spoken chip can be marked heard at any time. Every chip in its stack must be heard before any one can leave. On release, one chip goes to the other hand and **either** public heat **or** that chip owner's private meter drops exactly one. Questions temporarily move one chip into an offer; if more is shared it returns to the asker, and if nothing more is shared it goes to the speaker. Timer expiry does not pass a turn.

At every transition check: 50 total chips across hands, stacks, and question offer; no negative hand; heat and meters within 0–5; no more than one placement per turn; only the owner changes a chip's face or declares it heard; a release changes exactly one track; and a player can always choose to pause or end play. The last two are product expectations to verify, not guaranteed by the present code.

## Effectiveness matrix

Score each dimension 0–3 after a run: **C** comprehension (can explain the next legal move); **E** expression (feeling fits a chip without distortion); **R** regulation (heat is noticed and can slow); **U** understanding (partner can accurately restate a core-issue candidate and its owner confirms or corrects it); **I** issue progress (a workable next action or honest remaining constraint appears); **A** agency (each can decline, pause, or protect a boundary). `0` means blocked or harmful to the goal, `1` means only with coaching, `2` means useful but with friction, `3` means the players can do it unaided. Record each player's score separately; do not average away a one-sided failure. Alongside scores, record disclosures to confirmed understanding, disclosures to action, and whether a later reflection revised the initial core-issue hypothesis. Also record a rule defect, interface defect, or product-fit failure separately.

| Case | Conflict and heat | Differing player needs | Stressed journey | Likely break to probe | Best evidence |
| --- | --- | --- | --- | --- | --- |
| H1 | Changed shared plan; 1→2 | One wants inclusion; one values spontaneity | P2–P8 | Tutorial example works only when both cooperate | Can each restate the other's need; specific future plan |
| H2 | Recurring household labor; 2→4 | One brings several old examples; one hears a global accusation | P2, P5–P7 | Five stacks fragment one issue; stack lock delays relief | Time to first heard chip; issue drift; unresolved remainder |
| H3 | Money shortfall; 3→4 | Constraint is external, neither can promise the desired fix | P6–P8 | Meter can fall without a viable change | Concrete decision or honest “still unresolved” after game |
| H4 | Boundary breach; 4→5 | One needs a firm change; one wants quick reconciliation | P3–P8 | Listener pressures owner to mark heard or cool first | Owner's ability to decline, pause, keep meter high |
| H5 | Pursue/withdraw loop; 2→4 | One repeatedly asks; one needs silence or more time | P3–P4 | Paid question and timer become pressure | Number of passes; perceived pressure; useful resume path |
| H6 | Mixed anger and appreciation; 2→3 | Player values partner but is also angry | P2, P5 | One color per turn distorts mixed feeling | Player chooses colors without losing meaning |
| H7 | Literal and indirect communicators; 1→3 | One needs explicit wording; one signals indirectly | P2–P3, P6 | Chip prompts and “heard” are interpreted differently | Correct paraphrase; time and copy needed |
| H8 | Unequal investment in the issue; 1 versus 5 | One starts almost resolved; one has a long account | P1, P7–P8 | Zero-meter player exits emotionally or wins too early | Continued attention after one reaches zero |
| H9 | Scarcity and backlog; 3 | One hand empties while waiting chips remain in stacks | P5–P6 | Resource deadlock or forced donation | Legal path to speak each waiting chip |
| H10 | Private information or mistrust; 2→4 | One wants questions but not about every detail | P3, P6 | Other player flips a sealed chip or peeks at meter | Owner control of face and meter privacy |
| H11 | Acute flooding; 5 | A player cannot process the next prompt | P4–P8 | Clock and completion cues push continuation | Voluntary pause, recovery, no forced release |
| H12 | Coercion or fear of retaliation; any | One cannot safely decline or report a true meter | P0–P8 | Game mechanics give a false appearance of consent | Exclude from ordinary dyadic testing; use expert review |
| H13 | Roommate noise and shared space; 1→3 | One favors indirect hints; one expects explicit requests | P2–P3, P8 | Spoken disclosure feels unnatural, or no concrete house rule emerges | Mutually understood request; viable shared-space plan |
| H14 | Adult siblings and care duties; 3→4 | Old family roles distort a new practical decision | P0–P2, P5–P8 | One named issue expands into a lifetime of grievances | Can each separate present request from older stack layers? |
| H15 | Coworkers with unequal authority; 2→4 | Junior person may hesitate to disclose or mark unresolved | P0–P8 | Turn and meter symmetry hides actual power | Do not use a manager–report test as evidence of free consent; expert review first |

Run H1 first as a control. Next run H3, H5, H7, H9, and H10 because they challenge distinct assumptions. H2, H4, H6, and H8 probe generality. H11 is a controlled fictional simulation with a stop point. H12 is a boundary of use, not a role-play invitation.

## Initial hostile walkthroughs (source-backed, no human participants yet)

| Trace | Expected | What the current implementation does | Classification |
| --- | --- | --- | --- |
| H9: spend the last hand chip as a silent placement; on the next turn select an already placed unspoken chip | Under the agreed scarcity rule, ask about the partner's open chip or receive a donation before speaking again | `speak()` returns early when `count(hand) === 0`; the UI disables **Speak this chip**. This is consistent with the rule. If **both** hands empty into sealed or unspoken stacks, neither can ask, trade, donate, speak, or release; passing only alternates turns. | **P1 economy deadlock in extreme state**; P5–P6 |
| H10: listener selects the owner's sealed spoken chip | Only its owner may choose whether questions are invited | The shared **Flip to invite questions** button calls `flip()` without checking the acting seat. Any person holding the device can change the face. | **P1 control defect**; P3 |
| H5: one person needs to stop mid-turn at high heat | Pause the exchange and resume deliberately | The timer is a cue and the player can pass, but there is no explicit pause/resume state. Passing restarts the other person's turn clock and keeps play moving. | **P2 product gap**; P4 |
| H3: a person feels accurately heard about a shortage yet the shortage still prevents the desired plan | Distinguish recognition from a workable resolution | Release offers **Resolve part of the issue** and moves the private meter down with no prompt to identify the actual change, remaining constraint, or next step. This is a valid subjective choice but weak evidence of issue progress. | **Product effectiveness risk**; P7–P8 |
| H8: one player has already reached personal resolution | Their focus can move to the other player | The board marks them **RESOLVED**, but still allows them to place and speak chips; it does not cue a listener role or ask what remains for the other person. | **P2 orientation gap**; P8 |
| H4: the heat gauge is 5 and the conversation becomes worse | Signal that the limit has been reached and pause | `signalHotter()` is disabled at 5. The gauge caps correctly, but there is no equivalent “too hot to continue” signal. | **P2 product gap**; P4 |

These are predictions from the code and rules. Validate the P1 paths in a browser, then with two people, before treating them as closed findings. The H9 deadlock requires both 25-chip hands to be exhausted; an ordinary one-player shortage remains recoverable by donation.

## Run protocol

1. Use fictional identities and a short written conflict card. Give each player a private motive, opening meter, and a condition under which they would genuinely feel heard. Do not script the exact chip sequence.
2. Ask each to narrate only what they would naturally say aloud. The facilitator records moves and confusion but gives no rule help for the first 90 seconds. After that, log every prompt as assistance.
3. After every move, record the active turn, both hand counts, all five stack depths, face/spoken/heard states, public heat, private meter changes **without revealing either meter to the other player**, and the player's stated reason for the move.
4. Stop after personal resolution, voluntary pause, a rule deadlock, or 20 turns. Ask each player separately: “What did you learn?”, “What remains unresolved?”, “Did you feel pressed to mark a chip heard?”, and “What would you do next off the board?”
5. For each defect, log the **first** moment it appeared, not only the final outcome. Re-run only the shortest path needed to reproduce it.

Use this single-line event format: `case / build / turn / journey step / action / expected state / observed state / player quote / C,E,R,U,I,A / defect class / severity`. Keep private conflict content out of analytics or shared bug trackers; use fictional paraphrases. For human sessions, obtain consent to observe and stop immediately if either person wants to stop.

**Severity:** P0 = privacy exposure, unsafe pressure, or board cannot continue or leave; P1 = an incorrect rule, chip loss, control ownership failure, or false completion; P2 = discoverability, pacing, or comprehension friction; P3 = polish. Mark an effectiveness failure even when the code behaves as designed.

## Next test sequence

1. Reproduce H9 and H10 in the preview browser; fix their control paths and retest chip counts and owner choice.
2. Run six synthetic, unscripted scenario passes: H1, H3, H5, H7, H8, H11. Use shallow and layered versions of the standard conflict cards. Record the first owner-confirmed core-issue hypothesis, disclosures to reach it, and the next action or remaining constraint. Update the matrix scores.
3. Run at least two two-person sessions using fictional conflicts, including H2 and H6, on an iPhone-size board. Ask participants to explain the game back without coaching, independently name the core issue, and say whether the other person got it right. Human observations belong in a separate dated log and must not be conflated with simulations.
4. Revisit the matrix by player journey phase and game state. Prioritize defects that recur across scenarios over one-off wording issues.
