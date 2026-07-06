# Generic Tool Taxonomy for Emotional Alchemy

> **Status**: Canonical tool layer for the Practice Atlas (`docs/MTGOA_PRACTICE_ATLAS.md`).
> The Atlas consumes this taxonomy; when the two disagree on a tool's ratings, protocol, or name, **this document wins** and the Atlas must be updated.

## Purpose

This taxonomy separates four layers that were getting tangled:

- **Move**: the emotional transformation needed.
- **Submove**: the WAVE phase used to perform the move: Wake Up, Open Up, Clean Up, Grow Up, Show Up.
- **Tool**: the method used to perform the submove.
- **Playable recommendation**: emotional vector + move role + submove + tool + satisfaction spirit + blocker/story/domain/superpower context.

The design target is: a tool without a move is inert, and a move without a tool is too abstract. The game should recommend composed reps that players can actually do and log.

## Source Notes

Local sources inspected:

- `docs/FELT_SENSE_321_PRAXIS.md`: BARS maps 321 to felt-sense practice; cites Gendlin/Focusing and positions 321 as a trainable non-clinical skill.
- `.specify/books/book-integral-life-practice.txt`: local extracted table of contents includes the 3-2-1 Shadow Process, 1-minute shadow process, emotional transmutation, and 3-body workout.
- `src/lib/emotional-first-aid.ts`: existing Emotional First Aid tools: Grounding Sequence, Boundary Shield, Command Bridge, Self-Sabotage Belief Audit, WAVE placeholder, 321.
- `src/app/wiki/emotional-first-aid-guide/page.tsx`: player-facing 321 explanation and BAR/quest bridge.
- `.specify/specs/321-shadow-process/spec.md`: 321 produces optional BAR metadata and quest bridge.
- `.specify/specs/inquiry-lite/spec.md`: belief inquiry flow with stuckness, emotional vector, turnaround, BAR seed.
- `.specify/specs/golden-path-cleanup-bar/spec.md`: EFA/321 should produce BAR drafts and next actions.
- `src/lib/valkyrie-party/data/quest-cards.json`: existing Happy Apples, Grounding Cord, Rose Tool, WAVE Check, 3-2-1 Mini, Basic Qi Gong Reset, Breath Reset.
- `docs/bars-book/05-integral/five-move-metabolism.md`: Open Up, Wake Up, Clean Up, Grow Up, Show Up as charge metabolism phases.

External lineages are named as **general lineage** unless explicitly supported by local source notes. This document intentionally avoids copying proprietary protocols and translates mechanics into BARS language.

## Rating Key

- **Strong**: native protocol for this submove.
- **Medium**: can be adapted with extra framing.
- **Weak**: can support reflection but not complete the submove.
- **Not recommended**: likely confuses or bypasses the submove.

## Tools

### T01. Structured Part Dialogue

1. **Generic name**: Structured Part Dialogue
2. **BARS translation**: 321 Charge Dialogue
3. **Source lineage / inspiration**: Integral Life Practice 3-2-1 Shadow Process, BARS 321, general lineage: parts work and perspective-taking.
4. **Core mechanic**: Move from observing a charged figure/part, to relating with it, to owning the clean portion of its energy.
5. **WAVE ratings**: Wake Up strong; Open Up medium; Clean Up strong; Grow Up strong; Show Up medium.
6. **Move roles**: metabolize strong; translate strong; transcend medium.
7. **Best channels**: anger, fear, sadness; also useful for neutrality when a hidden part is present.
8. **Weak channels / misuse**: weak for simple joy cultivation; misuse is over-identifying with a part or making external claims from internal dialogue.
9. **Protocol**:
   - Name the charge in third person: "There is a part/figure that..."
   - Give it a short name, image, or role.
   - Address it directly: "You are here because..."
   - Ask it: "What are you protecting, wanting, or refusing?"
   - Speak as it for 3-5 sentences beginning "I am..."
   - Write one owned sentence: "The clean energy I can reclaim is..."
   - Choose one next expression or internal commitment.
