# The Work and DBT in the Cave of Lessons: a mapping and a gap list

**Date:** 2026-10-22. **Status:** proposal. Nothing here is a ruling, and no ontology file was edited.

Paths: `C/` is six-faces-council (the ontology and the council record), `B/` is bars-engine. Both were read on branch
`claude/work-dbt-ontology-mapping-s6hfgy`. The seven directions at the top of section 3 are the owner's proposals, and this
doc tests them against the record.

## 1. What this doc does and does not do

It does three things. It summarizes what the ontology says about the six game masters, the cave, perceptual shadow and
the daemons (section 2). It maps the seven design directions onto that structure (section 3). It lists where the
directions conflict with the record or fall into a gap (section 4), and it ends with the few questions only the owner can
answer (section 5).

It does not do four things:

- It does not run a six-face council pass. The face assignments in 3.4 are one reader's use of each face's lens, which
  makes them proposals. The council's output is advisory, and a pass would test them.
- It does not read Katie's or Linehan's source texts. The four questions, the three turnarounds, the four DBT modules and
  the skill acronyms are used as the brief gives them.
- It does not replace a clinician read or a legal read. Section 4 marks where each is needed.
- It does not land board rows. Section 5 holds the questions in the board's row format, ready to land.

Words marked **(proposal)** are this doc's. Words marked **(record)** cite the repo. Where the repo already settles
something, the doc says so and the item stands as a position unless the owner flips it.

## 2. What the ontology says

### 2.1 The six game masters

The six share one archetypal lineage and live in five separate namespaces: altitude face, runtime sect, review discipline,
player-facing sect identity and council lens. A shared name does not make them one object, and choosing a face says
nothing about the player's developmental altitude (`C/ontology/v0.1/source/council-phase-a/face-namespaces/council-decision.md`,
forbidden inferences 2, 3 and 16). In this doc "game master" means the cave's player-facing use and the council lens.
Nothing here assigns a face to a player.

| Face | Altitude | Council lens (`C/council/faces.yaml`) | Cave question (`B/content/ontology-game/game.jsx`, `precisionQuestions`) | Tunnel minigame, first sketch (`B/content/ontology-game/cave/LEVELS.md`) | The Protector daemon at this altitude (`C/council/daemons/daemons.yaml`) |
|---|---|---|---|---|---|
| Shaman | magenta | What is moving underneath? What is the felt sense? | Where is the presence you're reaching for? | Presence: call in who belongs to the issue; each comes as a spirit | The Sacred Circle |
| Challenger | red | What gets wrong? What breaks? What is self-inflicted? What is the scheduling truth? | What power are you trying to move or assert? | The push: stone moves on a held push timed to the breath | The First Strike |
| Regent | amber | What must be preserved? What is an obligation rather than a preference? What ships when? | What rule or tradition is this about? | The vow: sort the rules at play onto tablets, obligation or preference | The Guard on the Gate |
| Architect | orange | What must be true in the machine? Is the binary false? Is there a third position? | What understanding or clarity are you looking for? | The mechanism: link crystals from cause to effect | The Threat Model |
| Diplomat | green | What bridges? Who is excluded? What will the community accept? | What perspectives or voices are involved? | The voices: stand in each alcove figure's place, write one line as them | The Peacekeeper |
| Sage | teal | What is the smallest coherent whole? Where do the five conflict? | How is the system trying to learn through this? | The pattern: follow the flow to where it feeds the other five | The Gardener |

The Sage synthesizes and never decides. A council pass applies a face's lens to a bounded question and returns
observations, risks and recommendations.

### 2.2 The cave

The cave is the ontology game played inside the body map (`B/content/ontology-game/cave/DESIGN.md`).

- **Home base is the WAVE room.** The player sits in a room with a door. Welcoming a sensation opens the door and a charge
  comes in as a creature. The steps are Welcome, Witness, Acknowledge, Allow, Accept, Appreciate and Validate. Then a fork
  asks what the player wants and whether the charge pushes the next move toward it or away. Up to three creatures can be
  in the room at once. Every step has Step back, and the Calm button stills the motion. The player writes every line, and
  the words stay on the page and are not saved.
- **At the fork, a charge stays or goes.** Stays runs the 3-2-1 as a chat: Face it, Talk to it (two voices, switching by
  itself), Be it, with a charge reading from 0 to 10 before and after. Goes releases the charge as a named light.
- **The hall of the six** is a hub with six doors in altitude order. Each door opens a tunnel, one per face. The hall, the
  doors and the tunnels are built, and the tunnel minigames are sketches that each need their own council pass. Every
  tunnel ends at the centre of the self, a chamber worn by the altitude the player came by, which says the issue back and
  offers the other five tunnels.
