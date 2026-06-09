# Book Editing Backlog — MTGOA
**Created:** 2026-05-14  
**Purpose:** Editorial infrastructure improvements, skill updates, and process decisions that arise during manuscript work. Not the manuscript task list (that's `DEVELOPMENTAL_ISSUES_TRACKER.md`) — this is the meta-level: improvements to how we edit.

---

## How to Use

Open when an editorial session surfaces a process gap, a skill limitation, or a needed tool. Items here feed back into the recursive-editorial skill stack and the book's editorial infrastructure. Unlike `DEVELOPMENTAL_ISSUES_TRACKER.md`, these items are about the *process*, not the chapters.

Priority tiers:
- **P0** — blocks the next editorial session
- **P1** — significantly improves editorial quality
- **P2** — enhancement; needed before a specific milestone

---

## P0 — Drafting Protocol (process discipline — apply immediately)

### Pre-Draft Sequence: Mandatory File Reads Before Any New Passage
**Triggered:** 2026-05-18 Ch5 reader catch session  
**Problem:** Drafts were generated from content logic + approximate voice intuition without running the evaluation framework first. Result: 2-3 iterations to land a passage that should have been right on the first draft.

**Root cause:** `WENDELL_VOICE_AGENT_GUIDE.md` and `WENDELL_VOICE_PROFILE.md` were not flagged as mandatory pre-draft reads in MEMORY.md. Treated as reference material rather than generative constraints.

**The correct sequence before any new passage is drafted:**

1. Read `WENDELL_VOICE_AGENT_GUIDE.md` — operational contract
2. Read `WENDELL_VOICE_PROFILE.md` — signature moves
3. Read `WENDELL_FACE_VOICES.md` — face-specific register
4. Read `IDEAL_READER_PROFILE.md` — reader target
5. Read the target section of the chapter — calibrate to existing prose rhythm
6. **Before writing a single word:** state paragraph type, reader contract, required signals, forbidden signals
7. Draft with those constraints as generative, not post-hoc
8. Run the evidence-based evaluation template before presenting — quote the lines doing the work

**The rule:** If you cannot quote the line doing the required work before presenting the draft, you are not ready to present it.

**Fixed in:** MEMORY.md now flags both voice files as "Load before any draft."

**⚠️ FIX INSUFFICIENT — failure recurred (2026-05-18):** MEMORY.md pointer requires the file to be loaded. Loading is voluntary. Gates in optional files are optional gates. This fix failed and was incorrectly marked complete — a Pattern 1 violation (declares done without L1 verification).

**Root cause (revised):** The failure is architectural. All prior fixes add gates to files that require loading. The gate must live where loading is guaranteed — either a mechanical tool call with visible output, or a MEMORY.md standing executable instruction (not a pointer).

**Parent spec:** `docs/plans/MTGOA-VOICE-PROTOCOL-SPEC.md` — DRAFT, has the correct diagnosis + 5-phase protocol  
**Integrity spec:** `docs/plans/2026-05-18-voice-gate-integrity-spec.md` — full gap analysis, readiness 3/5, implementation items  
**Status:** Escalated to parent spec. Do not remark as fixed until `Skills/mtgoa-voice-protocol/SKILL.md` is built and `voice_protocol_gate` is in AGENTS.md.

---

## P0 — Blocks confident somatic editing

### Design Process: EA + Shamanic Perspective → Poetics Contract
**Triggered:** 2026-05-14 Ch1 editorial session  
**Status:** Core insight reached 2026-05-14. Reframe below. Update skill stack before next editorial pass.

#### Core Insight (2026-05-14 — replaces the original problem framing)

**EA moves have the somatics built in. The somatic response is a byproduct of clean EA execution, not a separate technique layer.**

When the dissatisfaction → satisfaction arc completes correctly — when the translate/transcend move lands — the reader's body moves with the story at the speed of the alchemy. The epiphany bridge (the structural moment where the frame flips) moves the body at the speed of the narrative. You don't engineer the somatic response. You earn it by executing the EA moves cleanly.

Wendell's punchline IS a complete EA move in compressed form: dissatisfaction held in the setup, transcendence in the flip. "Cynicism is grief with a better vocabulary" works somatically because it executes a full EA arc in one sentence. The body follows the alchemy. Location of the feeling in the body is irrelevant.

**The over-engineering we did:** Tried to add somatic body-location language ON TOP of EA moves that weren't fully landing. This produced "performed somatics" — manufacturing the symptom of good EA instead of doing the actual EA. The somatic mechanics research, the prescription problem, the "write body-first" techniques — all were symptoms of under-executed EA, not a separate problem requiring separate techniques.

**The actual fix:** When a passage lacks somatic response, ask: is the EA move landing? Is the dissatisfaction → satisfaction arc complete? Is the epiphany bridge present? Fix those. The somatic response follows automatically.

#### What Remains (Original Problem Reframed)

The original problem framing was: "how do we write somatically without prescription?" The real question is: **how do we ensure EA moves are executing cleanly in the manuscript?**

**The failure mode we keep producing:** Prescriptive body-location language.
- "Something in the chest braces."
- "Something reorganizes in the chest."
- "Your body learned to hold very still."

These tell the reader WHERE to feel things. For the reader where it lives in the throat, gut, jaw, or hands, this breaks the somatic contract. The text becomes wrong about their body and they leave.

**The current somatic mechanics research** (`05 Research/SOMATIC_WRITING_MECHANICS.md`) describes how the WRITER accesses their own felt sense while writing — Levine, Gendlin, present-tense sensory tracking. This is valid as a writing practice. The problem: when translated into "you" language in nonfiction, it becomes prescriptive. The research does not solve the prescription problem.

#### Three Modes (Partial Map)

**Mode 1: First-person reportorial**  
The writer reports their OWN body's response — specifically, truthfully, as their body, not the reader's.
- "My chest braced. I put the phone down and stood there." (Wendell's body)
- Reader locates their own equivalent without being told where it should be
- Honest: it's not claiming to know the reader's body
- Risk: overuse makes it memoir-ish; needs to be deployed deliberately

**Mode 2: Poetics as somatic trigger**  
Language craft — rhythm, compression, image, white space, sentence length — that produces a somatic response in the reader without naming where it lands. The text HIT is in the prosody, not the prescription.
- Short sentence after long sentence forces a pause — the reader breathes
- "The world is not fine." — the period does the work, not a body-location word
- A list that builds and breaks: the cascade IS the somatic effect
- Adding "something in the chest braces" on top of poetics that are already working = redundant prescription that weakens what the rhythm was already doing

**Mode 3: Performed somatics (avoid)**  
Describing body responses in second-person "you" language as if naming the reader's location.
- Feels somatic on the surface
- Breaks for any reader where the named location is wrong
- Makes the writing feel therapeutic or coached rather than alive

#### What We Don't Have Yet

A working design for how each EA channel translates into a POETIC approach rather than a prescriptive body-location approach.

Preliminary sketch (not validated):
- **Fear channel:** Short sentences, hard stops, white space — creates the held breath without naming it
- **Grief channel:** Long accumulating sentences that don't resolve, repetition with variation — the form enacts the feeling
- **Anger channel:** Hard consonants, declarative sentences, no hedging, short pauses — the rhythm IS the charge
- **Shame channel:** Second-person address + syntax of self-exposure, but no body location — the reader recognizes themselves without being told where they feel it
- **Joy channel:** Expansion, rhythm that opens rather than closes — sentences that let air in

The shamanic principle that underlies this: the Shaman doesn't say "I felt angry." The Shaman IS in the anger while writing, and the prose carries that. "Everything can be used" means the feeling itself shapes the sentence, not the description of the feeling.

#### Design Process Needed

This requires a full design session — not just a note. The output should be a `SPEC_SOMATIC_POETICS.md` in Book OS that serves as a working contract for:
1. When to use first-person reportorial vs. poetic trigger vs. neither
2. How each EA channel maps to specific prosodic moves (rhythm, syntax, image, compression, white space)
3. Criteria for evaluating whether a passage is doing somatic work through poetics vs. performing it through prescription
4. How the shamanic register (felt-sense-first, everything-as-signal) expresses through form, not description

**Input sessions needed:**
- Wendell on how his own body states express in his strongest writing (what does his Fear-channel prose look like vs. Grief-channel vs. Anger-channel)
- Review of 3-5 passages he IS in love with from the manuscript — what makes them alive
- Possibly: look at the tweet corpus for somatic-without-prescription examples

**Feeds into:**
- `Skills/recursive-editorial-pass/emotional-alchemist/SKILL.md` — EA pass needs this contract before it can make sound somatic recommendations
- `Skills/recursive-editorial-pass/architect/SKILL.md` — Architect pass needs to distinguish poetic somatic moves from prescriptive ones
- All future manuscript editing passes

**Until this spec exists:** When EA pass flags somatic dissociation, the synthesis should recommend Mode 1 (first-person reportorial) or Mode 2 (poetics audit) — never Mode 3 (add body-location language in "you" register).

---

## P0 — Genre Notes (blocks correct register targeting)

### GENRE_NOTES.md — Define What Kind of Writing This Book Is
**Triggered:** 2026-05-14 Ch7 reader catch editorial pass  
**Problem:** The editorial skill stack has voice guidance (WENDELL_VOICE_AGENT_GUIDE.md, WENDELL_FACE_VOICES.md) but no genre definition. Without genre notes, compression passes default toward the wrong register — blog post / newsletter / Instagram punchy. The book's correct register is long-form nonfiction that thinks like a novel: subordinate clauses, discursive warmth, sentences that breathe. The influences (Adams, Pratchett, Whitman, Jung Red Book) all write with verbal spaciousness, not compression-toward-the-punchline.

**What to create:** `GENRE_NOTES.md` in Book OS, loaded alongside WENDELL_VOICE_AGENT_GUIDE.md. Contents:
- What genre this book is (and is not — not blog, not self-help, not academic)
- Register signal: long-form nonfiction / essay / guided tour
- Sentence length target: subordinate clauses welcome; punchy compression reserved for specific effect, not default mode
- What "too compressed" looks like in this context (the Instagram punchy register test)
- What "correctly spacious" looks like (Whitman's catalog, Adams' parenthetical orbits, Pratchett's earned digressions)
- How each Face's chapter has its own register variant (Shaman = bardic, Sage = discursive and warm, Challenger = punchy when the line needs to land, etc.)

**Load when:** Compression Smith pass runs; any pass that makes cuts.

---

## P1 — Significant editorial improvements

### Somatic Mechanics — Operationalize "Stay in the Body" Instruction
**Triggered:** 2026-05-14 Ch1 editorial session  
**Gap:** The Emotional Alchemist pass can detect somatic dissociation and ontology float but cannot give the author a concrete craft move to fix it. "Stay in the body" is an orientation, not a technique.  
**Research:** Completed — `The Library/05 Research/SOMATIC_WRITING_MECHANICS.md`

**What to update:**

1. `Skills/recursive-editorial-pass/emotional-alchemist/SKILL.md` — add **Somatic Integrity Checklist** section with the 8 concrete craft moves from the research:
   - Sensory specificity over emotion names
   - Present-tense sensory tracking (Levine)
   - Gendlin's felt-sense method (point to pre-verbal knowing)
   - Granular physical notation before emotional conclusion
   - Interruption and non-completion
   - Proprioceptive grounding
   - Nervous system signature instead of objective description
   - The micro-pause between stimulus and reaction

2. `Skills/recursive-editorial-pass/architect/SKILL.md` — add a **somatic grounding check** to the Missing Bridge detection: when a somatic opening is present in a section, flag if prose drifts to collective or analytical voice before the somatic signal has completed. Current Missing Bridge detection doesn't account for this specific failure mode.

3. `Skills/recursive-editorial/SKILL.md` (main spec) — add `Somatic Drift` to the Failure Mode Ontology: "The moment when writing transitions from body-reported to analyst-reported without the author noticing."

**Also operationalize the rule itself:**  
*"One sentence that doesn't leave the body before it's done"* means: complete the body's sensory response before you interpret, summarize, or step outside to analyze. Let the cascade of sensation fully unfold, in sequence, before adding explanation or meaning.

**Reference:** `The Library/05 Research/SOMATIC_WRITING_MECHANICS.md`

---

### Emotional Alchemist Pass — Require Specific Text Citations
**Triggered:** 2026-05-14 Ch7 editorial pass  
**Problem:** EA pass identified channel and move types but didn't cite the specific sentences executing each move. "Metal/Fear channel, Contextualize move" is abstract — not useful without pointing to which sentence is the Contextualize, which sentence is the dissatisfaction anchor, which sentence is where the satisfaction state arrives (or deliberately doesn't).

**What to update:**
1. `Skills/recursive-editorial-pass/emotional-alchemist/SKILL.md` — add requirement: for each EA move identified, cite the specific passage (1-2 sentences) where the move executes. Output format: `[Move type]: "[quoted passage]" — [why this is the move / what it does]`
2. Add diagnostic: if an EA move is identified without a citation, the pass is operating at the wrong level of analysis.

---

### Final Synthesis — "Element Needs a Section" as Third Outcome
**Triggered:** 2026-05-14 Ch1 editorial session  
**Gap:** Final Synthesis currently has two outcomes: incorporate an edit or reject it. When a needed element (e.g., Fire/anger channel) has no structural home in the current chapter, the synthesis rejected it as "can't be earned here." Wendell corrected: when an element is needed but homeless, pitch a new section rather than rejecting the element.

**What to update:**

1. `Skills/recursive-editorial/SKILL.md` — add a third synthesis outcome type: `pitch_new_section`
   - Used when: a pass identifies a needed element that has no current structural home
   - Output format: element name + why it's needed + where in the sequence it would live + approximate length/register + how it would bridge to adjacent sections
   - Constraint: the pitch is a recommendation, not an edit — Wendell decides whether to create it

2. `Skills/recursive-editorial-pass/final-synthesis/SKILL.md` — add rule: "Before rejecting an edit for structural reasons, ask: does this element need a section of its own? If yes, produce a section pitch instead of a rejection."

**Example from this session:** Fire/anger channel identified as absent from Ch1 S1. Correct response: pitch a short bridging section between the behavioral list and the old allyship critique that names the specific charge underneath exhaustion — rather than rejecting Fire as "not earned."

---

### Comedic Calibration Pass — Tone Audit via Clown/Jerk/Cult Leader Framework
**Triggered:** 2026-05-20
**Problem:** The manuscript has solid mechanics (EA framework, allyship gates, truth) but uniformly serious tone. The Igniting Joy model demonstrates the target register: comedy from deep pain, where the reader laughs at themselves for the situation they're in. The three comic archetypes (Clown, Jerk, Cult Leader) provide the perspective. The manuscript has the truth. The interview will surface the pain. We need a systematic way to map all three onto the manuscript.

**The three-axis calibration frame (TRIAD):**
- **Truth axis:** What is actually true in this passage (the framework claim, the EA insight, the mechanic) — already in the manuscript
- **Emotion axis:** What do we want the reader to FEEL (catharsis, relief, recognition, the sick-punch of seeing yourself in the absurd) — must be calibrated per passage
- **Archetype axis:** Which comic voice lands the punchline — Clown (says the obvious thing nobody says), Jerk (cathartic superiority), Cult Leader (identificatory complicity — "you did this, I did this, we're both here")

**Key insight from Wendell (2026-05-20):** Comedy is truth + pain + perspective. The archetypes provide the perspective. The manuscript has the truth. The interview surfaces the pain. The calibration maps all three to the manuscript.

**The Igniting Joy tonal reference:** Igniting Joy is the working model for "diffuse anger into comedy and playfulness." It demonstrates that the comedy doesn't undercut the framework — it makes the framework more memorable and more human. The book should aim for this register throughout.

**Comedic archetype definitions (working contract):**
- **Clown:** Says the obvious thing nobody says. Uses the reader's own inner voice against them. Absurdity reveals truth. Function: liberation.
- **JerK:** Cathartic superiority. Reader gets to feel above the situation ("thank god that's not just me"). Function: release without judgment.
- **Cult Leader:** Identificatory complicity. Implicates Wendell AND the reader in the same pattern. "You did this, I did this, we're both here." Function: teaching without teaching — highest comedic function.

**Failure mode:** Comedy from shallow pain reads as catty or defensive. Comedy from deep pain reads as freeing. Depth threshold must be calibrated per insertion — if the pain isn't deep enough, the comedy floats above the content like stand-up with PowerPoint slides.

**What this requires first — Interview with Wendell on Comedy Craft:**
- Collect 3-5 examples of comedy-from-deep-pain from Wendell's existing work (Igniting Joy passages, van-tweet moments, anything in the tweet corpus that lands as both funny and true)
- Map each: what was the pain? what was the truth? which archetype was used? how did it land in the reader's body?
- Surface the decision-making: how does Wendell choose which archetype for which moment?
- This interview output becomes the calibration reference for the pass

**What this produces — Comedic Inventory:**
For each of the 8 gates (and opening/closing), a row:
```
| Gate | Truth (what's true) | Emotion (desired reader feeling) | Archetype | Draft line |
```
This is filled in collaboratively in a 60-90 min session. The inventory becomes the working document for the actual pass.

**What the pass actually does:**
With the inventory in hand, the agent runs through the manuscript and drafts comedic insertions per gate. Each insertion: the truth must land cleanly, the emotion must be achievable at that depth, the archetype must be the right one for the beat. Wendell approves or revises in real time.

**Skills to build:**
- `Skills/comedic-calibration/SKILL.md` — TRIAD framework (Truth/Emotion/Archetype) + Comedic Inventory template + pass protocol
- `Skills/comedic-calibration/INTERVIEW_PROMPT.md` — interview guide for Wendell's comedy craft session

**Status:** P1 — interview needed before pass can be designed. Blocks: nothing (can design skill structure now), gated by: interview output.

---

### Joanne's Council / Public Enemy #1 — Antagonist Archetype Research Pass
**Triggered:** 2026-05-20
**Problem:** The book's argument (allyship as a skill, EA framework, paradigm shift) has an antagonist — the institutional forces, establishment voices, and status-quo protectors who stand to lose the most from the shift Wendell is proposing. These voices don't appear in the manuscript. The book argues FOR a new paradigm without naming WHO is defending the old one. This is a significant structural gap.

**The "Council of Joanne's":**
Joanne = the archetypal establishment voice. The institutional figure who benefits from the current allyship paradigm (performative, liability-focused, risk-managed). Not a person — a constellation of forces:
- The HR department that needs allyship to be a checklist, not a skill
- The nonprofit board that needs allies to be grateful, not demanding
- The friend who needs the ally to stay comfortable so the friendship doesn't shift
- The corporate training that commodifies allyship into a 2-hour workshop
- The activist community that gatekeeps "real" allyship to maintain identity
- The academic field that needs allyship to stay theoretical

The "Council" = all the voices that will push back on the paradigm shift. They are the reader's internal resistance made external. Naming them is part of the book's honesty — it acknowledges that the reader will encounter these forces IN themselves and AROUND themselves.

**Why this matters for the book's argument:**
A paradigm shift book without an antagonist is a philosophy lecture. The antagonist forces:
1. Give the reader permission to see where they've been defending the wrong paradigm
2. Explain why the shift is hard — not just personal resistance but social/institutional resistance
3. Make the comedy possible — the Clown and Jerk voices need an object, and the object is often the institutional nonsense (the training, the policy, the social expectation)
4. Ground the book in material reality — this isn't just about inner work, it's about navigating institutions that profit from performative allyship

**What this requires — Research + Interview with Wendell:**
- Map the institutional landscape: who benefits from the current paradigm? (HR, nonprofit industrial complex, corporate DEI, academic allyship studies)
- Map the personal landscape: which friendships, relationships, or community roles are defended by the old paradigm?
- Wendell's direct experience: where has he encountered the Council? Which Joanne's has he met? What did they say? How did it feel?
- The tweet corpus may have examples — the "van tweet" moments where institutional absurdity is named

**What this produces — Antagonist Field Map:**
```
| Antagonist Force | What they protect | How they manifest in the reader | Comic register available |
```
This map serves multiple uses:
- Comedy insertions: the institutional absurdities are the Jerk and Clown's best material
- Reader preparation: the reader sees where they'll encounter resistance AFTER reading
- Honest framing: the book acknowledges the external forces, not just internal ones

**Skills to build:**
- `Skills/public-enemy-analysis/SKILL.md` — research protocol + Antagonist Field Map template
- Can be run as part of the Comedic Calibration research phase (same interview session, different questions)

**Relationship to Comedic Calibration:** The Antagonist Field Map feeds directly into the TRIAD framework — the institutional absurdities are the "obvious thing nobody says" that the Clown voice names. Many of the best comedy insertions in the book will target the Council directly.

**Status:** P1 — research session needed. Can run parallel to Comedic Calibration interview.

---

## P2 — Enhancement and refinement

### Sage Pass — Permission-Granting Register Correction
**Triggered:** 2026-05-14 Ch1 editorial session  
**Gap:** Sage pass flagged "Permission is not something the author can grant" as a universal rule. Wendell corrected: permission CAN be granted from Regent altitude, consciously, in service of the reader. The Sage's ruling was operating from Green-altitude skepticism of authority.

**The distinction that matters:**
- **Covert permission-granting:** author doesn't know they're doing it; reads as spiritual gloss; reader feels managed
- **Conscious permission-granting from Regent altitude:** author chooses this register deliberately because the reader needs it from someone holding stewardship; valid and load-bearing

**What to update:**

1. `Skills/recursive-editorial-pass/sage/SKILL.md` — replace "Permission is not something the author can grant" with a register-choice diagnostic:
   - Is this permission being granted consciously from an authority the author has earned in the text?
   - Or covertly from an unexamined need to rescue the reader?
   - Flag: covert permission = spiritual gloss. Conscious Regent permission = valid move.

2. `Skills/recursive-editorial/SKILL.md` (main spec) — add distinction to Spiritual Gloss failure mode: "Spiritual Gloss is covert permission-granting or unearned wisdom-gesturing. It is not the same as conscious Regent authority. When the author has established stewardship standing in the text, direct permission can be load-bearing."

**Example from this session:** The ideal reader catch paragraph in Ch1 S3 — "The Shaman's first move is available to you" — was flagged as spiritual gloss but may be valid Regent permission given Wendell's established authority. The Sage should flag this as a register *choice* and ask Wendell to decide, not auto-reject.

---

### Final-Pass Word Count Compression — Cut Last, Not First
**Triggered:** 2026-05-28 Issue 14 (Journalistic Integrity) session
**Problem:** During revision drafts, there is an emergent drive to compress ideas to fit perceived word-count ceilings. This produces clunky prose — phrases stacked against each other without room to breathe, ideas truncated before they complete, the writing feeling "crazy" even when the ideas are right. The compression drive is unspoken and partly unconscious.

**Root cause:** Word count targets are load-bearing editorial constraints for the final manuscript, but they are being applied prematurely — during first-draft passes — where completeness matters more than economy. The result is prose that fails on voice before it ever gets to count.

**The rule:** Write revisions completely. Let ideas breathe. Cut at the end, not at the beginning. The editorial review pass (not the drafting pass) is where compression happens.

**What to add to editorial sequence:**
- Final compression pass is its own distinct step, after all content passes are complete
- During drafting and revision: no word-count ceiling applies. Write the idea fully.
- During the compression pass: tighten without losing the idea. Audit for repetition, not completeness.

**Backlog item:** Add a "Compression Pass" as a named step in the editorial sequence in `CHAPTER_COMPLETION_SPEC.md`. It goes last, after voice pass, after journalistic integrity pass, after all content additions. Criteria: every idea fully present, no sentence duplicating another sentence's work.

**Status:** P1 — apply immediately to Issue 14 drafts and forward. Add to Chapter Completion Spec before next chapter editorial sequence runs.

---

## Completed

### Final Synthesis — Gap Analysis Output (completed 2026-05-14)
**Triggered:** 2026-05-14 Ch3 editorial session  
**Problem:** Skill run produced scores (e.g., AbstractionDrift 2/5) with no actionable guidance on what would move each score to 5/5. Scoring without a gap analysis is an audit without a prescription.  
**Fix applied:** Updated `Skills/recursive-editorial-pass/final-synthesis/SKILL.md`:
- Added `transformationMechanism` as a fourth scoring dimension (was missing from Final Synthesis; only Embodiment/ChargeContinuity/AbstractionDrift were scored)
- Added scale direction clarification to all four dimensions (5 = ideal, 1 = failure state)
- Added required Section 6 (GAP ANALYSIS): for each score below 5, the synthesis must output current state (which specific passage), target state (what 5/5 looks like in this text), and specific change (concrete edit)
- Added `gapAnalysis` field to OUTPUT FORMAT with required structure
- Rule: "A score without a gap analysis is an audit without a prescription. Do not score and stop."