10. **Timebox**: 7-15 minutes; mini version 3 minutes.
11. **Expected output**: part name, part quote, owned energy sentence, optional quest seed.
12. **BAR reflection**: "I met the part called ___. It was trying to ___. The clean energy I can reclaim is ___."
13. **Completion criteria**: player can distinguish the part's signal from the old reaction.
14. **When not to use**: if the player is too activated to keep perspective; use grounding first.
15. **Prefer another tool when**: belief is already explicit, use Belief Inquiry; body signal is vague, use Felt-Sense Handle; a concrete boundary is needed now, use Clean Ask/Boundary Script.
16. **Example recommendation**: frustration to triumph + Clean Up + 321 Charge Dialogue + triumph spirit: "Face the frustrated part, talk to its desire, then own one clean force sentence before taking action."
17. **Show Up examples**: External: send one clean ask from the reclaimed energy. Internal: write a one-line vow about how this part will be honored without running the system.
18. **Satisfaction spirit changes**: peace slows the dialogue until the part can stop fighting; triumph asks what power wants clean expression; poignance asks what care is underneath; bliss asks what aliveness wants to circulate; wonder asks what new possibility this part reveals.

### T02. Felt-Sense Tracking

1. **Generic name**: Felt-Sense Tracking
2. **BARS translation**: Find the Felt Thread
3. **Source lineage / inspiration**: Local felt-sense praxis from Gendlin/Focusing; general lineage: Focusing.
4. **Core mechanic**: Let an unclear bodily whole form, test handles against the body, and record the phrase/image that creates a felt shift.
5. **WAVE ratings**: Wake Up strong; Open Up strong; Clean Up strong; Grow Up medium; Show Up weak.
6. **Move roles**: metabolize strong; translate medium; transcend strong for sadness/fear/neutrality.
7. **Best channels**: sadness, fear, neutrality; useful for anger when it has somatic heat.
8. **Weak channels / misuse**: weak for urgent external action; misuse is forcing an answer too quickly.
9. **Protocol**:
   - Pause for 20-30 seconds before writing.
   - Locate where the charge lives in the body.
   - Describe its size, texture, temperature, motion, or image.
   - Try three possible handles: word, phrase, image.
   - Check each handle against the body: more open, tighter, neutral, or not it.
   - Keep the best-fitting handle.
   - Write: "What this whole thing feels like is ___."
10. **Timebox**: 3-8 minutes.
11. **Expected output**: body location, felt handle, fit signal, one sentence.
12. **BAR reflection**: "The felt sense was in ___. The handle that fit was ___. After checking, the shift was ___."
13. **Completion criteria**: a felt handle emerges or the player names that no handle has formed yet.
14. **When not to use**: when a player needs immediate safety, logistics, or social repair.
15. **Prefer another tool when**: the blocker is a belief, use Belief Inquiry; there are conflicting internal voices, use Part Dialogue; the next action is already clear, use Command Bridge.
16. **Example recommendation**: fear to wonder + Wake Up + Find the Felt Thread + wonder spirit: "Locate the edge in the body and find the handle that lets the unknown become inspectable."
17. **Show Up examples**: External: after the handle forms, ask one curiosity question. Internal: save the handle as a BAR seed for a later quest.
18. **Satisfaction spirit changes**: peace looks for the handle that settles; triumph looks for the handle that restores clean agency; poignance looks for the ache of care; bliss looks for the felt opening; wonder looks for the image that makes the unknown interesting.

### T03. Reflective Capture

1. **Generic name**: Reflective Capture
2. **BARS translation**: BAR Capture
3. **Source lineage / inspiration**: general lineage: journaling; BARS BAR seed and reflection flows.
4. **Core mechanic**: Convert internal material into a durable inspectable artifact.
5. **WAVE ratings**: Wake Up strong; Open Up medium; Clean Up medium; Grow Up strong; Show Up medium.
6. **Move roles**: metabolize medium; translate medium; transcend medium.
7. **Best channels**: all channels; especially neutrality and sadness.
8. **Weak channels / misuse**: weak for high activation; misuse is writing around the move instead of producing a concrete output.
9. **Protocol**:
   - Write the current charge in one sentence.
   - Write the desired satisfaction in one sentence.
   - Write the blocker/story in one sentence.
   - Complete: "The emotional move I am practicing is..."
   - Complete: "The cleanest next artifact is..."
   - Create the artifact: sentence, ask, boundary, map, message draft, or quest seed.