- **A block forks the path toward a skill.** LEVELS.md states the rule: "Branches are the skills downstream." A branch
  belongs to a skill, and the same skills appear in every tunnel, each dressed in that tunnel's look. The table of blocks to
  skills is: a feeling too loud (sit down, run the WAVE in place), a daemon in the way (meet it), a daemon that will not step
  aside (the 3-2-1), a charge too big for here (take it home to the room), no element (the pool and its clean up move), not
  knowing what blocks (the face's question).
- **The block side passage has five places:** sensation (texture), element (the player names one of five, runs Happy Apples
  to open up, then that element's clean up move), daemon, the six stones, and Release.
- **The five elements and their clean up moves** (`game.jsx`, `CLEAN_UP_MOVES`): Fire is anger, "Burn it away". Water is
  sadness, "Let it flow". Wood is joy, "Happy Apples". Metal is fear, "Sharpen it". Earth is neutrality, "Rest and receive",
  which the code comment calls "basic mindfulness".
- **The daemon is a wall.** Wendell's ruling of 10 October: "If a daemon pops up then it needs to be worked with. We can
  pivot to a 321 discussion with the part until it feels satisfied." The cave asks permission first ("May I speak with the
  Protector?"), and "Not now is an answer, not a skip". The daemon still holds the way, and Step back and "Rest it by the
  door" stay available.
- **Spirits.** A worked charge leaves as a spirit that walks with the player and carries a light. A council position
  (`sc-*`, 20 October, from Wendell's ruling that spirits can die or be corrupted from neglect) adds a decline ladder, a
  declared rest, and mortality disclosed when a spirit bonds (`C/council/passes/6FACE_PASS_spirit-care1_2026-10-20.md`).

### 2.3 Perceptual shadow and the daemons

Perceptual shadow (`C/council/callsheets/perceptual-shadow.md`, built in bars-engine #326) hides a charge from the player so
it cannot be worked.

- **Two signals raise it.** The first is a Witness answer, "I know it's here, but I can't feel it". The second is a round
  whose charge reading does not come down.
- **Four shadow kinds.** The record calls them kinds, because "face" belongs to the Six Faces namespace
  (`C/council/research/2026-10-17-perceptual-shadow-research-vs-ontology.md`). The player names the kind or says "I can't tell".

| Kind | What the player feels | How it hides the creature | Practice that thins it (3 a time) |
|---|---|---|---|
| Forgetting | It slips out of mind as soon as I turn to it | Fades in and out | Say its name out loud, slowly, three times |
| Distracting | Something keeps pulling my attention away | Drifts aside | Name what pulled you away, then come back |
| Dissociating | It feels far away, like it's someone else's | Stands back toward the door, greyed | Feel your feet and your seat, then look again |
| Numbness | Where it should be there is only blank | A grey fog wraps it | Find the edge of the numb: where feeling starts again |

- **Polarity** runs from -10 to 10 and is player-reported. Above 0 the charge is hidden. Below 0 it floods ("It's too much
  to be with"). Three flooding practices turn it down: a long out-breath behind the seat, name one thing in the room that
  isn't it, and picture it at arm's length. The research note reads polarity as a close match to the window of tolerance,
  held as a teaching heuristic and never a measurement.
- **Shadow spirits.** "What's in the way of it clearing?" calls up a shadow spirit that the player asks the daemons'
  questions. Each answered set counts as one practice.
- **The seven daemons and the Player** (`C/council/daemons/daemons.yaml`): Protector (keeps you alive), Controller (sets the
  standard), Skeptic (doubts), Fixer (repairs, or holds in place), Victim (sympathy through stories), Damaged Self (takes the
  damage), Emotional Body (receives the signal and makes meaning). The Player is the vulnerable child at the centre and not a
  daemon. Every daemon "protects the Player and works for the Player's enjoyment" (`DAEMON_WORKS_FOR`). Each has a question set
  (`C/council/daemons/questions.yaml`): what it works on, who it works for, how that serves its boss, what happens without it.
- **The test the research note applies:** a state should be visible, chosen and exitable. It is a test in a research note
  and not a ratified rule. The note's positions stand unless Wendell flips them.

### 2.4 Standing rules this extension has to meet

Each rule is a position or ruling already on record.

1. Mechanics claim reality: what a game tracks, rewards, gates and remembers is what it treats as real (Quickstart 5).
2. Players author personal meaning. The system may seed conditions and offer interpretations (Quickstart 10). In the cave
   the player writes every line and the daemon's figure never speaks.
3. Play precedes complete understanding (Quickstart 8).
4. Motivation serves meaning and does not prove it (Quickstart 15).
5. Intimate disclosure is not progression currency. A "pass" counts the same as a paragraph (Quickstart, "Session depth";
   research note, `agency_and_consent` item 1).
6. No-shift, uncertainty, rest and refusal are valid endings (`MovementFinding`; Quickstart, lifecycle grammar).
7. A roadblock is a scoped observation. Classification, cause, meaning, response and outcome are separate records. A
   roadblock "does not prove misaligned intention", and AI may not psychologize it (Quickstart, "Roadblocks and intention").
8. Composting is valid completion. After it, backlog pressure, overdue status and guilt or shame messaging stop
   (`design-ontology-v0.1.yaml`, `active_behaviors_that_stop`).
9. No streaks. "A streak is coercion dressed as care" (`C/council/passes/6FACE_PASS_inner-vessel1_2026-10-18.md`, line 168);
   "no clocks, streaks, daily limits or random failure" (same, line 294); "No floor to clear · no streak to keep ·
   stuckness is data, not failure" (`C/docs/morning.md`, Tap the Vein).
10. Real stakes are allowed when disclosed beforehand. Spirits can die, and the player is told when a spirit bonds (spirit-care
    pass, Regent position).
11. Do not claim the cave reduces shadow in life. It can claim that a player reported a reading change in this sitting. Child
    claims are extrapolations. No empirical figure enters player-facing text until someone has retrieved the source (research
    note, `evidence_and_unknowns`).
12. A non-AI route is first-class. AI inference is a proposal only (manifest `authority`; bars-engine CLAUDE.md).
13. A game master is a lens and never a rank (face-namespaces decision).
14. The cave says "This is a game, not therapy" and keeps a crisis line as text, always (988 in the US, findahelpline.com
    elsewhere; `B/content/ontology-game/cave/bigmind/DESIGN.md`, lines 23 to 24; `game.jsx` line 5019).
15. Words stay on the page and are not saved, a standing **(choice)**. Big Mind is the exception: its mouth keeps a list of cards
    on the device, each with Forget, and Delete everything asks twice (`C/council/callsheets/game-demo.md`).

## 3. Mapping the seven directions

### 3.1 Direction 1: externalization is the core mechanic

The cave already externalizes feelings. A charge becomes a creature with a texture, an element, a size, a brightness and a
polarity, and the player can tap it, talk to it and let it go. A thought is a different kind of object, and the cave has none.

**(proposal)** A thought is a *line*: a sentence the player writes, attached to a creature or to a daemon's voice. It is not
a new creature species. Reasons from the record:

- A stressful thought in the form "He should listen to me" is a Controller line (a standard). "She doesn't really care"
  is a Skeptic line. "It was probably me" is a Damaged Self line. "Look at what I've absorbed" is a Victim line. The
  daemons already speak in lines (`daemons.yaml`, `says`), so the cave has a place to hang a thought.
- Rule 2 holds: the player writes the line, and the system never writes it. Young players can pick from preset lines,
  because the ontology allows fictionalized or symbolic input.
- bars-engine already has a tool for this. The Emotional Alchemy registry's T04, `story-turnaround`, "Belief Inquiry", has a
  seven-step protocol that matches The Work's shape (state the story, test its certainty, name what believing it does, name who
  you would be without it, write turnarounds, choose a testable replacement, define a tiny experiment). Its lineage line already
  says "Byron Katie-style question/turnaround practice" (`B/src/lib/emotional-alchemy/registry.ts`). The tool-scout rule
  says to start from what exists, so the cave version starts from T04.

Holding and examining a line means the player can keep it, which collides with rule 15 (see C6).

### 3.2 Direction 2: The Work as a loop through the cave

| Step | The Work | Where it happens in the cave | Existing object | New |
|---|---|---|---|---|
| 0 | A feeling is present | WAVE room, Welcome through Validate | creature, W.A.V.E. steps | none |
| 1 | Capture the stressful thought | Acknowledge, or the daemon's stop | daemon's `says` line | thought line (3.1) |
| 2 | Separate what happened from the thought | Before any inquiry | none | event/thought split (3.7) |
| 3 | Q1 Is it true? Q2 Can you absolutely know it's true? | Architect tunnel (the mechanism) | Skeptic's questions; Metal's "Sharpen it" | question cards |
| 4 | Q3 How do you react when you believe it? | Witness and the 3-2-1 | texture, element, the daemon's job and stakes | none |
| 5 | Q4 Who would you be without the thought? | Sage tunnel and the centre of the self | the centre says the issue back | none |
| 6 | Turn it around: to self, to the other, to the opposite | Self: Shaman. Other: Diplomat. Opposite: Challenger | 3-2-1 Be it; Diplomat alcoves | three turnaround prompts |
| 7 | Three real examples of each turnaround | Architect (evidence) | T04 step 5 | example slots |
| 8 | Land it | Centre of the self card, one small experiment | Show Up templates in T04 | none |

Four rules for the loop, each from the record:

- **The answer to Q1 earns nothing.** The Work accepts yes or no. The game must not reward "no", because rule 4 says a drive
  must not prove meaning, and rule 1 says a reward makes the answer the point. Progress comes from doing the step.
- **"Three examples" is the practice and never a gate.** A round that ends with zero examples is a valid ending (rules 5 and 6),
  and "pass" counts the same as a full list. The research note already flags filler as the proxy-capture risk.
- **Hear the daemon before testing its line.** Daemons are protective functions, and The Work tests a thought's truth. The
  cave's own order is permission, then its place, then its questions. **(proposal)** The inquiry branch opens after the
  daemon has been heard and thanked, and it asks the daemon's permission in the same way ("May I look at what you said?").
  T04 lists its own misuse: "Using inquiry to argue the player out of legitimate desire, threat, or grief."
- **The skill is one branch and the faces are where it is taught.** Under LEVELS.md, a branch belongs to a skill and any
  block can fork to it from any tunnel. So The Work is one skill branch, built on T04. Each face's tunnel teaches the part its
  lens fits, and the fit is a proposal (3.4).

### 3.3 Direction 3: DBT as skill inventories

| Module | Skills named in the brief | Nearest thing the cave already has | Basic Move, provisional |
|---|---|---|---|
| Mindfulness | Wise Mind, observe, describe | W.A.V.E. Welcome, Witness, Acknowledge; Earth's "Rest and receive"; the centre of the self | Wake Up |
| Distress tolerance | TIPP, STOP, self-soothe | The three flooding practices (long out-breath, name one thing that isn't it, arm's length); T07 `return-to-the-body` (longer exhale, 5-4-3 orienting, feet and seat); the Calm button; Step back | Open Up |
| Emotion regulation | Check the facts, opposite action | Metal's "Sharpen it" (name the threat, say it in one sentence, notice what is real in it); the five clean up moves | Clean Up |
| Interpersonal effectiveness | DEAR MAN, GIVE, FAST | T06 `Clean Ask / Boundary Script`; the Diplomat's voices; the Between | Show Up |

Two close matches deserve a note. Metal's three steps read as a short form of "check the facts", and the existing flooding
practices already do distress tolerance's job. The brief's bridge, "check the facts" next to "Is it true?", has a home too:
Metal's clean up move and Q1 are neighbors, and Q1 asks the same thing of a thought that Metal asks of a fear.

**(proposal)** DBT skills enter as rows in LEVELS.md's block-to-skill table and as entries in a skill inventory, with the
face tunnels dressing them. The record has no DBT content today (searched: no hits for DBT, dialectical or Linehan in either repo).

Name collisions to settle before any DBT word reaches a player (rule: a source's word is cited, never renamed):

- **Wise Mind, Big Mind, Sage, centre of the self.** Wise Mind is DBT's integration of emotion mind and reasonable mind.
  Big Mind is the existing cave of seven voices. The Sage lens and the centre of the self already mean "the smallest
  coherent whole". **(proposal)** Treat Wise Mind as the centre of the self, treat emotion mind as the Emotional Body daemon and
  reasonable mind as the Architect's tunnel, and keep Big Mind's name for its cave only.
- **Validate.** The WAVE step validates the player's own charge. DBT's validation, and GIVE's V, validates another person. They
  are different acts under one word.
- **Accept** (a WAVE step) and **radical acceptance** are neighbors. Neither defines the other.
- **Control moves** in the fifteen-move grammar and **opposite action**. The ke (control) cycle may correspond to acting against
  an urge. Not checked; it needs `B/src/lib/quest-grammar/move-engine.ts`.

### 3.4 Which game master holds which skills and questions **(proposal)**

Each skill below is first taught in that face's tunnel, in that tunnel's look. Any block anywhere can still fork to the skill.

| Face | The Work | DBT | Why this face | Tunnel minigame it extends |
|---|---|---|---|---|
| Shaman | Q3 (how do you react: body, feeling); turnaround to the self | Observe, describe, participate (mindfulness) | felt sense and presence; Witness is the Shaman's step | Presence: the thought's owner is called in as a spirit |
| Architect | Q1 and Q2; three real examples; evidence | Check the facts; chain analysis (see 3.8) | testing and evidence; "Is the binary false?" is Q2's question | The mechanism: crystals link event, thought, feeling, action |
| Challenger | Turnaround to the opposite | TIPP and the body-first distress skills; opposite action; DEAR MAN | force, edge and falsification; the held push timed to the breath already is TIPP's paced breathing | The push |
| Regent | "Should" thoughts, sorted as obligation or preference; whose business it is | FAST (fair, apologies, stick to values, truthful); the commitment lifecycle in 3.8 | obligations, boundaries, definition of done | The vow |
| Diplomat | Turnaround to the other | GIVE; validating others; DEAR MAN's negotiating half | perspectives, who is excluded, bridge | The voices (the 3-2-1's Be it staging) |
| Sage | Q4; read the issue back from each face's side | Wise Mind; dialectics (both-and) | integration, "where do the five conflict" | The pattern; the centre of the self |

Limits on this table:

- It is a lens fit. A player who is strong in one tunnel has shown nothing about their altitude or worth (rule 13).
- LEVELS.md says every minigame needs its own council pass first. This table is the input to that pass.
- The Challenger and Regent rows are the least settled. Putting body-first distress skills under the red tunnel reads
  correctly for the push-timed-to-breath mechanic. A distressed child entering a "red" tunnel may need them in a calmer look,
  so the skill branch (any look) matters more than the tunnel assignment (C9).

### 3.5 Direction 4: Octalysis, white hat first

bars-engine already audits itself against the eight drives (`B/GM_GAP_ANALYSIS_RPG_ZINE_BAR_MATURITY.md`, Octalysis section). The
record treats Octalysis as a design-audit lens and never as an ontology object. This doc does the same. The ontology
(rule 4) judges engagement systems by what they do for the person.

| Drive | Hat | How it shows up in this extension | Constraint from the record |
|---|---|---|---|
| D1 Epic Meaning | white | The cave, the six game masters and the centre of the self are the story; the player is the one who walks | The project may name its ritual and may not name the player's experience (Quickstart, creative reuse) |
| D2 Development and Accomplishment | white | Capability inside a named skill line, shown as the creature or spirit changing | No badge, no level, no whole-person rank. The Marble kata precedent: "the child never wears a badge or a level" (`C/council/research/2026-10-17-marble-kata/README.md`) |
| D3 Creativity and Feedback | white | The scene changes with each choice (Wendell's loop: "See the scene change in response to choice"); turnarounds are written in the player's words | The player writes every line |
| D4 Ownership | white | A captured thought line and its creature belong to the player, and Forget and Delete are always there | Local first; sync needs its own permission grant (C6) |
| D5 Social Influence | grey | Co-care in the Between | Out of the first slice and off by default for children |
| D6 Scarcity | black | Not used | |
| D7 Unpredictability | grey | The optional I Ching cast; a surprise visitor creature | Optional, and nothing hinges on it |
| D8 Loss and Avoidance | black | Made visible and workable: a hidden charge is visible as shadow; a broken run opens a repair path; spirit decline is disclosed at bonding | Disclosed before it can happen; never a countdown or a guilt message (rules 8, 9, 10) |

### 3.6 Direction 6: validate feelings before any inquiry

The cave already orders it this way. The WAVE room reaches Validate (the creature's light steadies) before the fork. The
fork then asks what the player wants and which way the charge pushes (`wave-room-validate-first`).

**(proposal)** The inquiry branch is offered after the creature has been validated, and the player may go on without validating
("Appreciate has Not now" is the cave's pattern). Children's tier: the preset validation line comes first and is always shown.
If the tier rules in 3.7 require validation as a gate, that requirement is the tier's and the player-facing reason is stated.

### 3.7 Direction 7: the tiered harm gate

**What the gate does.** It separates *what happened* from *the thoughts formed around it*. The event is never questioned or
turned around. Only thoughts about it are inquired into, and only where the tier allows.

**Working label:** "event/thought split". The label is the council's, marked for cutting, and no term is proposed for players.

**Where it lives (proposal).**

- **Before inquiry.** The split is one screen between steps 1 and 3 of the loop (3.2). The *what happened* card is optional,
  has no required text, and accepts a picture, a preset, or nothing. It is read-only after it is made, and no step can reach it.
- **At every turnaround.** Turnarounds and Be it apply to the thought line only. The 3-2-1's Be it, the Diplomat's "stand in
  their place" and The Work's "to the other" must never be offered for a person who harmed the player in the event.
- **Between steps.** A short check reads polarity. A reading below 0 sends the player to the flooding practices (distress
  tolerance) before the next step. This is the adult tier's window-of-tolerance check-in, built from the existing reading.
- **In the fiction.** The Protector daemon is the gate's character. Hearing and thanking it is the gate's ritual, and "Not
  now" is an answer.

**Who holds it, as council lenses.** The Regent holds the rules (non-negotiables, phase gates, stop conditions). The Diplomat
holds the age translation, the accessible route and the trusted-adult path. The Shaman holds the check against diagnosing
the player. These are lenses for the design pass and give no runtime authority.

| Tier | What happened | Thoughts | Exit and pause | Support path | Record hooks |
|---|---|---|---|---|---|
| Younger kids | Never asked for in text. A "something happened that hurt or scared me" button, if any, ends the game's part and routes to a trusted adult | Creature-level work: feelings, breathing, naming. Whether to offer simple thought inquiry for everyday upsets (a friend left me out) is open (Q1) | Step back, Calm, "Not now" on every page | Trusted adult | `inner-creatures` strand (children raise creatures); Marble kata; the clinician read it lists as pending |
| Middle and high school | Event card, locked once made, never inquired | Inquiry into thoughts only; preset lines allowed | Step back, Calm, rest by the door | Trusted adult named in advance; crisis line as text | Rules 5, 6, 14 |
| Adult trauma healing | Event card or none; locked | Deeper inquiry, with polarity check-ins between steps | Always-available pause (all of the above); no step ends the sitting for the player | Crisis line as text plus a path to professional support (new) | Polarity as window of tolerance; T04 and T07 `whenNotToUse` |

**Hard stops in every tier** **(proposal)**:

- A thought that says the player is in danger now ("I'm not safe") routes to help words and a trusted person, and is never
  tested for truth. T04's own `whenNotToUse` already lists "external danger" and "active overwhelm".
- No scoring of answers, no required disclosure and no free-text reading by the system. The gate fires on the player's own
  choice, so a non-AI route holds the whole thing.
- The age tier is a deployment setting. It claims nothing about the player's altitude, capacity or worth.

### 3.8 Direction 5: streak loss as a remediation path

The record forbids streaks (rule 9) and also has a working precedent for what the direction wants. When the board's Tap the Vein
has been skipped two days running, the board opens the WAVE room with the blocker and asks what is in the way
(`B/content/ontology-game/cave/DESIGN.md`, "The board's way into the WAVE room", Wendell's `ttv-skip-wave`). That is a lapse
opening a remediation path with no count and no penalty.

**(proposal)** Build the direction as a lapse path, with these parts:

1. **A lapse is a roadblock observation** (rule 7). The game names what was missed under the declared conditions and does not
   infer a cause. Declared rest pauses it (spirit-care position `sc-rest`).
2. **Chain analysis is the cause record.** DBT's chain (vulnerabilities, prompting event, links, the behavior, consequences,
   repair) maps onto the roadblock grammar, which already keeps classification, cause, meaning, response and outcome apart. It
   is taught in the Architect's tunnel (the crystals link cause to effect). Its repair step is a Show Up move.
3. **The failure thought becomes a thought line.** "I always fail" is a Damaged Self or Controller line. The Work starts from
   there, with the tier rules of 3.7, and only if the player chooses it.
4. **The commitment bends by composting.** A broken run is a self-made commitment past its due date. The Regent's lens
   (obligation or preference) decides what happens to it: repair, renegotiate, rest or compost. Composting ends the obligation
   and stops the pressure (rule 8).
5. **No count is shown.** If the owner wants a visible run number, it must pass the research note's test: visible, chosen
   and exitable. That is a separate decision (Q2).

### 3.9 Perceptual shadow, the four kinds and the daemons inside the loop

**The four kinds show up inside the inquiry** as a reason the step stalls. The existing practices apply. The flooding pole
sends the player to distress tolerance.

| Shadow kind | How it appears during The Work | Existing practice | Nearest DBT skill |
|---|---|---|---|
| Forgetting | The thought slips away mid-question | Say its name three times; writing it as a line is the same move | Observe and describe |
| Distracting | Attention jumps to a different thought | Name what pulled you away, then come back | One-mindfully |
| Dissociating | Q3 gets answered from far away | Feet and seat, then look again | Grounding skills, TIPP |
| Numbness | "How do you react?" returns blank | Find the edge of the numb | Observe, then self-soothe |
| Flooding (pole) | The thought is too loud to examine | The three flooding practices | TIPP, STOP, self-soothe |

The test for starting Q3: if the player says "I know it's here but I can't feel it", the shadow path runs first, as it does today.

**The daemons as sources of thoughts, and as the gate.** A hypothesis (a research choice, not a finding):

| Daemon | A typical stressful line | Work question that fits | Care |
|---|---|---|---|
| Protector | "I'm not safe. Don't go in there." | None by default; the gate decides | This is the harm gate's own voice |
| Controller | "He should listen to me. Not yet." | Regent tablet, then Q1 | Standards are real; test without erasing them |
| Skeptic | "She doesn't really mean it." | Q2 | |
| Fixer | "I have to fix this." | Q3 (what believing it costs) | |
| Victim | "Look at what I've absorbed." | Q3, then the turnaround to the other | Real harm is the event, which the gate protects |
| Damaged Self | "It was probably me." | The turnaround to the opposite | Highest risk, and self-blame about an event routes to the gate; the cave's own check (continue, rest, or go back up) applies |
| Emotional Body | "This is what's actually moving." | Witness and Q3 | |
| Player | "I want this and I don't want to be careful." | Q4, then a Show Up experiment | |

## 4. Conflicts and gaps

Each row names the direction, the conflict, its source, the position that stands now, and who decides. "Record" in the last
column means the repo already settles it, and the position stands unless the owner flips it on the board.

| # | Direction | Conflict or gap | Source | Position that stands | Decides |
|---|---|---|---|---|---|
| C1 | 5 | Streaks are barred everywhere in the record; the direction names a streak | inner-vessel pass, line 168 and 294; `C/docs/morning.md`; spirit-care pass (Challenger: "never a countdown or a streak") | Lapse path with no count (3.8). A visible run number would need a ruling | Owner (Q2) |
| C2 | 7 | The research note says no children's version is in scope, and the audience is adult helpers. The `inner-creatures` strand shows children are in Wendell's plans. The tiers presuppose children | research note, `decision_or_open_authority`; `C/council/callsheets/inner-creatures.md` | Treat the note's child findings as a conservative floor. A children's tier is not a build target until the owner sets it | Owner (Q1) |
| C3 | 7 | The "four faces" name collides with the Six Faces namespace | research note, `ontology_objects`; face-namespaces decision | Say "shadow kinds" in all text | Record |
| C4 | 7 | The daemon wall has no skip (Wendell, 10 October); the direction asks for an always-available exit | `cave/DESIGN.md`, "No skip at a daemon"; research note's exitable test | A pause is not a skip: Step back, Calm and rest by the door stay on every page, and the daemon still holds the way | Record. The trauma tier's wording needs a read |
| C5 | 7 | A gate that detects harm needs input. The record reads no free text, keeps nothing, and treats AI inference as proposal only. Mandated reporting, a trusted adult and child-data law are not in the record | rules 5, 12, 15; research note (child-data law, line 149) | Fire the gate on the player's own button or choice only | Owner and counsel (Q3) |
| C6 | 1, 2 | "Hold and examine" means keeping thought lines. The cave keeps words on the page, with Big Mind as the one local-list exception | rule 15; `game-demo.md` PR 4 | Keep lines on the device by default, with Forget and Delete on each card; sync needs a permission grant (purpose, audience, duration) | Record |
| C7 | 4 | Octalysis "Accomplishment" often means points and badges. The ontology allows capability within a named line and bars whole-person rank | Quickstart 6; Marble kata README | Show accomplishment as the creature or spirit changing; no points, badge or level | Record |
| C8 | 2 | The Work tests a thought's truth. The cave treats daemons as protectors and keeps the player's meaning theirs. T04 lists its own misuse | rule 2; daemons; T04 `misuse` | Inquiry starts after the daemon is heard, with its permission; the game never marks an answer right (3.2) | Record |
| C9 | 3 | Skills belong to branches and not to faces (LEVELS.md), while the direction asks which game master holds which skill | `LEVELS.md`, "Branches are the skills downstream" | A skill branch, taught first in the face tunnel that fits; any block forks to it. The table in 3.4 is the input to each tunnel's pass | Council pass |
| C10 | 3 | DBT and The Work are named by their authors. The record's rule: a source's word is cited and never renamed. Both have owners and publishers whose terms are not in the record | `faces.yaml` (Regent term test); bars-engine registry uses the generic name "Belief Inquiry" | Use generic names with a lineage line until permission is held | Owner and counsel (Q4) |
| C11 | 7 | Treatment claims. The Work and DBT are practices a clinician teaches. The cave says "a game, not therapy". The adult trauma tier is the nearest to a therapy claim | rules 11 and 14; research note | Claim only a player-reported change in this sitting; clinician read before the child and trauma tiers | Owner (Q5) |
| C12 | 7 | Window of tolerance as a safety check: polarity is a player-reported teaching heuristic, and self-report can confabulate | research note, `ontology_objects` and `mechanical_claims` | Use polarity to offer a practice and never to clear the player as safe | Record |
| C13 | 3 | Wise Mind, Big Mind, Sage and the centre of the self collide; Validate and Accept each carry two senses | 3.3 | Wise Mind is the centre of the self; keep Big Mind's name for its cave | Council term pass (owner locks) |
| C14 | 5 | Mortal spirits (Wendell, 20 October) and a streak remediation both attach loss to inattention. For children this multiplies the stakes | spirit-care pass; Shaman and Challenger warnings about a guilt meter | The four-player simulation (`C/council/spirit-care/sim.py`) runs before any child sees decline | Owner (Q1) |
| C15 | 3 | No skill inventory exists as data. DBT skills need a table: name, module, step list, when not to use, move, face | `B/src/lib/emotional-alchemy/registry.ts` has the tool shape (T01 to T11) | Add DBT as registry entries with the same fields | Build |
| C16 | 7 | A trusted adult needs a model: who, how chosen, what they see. The Between handles pairs, not a guardian and a child | privacy and consent authority (Quickstart): authority intersects for relational material | Not designed. No guardian sees a child's lines | Owner and counsel (Q3) |
| C17 | all | The extension must be able to play with no AI. The record is explicit | rule 12 | Templates for every prompt; any AI reading of lines is an optional proposal | Record |

## 5. Open questions for the owner

The reach test (`C/council/faces.yaml`, `reach_test`) leaves five questions the record cannot answer. Each is written in the
board's row format: options, the consequence of each, why only the owner can answer, and why it was not asked before. Per the
repo rule they go on the Council Board and not into chat. **They have not been landed**, because that needs a write to
six-faces-council `board/board_data.json` on main and a republish, which this session did not do. IDs are working names.

**`tw-audience`: which tiers are in scope, and in what order?**
- *Options:* (a) adult and middle/high school first, children later; (b) all three together; (c) children only.
- *Consequences:* (a) keeps to the research note's floor and puts the clinician read ahead of the children's tier. (b) adds the
  children's data, adult-presence and mortality questions to the first build. (c) puts the whole safety burden on the
  least-evidenced tier.
- *Why only the owner:* audience, consent and release are reserved items, and the council record points two ways (C2, C14).
- *Why not asked before:* the brief that created it is new. Also the record's "no kids' version" position is narrower than the
  `inner-creatures` direction.
- *Also decide:* whether mortal spirits apply to children.

**`tw-streak`: a visible run counter or none?**
- *Options:* (a) none, with the lapse path in 3.8; (b) an opt-in run the player can see, freeze and delete; (c) a default run.
- *Consequences:* (a) matches rule 9 and costs a familiar hook. (b) passes the visible, chosen and exitable test and needs a
  ruling that flips the standing position. (c) contradicts the record and the Duolingo owl warning in the spirit-care pass.
- *Why only the owner:* it flips a standing council position and changes what gets built.
- *Why not asked before:* the record had no proposal to remove the no-streak line until now.

**`tw-gate-input`: how does the gate know something happened?**
- *Options:* (a) the player's own button or choice only; (b) the same, plus a trusted adult chosen in advance who is told when
  the button is used; (c) free-text reading by the system.
- *Consequences:* (a) keeps rules 5 and 12 and cannot catch what a player does not choose to say. (b) adds a guardian model (C16)
  and a data path. (c) breaks the non-AI route and the privacy envelope and needs counsel.
- *Why only the owner:* money, consent and release are reserved, and a legal read on child-data and reporting duties is needed.
- *Why not asked before:* no children's tier existed in the record.

**`tw-names`: brand names or generic names?**
- *Options:* (a) generic names with a lineage line ("Belief Inquiry", "skills from DBT"); (b) the brand names, with permission
  from the rights holders.
- *Consequences:* (a) ships now and matches the registry. (b) carries recognition and a permissions and licence cost.
- *Why only the owner:* money and anything that names a person are reserved.
- *Why not asked before:* nothing in the record used either name outside the registry's lineage line.

**`tw-clinician`: is a clinician lined up for the read?**
- *Options:* (a) a named clinician reads the Work and DBT branches, the gate and the child tier before any child or trauma-tier
  play; (b) none yet, so those tiers wait.
- *Consequences:* (a) unblocks the tiers. (b) keeps scope to the adult skills-practice tier.
- *Why only the owner:* the fact is theirs. The `inner-creatures` sheet already lists a clinician read as pending.
- *Why not asked before:* it was listed and never put as a question.

Positions that stand without a question (they are answered by the record): "shadow kinds" and not "faces" (C3); pause is not
skip (C4); thought lines stay on the device with Forget and Delete (C6); accomplishment shows as the creature changing, with
no badge or level (C7); inquiry starts after the daemon is heard, and no answer earns a reward (C8); Wise Mind is the centre
of the self (C13); every prompt has a non-AI template (C17).

## 6. AQAL attention

- **UL, I:** the felt sense of a stressful thought and what it does in the body; the player's own turnaround. The player
  authors the meaning.
- **UR, It:** the 0 to 10 readings, the somatic practices (breath, feet and seat), what the player does after.
- **LL, We:** foregrounded only at the interpersonal skills (Diplomat, DEAR MAN, GIVE) and the trusted adult. The Between is
  out of the first slice. Any shared version needs the permission intersection rule.
- **LR, Its:** the event/thought split, the tier rules, the skill inventory and what the system keeps.
- **Lines made consequential:** perceiving a charge (Wake Up), clearing it (Clean Up), acting on it (Show Up). Capability within
  a named line, never a whole-person rank.
- **States invited, not converted into traits:** hidden, flooded, numb and dissociated are states of one charge in one sitting.
- **Types favored or burdened:** favors players who like inquiry and writing; burdens players who dissociate readily or who are
  trauma-exposed (the research note's strongest caution), and young readers.
- **Exclusions and refusal:** no required disclosure; every page has Step back; "Not now", "pass" and no-shift all count as
  valid endings.

## 7. What was not checked, and the next moves

Not checked:

- No face was convened. Nothing here has had the dissent a council pass produces.
- The cave's current state was read from design docs and callsheets. I did not run the cave tests or open the game.
- `move-engine.ts` was not read, so the opposite action and control-cycle match in 3.3 is a guess.
- DBT and The Work sources were not consulted. Skill lists come from the brief. Adolescent DBT adaptations exist (DBT STEPS-A is
  one) and were not read.
- No legal, privacy or clinical review has occurred. COPPA, state children's privacy law and mandated reporting are named here
  as gaps only.
- The Octalysis drives come from the repo's own audit and not from Chou's book.

Recommended order, smallest first:

1. Land the five rows in section 5 on the Council Board and read the answers.
2. Run one six-face pass on 3.4 and 3.7, with the Regent, Diplomat and Shaman lenses weighted for the gate.
3. Scout T04, T06 and T07 in the registry and add DBT entries with the same fields (C15). That is the cheapest probe and
   needs no UI.
4. If the owner chooses to proceed, scaffold a spec kit per `.agents/skills/spec-kit-translator/SKILL.md` with a Verification
   Quest. Read `UI_COVENANT.md` before any UI.
5. Book the clinician and legal reads before any child or trauma-tier player sees a build.

## Sources

`C/ontology/manifest.yaml`; `C/ontology/v0.1/QUICKSTART.md`; `C/ontology/v0.1/source/design-ontology-v0.1.yaml`;
`C/ontology/v0.1/source/council-phase-a/face-namespaces/council-decision.md`; `C/council/faces.yaml`;
`C/council/daemons/daemons.yaml` and `questions.yaml`; `C/council/callsheets/perceptual-shadow.md`, `inner-creatures.md`,
`game-demo.md`; `C/council/research/2026-10-17-perceptual-shadow-research-vs-ontology.md`;
`C/council/research/2026-10-17-marble-kata/README.md`; `C/council/passes/6FACE_PASS_spirit-care1_2026-10-20.md`,
`6FACE_PASS_inner-vessel1_2026-10-18.md`; `C/docs/morning.md`;
`B/content/ontology-game/cave/DESIGN.md`, `LEVELS.md`, `bigmind/DESIGN.md`; `B/content/ontology-game/game.jsx`;
`B/src/lib/emotional-alchemy/registry.ts`; `B/GM_GAP_ANALYSIS_RPG_ZINE_BAR_MATURITY.md`.