10. **Timebox**: 5-10 minutes; 90-second quick capture.
11. **Expected output**: BAR seed, reflection, named blocker, next artifact.
12. **BAR reflection**: the tool output is already BAR-shaped.
13. **Completion criteria**: the reflection contains current charge, desired satisfaction, blocker/story, and one next artifact.
14. **When not to use**: when writing becomes rumination or self-attack.
15. **Prefer another tool when**: the body is offline, use Grounding; belief needs testing, use Belief Inquiry; external communication is needed, use Clean Ask.
16. **Example recommendation**: restlessness to peace + Grow Up + BAR Capture + peace spirit: "Write the restless signal, the peaceful target, and the smallest structure that would let the system rest."
17. **Show Up examples**: External: turn the BAR into a quest or message. Internal: commit to the sentence as a 24-hour practice.
18. **Satisfaction spirit changes**: peace reduces to one true sentence; triumph names earned agency; poignance records care and distance; bliss records aliveness and sharing; wonder records a live question.

### T04. Belief Inquiry

1. **Generic name**: Belief Inquiry
2. **BARS translation**: Story Turnaround
3. **Source lineage / inspiration**: local Inquiry Lite spec; general lineage: contemplative inquiry and Byron Katie-style question/turnaround practice.
4. **Core mechanic**: Identify the story driving stuckness, test its certainty, observe its cost, and generate a truer replacement.
5. **WAVE ratings**: Wake Up medium; Open Up weak; Clean Up strong; Grow Up strong; Show Up medium.
6. **Move roles**: metabolize strong; translate medium; transcend medium.
7. **Best channels**: fear, anger, sadness; useful for neutrality when over-control is a story.
8. **Weak channels / misuse**: weak for pure bodily overwhelm; misuse is using inquiry to argue the player out of legitimate desire, threat, or grief.
9. **Protocol**:
   - Write the blocker story as a sentence: "I cannot ___ because ___."
   - Ask: "Is this completely true right now?"
   - Write what happens when you believe it: body, action, emotion.
   - Write who you would be for 10 minutes without this thought.
   - Write three turnarounds or cleaner versions.
   - Choose one replacement that is testable today.
   - Define one tiny experiment or internal commitment.
10. **Timebox**: 8-15 minutes.
11. **Expected output**: belief, cost, turnarounds, replacement belief, experiment.
12. **BAR reflection**: "The story was ___. When I believed it, I ___. The replacement I will test is ___."
13. **Completion criteria**: a testable replacement exists without denying the original signal.
14. **When not to use**: when the problem is practical ignorance, external danger, or active overwhelm.
15. **Prefer another tool when**: a part needs to speak, use 321; no story is visible yet, use Felt-Sense Tracking; a direct action is available, use Command Bridge.
16. **Example recommendation**: fear to peace + Clean Up + Story Turnaround + peace spirit: "Find the fear-story, test its certainty, and write the replacement that lets the system settle without pretending risk is gone."
17. **Show Up examples**: External: run a 10-minute experiment that tests the replacement. Internal: adopt a 24-hour replacement belief and log what changes.
18. **Satisfaction spirit changes**: peace seeks a non-urgent truth; triumph seeks an agency-restoring truth; poignance protects care from false stories; bliss asks what permission the story blocks; wonder turns certainty into inquiry.

### T05. Field Mapping

1. **Generic name**: Field Mapping
2. **BARS translation**: Put It On The Board
3. **Source lineage / inspiration**: general lineage: systems mapping, stakeholder mapping, cognitive offloading; BARS domains and quest grammar.
4. **Core mechanic**: Externalize the situation as objects and relations so the player can see where work belongs.
5. **WAVE ratings**: Wake Up strong; Open Up medium; Clean Up medium; Grow Up strong; Show Up medium.
6. **Move roles**: metabolize medium; translate strong; transcend weak.
7. **Best channels**: anger, fear, neutrality.
8. **Weak channels / misuse**: weak for sadness if it bypasses feeling; misuse is mapping as avoidance.
9. **Protocol**:
   - Draw four boxes: me, blocker, desired satisfaction, field.
   - Put every known fact in the field box.
   - Put every interpretation/story in the blocker box.
   - Mark each item as fact, story, need, resource, threat, or desire.
   - Circle the one place where a move is possible now.
   - Write the move as a sentence.
10. **Timebox**: 10-20 minutes; fast version 5 minutes.
11. **Expected output**: map, classified blocker, next move location.
12. **BAR reflection**: attach or summarize the map: "The work belongs at ___. The blocker is mostly fact/story/need/resource/threat/desire."
13. **Completion criteria**: the player can name where the next move belongs.
14. **When not to use**: when the player is using analysis to avoid feeling or action.
15. **Prefer another tool when**: the charge is bodily/vague, use Felt-Sense Tracking; the next move is a message, use Clean Ask; grief needs flow, use Surrender/Ritual Container.
16. **Example recommendation**: clean anger to clean sadness + Translate + Put It On The Board + poignance spirit: "Map desire, care, distance, and resources until anger can see what it cares about."
17. **Show Up examples**: External: make one ask to the resource marked on the map. Internal: choose the one field edge to hold for the day.
18. **Satisfaction spirit changes**: peace maps enough to reduce noise; triumph maps leverage; poignance maps care and distance; bliss maps aliveness and invitations; wonder maps unknowns as doors.

### T06. Clean Ask / Boundary Script

1. **Generic name**: Clean Ask / Boundary Script
2. **BARS translation**: Clean Line
3. **Source lineage / inspiration**: existing Boundary Shield and Rose Tool; general lineage: consent-forward communication and boundary scripting.
4. **Core mechanic**: Turn charge into a short ask, no, offer, or limit that can be spoken or held.
5. **WAVE ratings**: Wake Up medium; Open Up weak; Clean Up medium; Grow Up strong; Show Up strong.
6. **Move roles**: metabolize weak; translate medium; transcend medium.
7. **Best channels**: anger, fear, neutrality.
8. **Weak channels / misuse**: weak for early sadness; misuse is premature confrontation before the signal is clean.
9. **Protocol**:
   - Name the relationship or field where the line belongs.
   - Choose script type: ask, no, offer, limit, repair.
   - Fill the template: "I want/need ___. I can ___. I cannot ___. Would you be willing to ___?"
   - Remove blame and over-explaining.
   - Read it aloud once.
   - Choose delivery: send, save, practice, or convert into internal line.
10. **Timebox**: 5-12 minutes.
11. **Expected output**: message draft, boundary sentence, ask, offer, or repair line.
12. **BAR reflection**: "The clean line was ___. I sent/held/practiced it. The outcome was ___."
13. **Completion criteria**: the line is short, true, and actionable or holdable.
14. **When not to use**: when the player is still trying to punish, recruit guilt, or control an outcome.
15. **Prefer another tool when**: the desire is unclear, use Felt-Sense Tracking; the belief is tangled, use Belief Inquiry; the part is exiled, use 321.
16. **Example recommendation**: anger to triumph + Show Up + Clean Line + triumph spirit: "Turn clean desire into one brave ask that does not leak attack."
17. **Show Up examples**: External: send the ask or boundary. Internal: write the boundary as a rule you will honor for 24 hours.
18. **Satisfaction spirit changes**: peace softens the line without deleting it; triumph makes the line direct; poignance includes care and grief; bliss makes the offer generous but bounded; wonder asks a question instead of closing the field.

### T07. Regulation Reset

1. **Generic name**: Regulation Reset
2. **BARS translation**: Return to the Body
3. **Source lineage / inspiration**: existing Grounding Sequence, Grounding Cord, Breath Reset, Basic Qi Gong Reset; general lineage: breathwork, orienting, grounding, simple movement.
4. **Core mechanic**: Change state enough that the player can sense, choose, or complete a next move.
5. **WAVE ratings**: Wake Up medium; Open Up strong; Clean Up medium; Grow Up medium; Show Up weak.
6. **Move roles**: metabolize medium; translate weak; transcend weak.
7. **Best channels**: fear, anger, neutrality; useful for numbness and overwhelm.
8. **Weak channels / misuse**: weak as a complete sadness move; misuse is calming down to avoid truth.
9. **Protocol**:
   - Rate activation 0-10.
   - Choose one reset: 4 rounds longer exhale, 5-4-3 orienting, feet/seat scan, 8 slow movement rounds.
   - Do the reset without multitasking.
   - Rate activation again.
   - Write the first available next signal: body, emotion, thought, or action.
10. **Timebox**: 1-5 minutes.
11. **Expected output**: before/after rating, reset mode, next signal.
12. **BAR reflection**: "Before reset I was __/10. After reset I was __/10. The next signal was ___."
13. **Completion criteria**: activation changes or the player identifies that stronger support/rest is needed.
14. **When not to use**: when it becomes a bypass of needed anger, grief, or action.
15. **Prefer another tool when**: there is a clear belief, use Story Turnaround; grief needs expression, use Surrender/Ritual Container; action is ready, use Command Bridge.
16. **Example recommendation**: fear to peace + Open Up + Return to the Body + peace spirit: "Regulate until the body can receive safety cues and name the next true signal."
17. **Show Up examples**: External: rejoin the task after the reset and do one small action. Internal: commit to pausing before replying.
18. **Satisfaction spirit changes**: peace emphasizes downshift; triumph emphasizes steady force; poignance makes room for softening; bliss notices pleasant sensation; wonder orients to new sensory details.

### T08. Command Bridge

1. **Generic name**: Command Bridge
2. **BARS translation**: One True Next Move
3. **Source lineage / inspiration**: existing Emotional First Aid Command Bridge; general lineage: executive function scaffolding and next-action practice.
4. **Core mechanic**: Convert fuzzy charge into a mission sentence and one action under ten minutes.
5. **WAVE ratings**: Wake Up medium; Open Up weak; Clean Up weak; Grow Up medium; Show Up strong.
6. **Move roles**: metabolize weak; translate medium; transcend medium.
7. **Best channels**: neutrality, anger, fear.
8. **Weak channels / misuse**: weak for early sadness and open-ended joy; misuse is forcing action before metabolization.
9. **Protocol**:
   - Complete: "For the next hour, my mission is ___."
   - List three possible actions under ten minutes.
   - Cross out any action that depends on another person responding first.
   - Choose the smallest action that visibly advances the mission.
   - Do it or schedule it.
   - Log what changed.
10. **Timebox**: 3 minutes to choose; 10 minutes to execute.
11. **Expected output**: mission sentence, next action, completion note.
12. **BAR reflection**: "My mission was ___. The one true next move was ___. I completed/scheduled it and learned ___."
13. **Completion criteria**: an action is done, scheduled, delegated, or explicitly declined.
14. **When not to use**: when the next move would be impulsive, performative, or avoidant.
15. **Prefer another tool when**: the charge is unidentified, use Felt-Sense Tracking; the blocker is a belief, use Story Turnaround; the action is interpersonal, use Clean Line.
16. **Example recommendation**: neutrality to bliss + Show Up + One True Next Move + bliss spirit: "Find the live part and make one small invitation that lets aliveness circulate."
17. **Show Up examples**: External: send the invite, draft the post, open the doc, make the call. Internal: define the next-hour mission and refuse all other missions.
18. **Satisfaction spirit changes**: peace chooses the simplifying action; triumph chooses the leverage action; poignance chooses the care-honoring action; bliss chooses the energizing action; wonder chooses the experiment.

### T09. Appreciation / Resource Scan

1. **Generic name**: Appreciation / Resource Scan
2. **BARS translation**: Happy Apples
3. **Source lineage / inspiration**: existing Happy Apples quest card; general lineage: gratitude, savoring, resource orientation.
4. **Core mechanic**: Identify small real goods without forcing a silver lining, then let one become shareable or usable.
5. **WAVE ratings**: Wake Up medium; Open Up strong; Clean Up weak; Grow Up medium; Show Up medium.
6. **Move roles**: metabolize weak; translate medium; transcend strong for joy.
7. **Best channels**: joy, neutrality, fear.
8. **Weak channels / misuse**: weak for raw sadness if it denies loss; misuse is premature positivity.
9. **Protocol**:
   - Name the current charge honestly.
   - Find three tiny things that are genuinely good right now.
   - For each, write why it is real, not why it fixes everything.
   - Choose one apple to receive for 30 seconds.
   - Choose whether to share it, use it, or simply log it.
10. **Timebox**: 2-5 minutes.
11. **Expected output**: three apples, one received apple, optional share/action.
12. **BAR reflection**: "The three apples were ___. The one I could receive was ___. It changed ___."
13. **Completion criteria**: one specific good is felt or honestly marked as unavailable.
14. **When not to use**: when the player needs grief, anger, or boundary before appreciation can be true.
15. **Prefer another tool when**: care/distance is primary, use Surrender/Ritual Container; fear needs risk mapping, use Field Mapping; belief is sabotaging joy, use Story Turnaround.
16. **Example recommendation**: boredom to wonder + Open Up + Happy Apples + wonder spirit: "Find three real sparks, then choose the one that opens a question."
17. **Show Up examples**: External: share one apple with someone. Internal: write a permission slip to let the good thing count.
18. **Satisfaction spirit changes**: peace receives enoughness; triumph celebrates earned progress; poignance notices the tenderness inside joy; bliss amplifies pleasure; wonder asks what else could be alive here.

### T10. Ritual Container

1. **Generic name**: Ritual Container
2. **BARS translation**: Make It Real
3. **Source lineage / inspiration**: existing quest/party ritual patterns; general lineage: symbolic action, release ritual, integration ritual.
4. **Core mechanic**: Give an emotional shift a concrete symbolic action, boundary, or artifact so the body and field can register it.
5. **WAVE ratings**: Wake Up weak; Open Up strong; Clean Up medium; Grow Up medium; Show Up strong.
6. **Move roles**: metabolize medium; translate medium; transcend strong.
7. **Best channels**: sadness, joy, neutrality.
8. **Weak channels / misuse**: weak for urgent fear or anger logistics; misuse is performance without contact.
9. **Protocol**:
   - Name what is being released, honored, received, or begun.
   - Choose a small physical symbol: note, stone, candle, water, song, gesture, object placement.
   - Speak or write one sentence of meaning.
   - Perform the symbolic action for 1-3 minutes.
   - Record what changed in body, emotion, or intention.
   - Choose whether this becomes a quest seed, private BAR, or no further action.
10. **Timebox**: 5-15 minutes.
11. **Expected output**: ritual sentence, symbolic action, reflection, optional quest seed.
12. **BAR reflection**: "The ritual honored/released/began ___. I used ___. Afterward, ___."
13. **Completion criteria**: a symbolic action is completed and its effect is logged.
14. **When not to use**: when practical action, consent, or safety is required first.
15. **Prefer another tool when**: a belief needs testing, use Story Turnaround; a message needs sending, use Clean Line; the charge is unclear, use Felt-Sense Tracking.
16. **Example recommendation**: sadness to poignance + Transcend + Make It Real + poignance spirit: "Create a small ritual that restores flow between you and what you care about."
17. **Show Up examples**: External: create or share a care artifact. Internal: make a private vow or release ritual and log it.
18. **Satisfaction spirit changes**: peace completes and settles; triumph marks earned passage; poignance honors care and distance; bliss celebrates embodied aliveness; wonder opens a threshold.

### T11. Game Reframe (v1.1 addendum)

> Added to canonize the previously orphaned "Make It A Game" (Practice Atlas gap G6). Ratings follow the same key.

1. **Generic name**: Game Reframe
2. **BARS translation**: Make It A Game
3. **Source lineage / inspiration**: existing MTGOA play usage; general lineage: gamification, deliberate-practice design.
4. **Core mechanic**: Recast a blocker or practice edge as a designed game: win condition, reps, score, playtest partner.
5. **WAVE ratings**: Wake Up weak; Open Up medium; Clean Up weak; Grow Up strong; Show Up medium.
6. **Move roles**: metabolize weak; translate medium; transcend strong for joy and fear practice edges.
7. **Best channels**: joy, fear (practice edges), neutrality (dreary recurring tasks).
8. **Weak channels / misuse**: never gamify grief; never gamify real physical risk; misuse is designing the game forever instead of playing round one.
9. **Protocol**:
   - Name the edge or task being reframed.
   - Define a win condition that rewards recovery, not perfection.
   - Define one rep of 15 minutes or less.
   - Choose a score unit (Happy Apples allowed).
   - Schedule rep 1 — play it or put it on the calendar with a date.
10. **Timebox**: 15 minutes design; rep 1 is 15 minutes or less.
11. **Expected output**: game card (name, rule, win condition, score unit, rep 1 date) + rep 1 log.
12. **BAR reflection**: "The game is ___. The win is ___. Rep 1 happened on ___; the score was ___."
13. **Completion criteria**: rep 1 is played or scheduled with a date.
14. **When not to use**: grief; physical-risk assessment; when play would mock stakes that are real for someone else involved.
15. **Prefer another tool when**: the risk is real, use Put It On The Board; the charge is unmetabolized anger/sadness at 5+, use 321 or Felt Thread first.
16. **Example recommendation**: fear to wonder + Grow Up + Make It A Game + wonder spirit: "Design the rep where recovering from a mistake is the win condition."
17. **Show Up examples**: External: play rep 1 with a recruited partner. Internal: play one solo round tonight and log the score.
18. **Satisfaction spirit changes**: peace designs the simplifying game; triumph designs the leverage rep; poignance is contraindicated (do not gamify grief); bliss maximizes play; wonder designs the experiment rep.

## Compact Matrix 1: Tool x WAVE Submove

| Tool | Wake Up | Open Up | Clean Up | Grow Up | Show Up |
|---|---|---|---|---|---|
| 321 Charge Dialogue | strong | medium | strong | strong | medium |
| Find the Felt Thread | strong | strong | strong | medium | weak |
| BAR Capture | strong | medium | medium | strong | medium |
| Story Turnaround | medium | weak | strong | strong | medium |
| Put It On The Board | strong | medium | medium | strong | medium |
| Clean Line | medium | weak | medium | strong | strong |
| Return to the Body | medium | strong | medium | medium | weak |
| One True Next Move | medium | weak | weak | medium | strong |
| Happy Apples | medium | strong | weak | medium | medium |
| Make It Real | weak | strong | medium | medium | strong |
| Make It A Game | weak | medium | weak | strong | medium |

## Compact Matrix 2: Tool x Move Role

| Tool | Metabolize | Translate | Transcend |
|---|---|---|---|
| 321 Charge Dialogue | strong | strong | medium |
| Find the Felt Thread | strong | medium | strong |
| BAR Capture | medium | medium | medium |
| Story Turnaround | strong | medium | medium |
| Put It On The Board | medium | strong | weak |
| Clean Line | weak | medium | medium |
| Return to the Body | medium | weak | weak |
| One True Next Move | weak | medium | medium |
| Happy Apples | weak | medium | strong |
| Make It Real | medium | medium | strong |
| Make It A Game | weak | medium | strong |

## Compact Matrix 3: Tool x Emotional Channel

| Tool | Anger | Sadness | Fear | Joy | Neutrality |
|---|---|---|---|---|---|
| 321 Charge Dialogue | strong | strong | strong | medium | medium |
| Find the Felt Thread | medium | strong | strong | medium | strong |
| BAR Capture | medium | strong | medium | medium | strong |
| Story Turnaround | strong | medium | strong | weak | medium |
| Put It On The Board | strong | weak | strong | weak | strong |
| Clean Line | strong | weak | strong | weak | strong |
| Return to the Body | strong | weak | strong | weak | strong |
| One True Next Move | strong | weak | medium | medium | strong |
| Happy Apples | weak | weak | medium | strong | strong |
| Make It Real | medium | strong | weak | strong | medium |
| Make It A Game | weak | not recommended | medium | strong | medium |

## Compact Matrix 4: Tool x BAR-Loggable Output

| Tool | Primary BAR Output |
|---|---|
| 321 Charge Dialogue | part name + reclaimed energy sentence + quest seed |
| Find the Felt Thread | body location + felt handle + shift sentence |
| BAR Capture | BAR seed/reflection + named blocker + next artifact |
| Story Turnaround | belief + cost + replacement belief + experiment |
| Put It On The Board | field map + classified blocker + work location |
| Clean Line | ask/boundary/offer/repair script + outcome |
| Return to the Body | before/after activation + reset mode + next signal |
| One True Next Move | mission sentence + chosen action + completion note |
| Happy Apples | three apples + received apple + share/log choice |
| Make It Real | ritual sentence + symbolic action + integration note |
| Make It A Game | game card (name, rule, win, score, rep 1 date) + rep 1 log |

## MVP Tool Shortlist

1. **321 Charge Dialogue**: best first implementation because it already exists in BARS, covers multiple submoves, produces BAR-shaped output, and can metabolize/translate across many channels.
2. **Find the Felt Thread**: needed because emotional vector quality depends on players sensing charge rather than only selecting labels.
3. **BAR Capture**: lowest-friction logging wrapper for every tool.
4. **Story Turnaround**: handles self-sabotage beliefs, which are a primary blocker category.
5. **One True Next Move**: turns completed metabolization into Show Up without creating a full quest surface.

The smallest playable bundle is: 321 Charge Dialogue + BAR Capture + One True Next Move. The strongest emotionally accurate bundle is: 321 Charge Dialogue + Find the Felt Thread + Story Turnaround + BAR Capture.

## Mapping Generic Tools to Existing Named Tools

| Generic Tool | BARS Translation | Existing Named Tool Mapping |
|---|---|---|
| Structured Part Dialogue | 321 Charge Dialogue | 321, 3-2-1 Mini |
| Felt-Sense Tracking | Find the Felt Thread | Focusing, 321 felt-sense scaffolding |
| Reflective Capture | BAR Capture | Journaling, BAR reflection, charge capture |
| Belief Inquiry | Story Turnaround | Inquiry Lite, Self-Sabotage Belief Audit |
| Field Mapping | Put It On The Board | no clean named tool yet; related to quest grammar and blocker mapping |
| Clean Ask / Boundary Script | Clean Line | Boundary Shield, Rose Tool, Partner Stretch Offer pattern |
| Regulation Reset | Return to the Body | Grounding Sequence, Grounding Cord, Breath Reset, Basic Qi Gong Reset |
| Command Bridge | One True Next Move | Command Bridge, Golden Path Cleanup next action |
| Appreciation / Resource Scan | Happy Apples | Happy Apples |
| Ritual Container | Make It Real | existing ritual/party quest patterns; no generic named tool yet |

## Gaps BARS Should Invent or Adapt

1. **A generic tool registry**: tools need capabilities, not just names. Store WAVE ratings, role support, channel support, outputs, and contraindications.
2. **A protocol composer**: recommendation payloads need to insert vector mechanic + submove lens + tool protocol + satisfaction spirit.
3. **A field/domain mapping tool**: current system has domains, but not a concrete "put the blocker on the board" protocol.
4. **A sadness-native flow tool**: Ritual Container is the closest, but sadness needs strong restoring-flow mechanics for care/distance without becoming confrontation.
5. **A Show Up bridge for internal commitments**: action is not always external. The output schema must support internal commitment artifacts.
6. **Tool completion schemas**: each tool should declare what inspectable output proves completion.

## Recommended First Implementation

Implement **321 Charge Dialogue** first as a typed tool in the recommendation payload.

Why:

- It is already supported by local product surfaces and specs.
- It can perform Wake Up, Clean Up, Grow Up, and medium-strength Show Up.
- It produces BAR-ready output.
- It can accept vector-family mechanic operations without pretending the mechanic itself is a protocol.
- It gives the system a concrete place to test the formula: vector edge + submove + tool + satisfaction spirit + blocker/story context.

First implementation target:

```ts
type EmotionalAlchemyTool = {
  id: string
  genericName: string
  barsName: string
  waveRatings: Record<WaveLens, ToolRating>
  moveRoleRatings: Record<MoveRole, ToolRating>
  channelRatings: Record<EmotionChannel, ToolRating>
  outputKind: ToolOutputKind
  protocolTemplate: ToolProtocolTemplate
  completionCriteria: string[]
  whenNotToUse: string[]
}
```

## Top 5 Research Questions

1. Which tool outputs should become first-class `MoveAttempt` fields versus freeform BAR metadata?
2. How much protocol text should be authored per tool versus composed from vector mechanic + satisfaction spirit?
3. What is the minimum player input needed to choose between 321, Focusing, Inquiry, and Command Bridge without asking too many diagnostic questions?
4. How should internal Show Up artifacts be tracked so they count as real practice without pretending they are external action?
5. Which sadness-native restoring-flow protocols need to be invented because current tools lean too cognitive, action-oriented, or regulation-oriented?
