# Wendell Voice — Agent Operating Guide
**For:** Any AI agent editing, drafting, or revising MTGOA manuscript content
**Created:** 2026-05-08
**Rewritten:** 2026-05-09 — restructured to separate evaluation from generation
**Updated:** 2026-05-18 — Phase 0 hard gate added (per EDITORIAL-5)
**Status:** Primary operational file
**Authority:** This is the main agent-usable voice contract. When this file conflicts with broader descriptive files, this file wins.
**Support files:** `WENDELL_VOICE_PROFILE.md`, `VOICE_MATRIX_BY_FACE.md`, `IDEAL_READER_PROFILE.md`, `VOICE_SYSTEM_REWRITE_AUDIT_2026-05-09.md`

---

## ⚠️ PHASE 0 — HARD GATE (read before any voice edit)

**This is not optional. This is not a suggestion. This is the gate.**

Before ANY `edit_file_llm`, `create_or_rewrite_file`, or draft on manuscript content:

1. **Read the Hard Rules** (section below — 2 min)
2. **Classify the gap:** diagnosis | concept | story | practice | transition | reader-catch
3. **Identify the reader target:** wendell_reader | ideal_reader | both
4. **Ask:** Does this gap need Move 6 (real-time processing) or Move 7 (self-disclosure that turns universal) content?
   - **YES:** Stop. Set container. Ask Wendell for the personal material. Generate nothing.
   - **NO:** Proceed to Phase 1.

**If you skip this gate, you will generate voice-adjacent prose that fails every deterministic check.**

---

## Purpose

This file is not a vibes document.

Its job is to help an agent:

1. generate text that fits Wendell's voice
2. reject text that only sounds approximately right
3. pass deterministic reader and style gates before aesthetic judgment begins

This guide is designed to reduce hallucination.

---

## Core Rule

Do not ask first: "Does this sound good?"

Ask first:

1. What kind of paragraph is this?
2. Which reader contract applies?
3. Which required signals must appear?
4. Which forbidden signals must not appear?
5. What exact sentence is the evidence?

If you cannot answer those, you are not ready to pass the paragraph.

---

## File Precedence

Use the voice stack in this order:

1. `WENDELL_VOICE_AGENT_GUIDE.md` — operational contract
2. `IDEAL_READER_PROFILE.md` — deterministic reader target
3. `WENDELL_VOICE_PROFILE.md` — signature moves and examples
4. `VOICE_MATRIX_BY_FACE.md` — face-specific influence guidance

If the files feel inconsistent:
- this guide governs execution
- the profile and matrix provide supporting interpretation

---

## Hard Rules

### Never do these

1. Do not signal importance.
Remove:
- `Here is the truth:`
- `What this means is:`
- `This is crucial:`
- `Importantly,`
- `The key insight is:`

2. Do not soften a diagnosis with hedge starters.
Remove:
- `sometimes`
- `it can be`
- `many people`
- `you might`
- `you may`
- `often`
unless the sentence is truly statistical or comparative.

3. Do not explain a compressed definition in the next 2-3 sentences unless the section contract explicitly requires unpacking.

4. Do not end a first-person story with retrospective mastery.
Remove:
- `what I learned`
- `I didn't know it then`
- `looking back`
- `in retrospect`

5. Do not use generic "you" where a specific `I` observation would do more work.

6. Do not use allyship boilerplate as the main prescription.
Flag:
- `be better`
- `try harder`
- `listen more`
- `do the work`
unless the sentence is explicitly critiquing that language.

---

## Deterministic Evaluation Order

Evaluate in this sequence:

### Step 1 — Paragraph Type

Classify the paragraph as one of:

- `diagnosis`
- `concept`
- `story`
- `practice`
- `transition`
- `reader-catch`

If you cannot classify it, fail the pass and classify first.

### Step 2 — Reader Contract

Choose one dominant reader target:

- `wendell_reader`
- `ideal_reader`
- `both`

If you say `both`, you must satisfy both contracts explicitly.

### Step 3 — Section/Paragraph Contract

Use the required and forbidden features for that paragraph type.

### Step 4 — Evidence

Quote the exact line(s) that satisfy the contract.

No evidence line = no pass.

### Step 5 — Only Then Run the Aliveness Check

After deterministic gates pass, ask whether the paragraph is alive, compressed, and worth keeping.

---

## Reader Contracts

### Reader Contract: Wendell as Reader

This reader rejects:
- caution that sounds like evasion
- long explanation after the insight
- prose that is structurally competent but not alive
- framework language with no personal risk

#### Required signals

At least one of:
- compressed definition
- direct diagnosis
- first-person specific observation
- precise term delivered casually

#### Forbidden signals

- setup phrase before the main insight
- hedge starter in a diagnostic sentence
- generic coaching filler
- retrospective mastery in story mode

#### Evidence requirement

Quote the line that does the real work.

If you need to say "the overall paragraph has the energy," the text has not passed.

### Reader Contract: Ideal Reader

See `IDEAL_READER_PROFILE.md`.

This reader is not a beginner. She is in the advanced trap.

#### Required signals for Ch0 and comparable diagnostic sections

At least one must be present:
- names the moving-goalpost / unwinnable-game dynamic
- names burnout after genuine effort
- names Green-coded coalition or projection dynamic indirectly
- names the suspicion that the game itself is wrong

And at least one of these must also be present:
- non-moralizing reframe
- concrete mechanic
- invitation into a different game architecture

#### Forbidden signals

- courtroom/compliance critique as the primary target, unless contrasted with the advanced trap
- generic "do more allyship"
- overt Integral hierarchy vocabulary that triggers bounce
- shame framing of projection or flatland

#### Evidence requirement

Quote:
- the advanced-trap line
- the reframe/mechanic line

No quoted evidence = fail.

---

## Paragraph Contracts

### Diagnosis Paragraph

**Job:** Name the actual problem without evasion.

#### Required
- one direct diagnosis
- one observable or specific pattern
- if aimed at ideal reader: one advanced-trap marker

#### Forbidden
- hedge starter
- generalized "many people"
- moralizing prescription in place of diagnosis

#### Preferred moves
- compressed definition
- direct allyship observation

### Concept Paragraph

**Job:** State the framework clearly and compressively.

#### Required
- one compressed definition or equally compressed concept sentence
- no more than one explanatory sentence after the core line unless the concept is operationally new

#### Forbidden
- topic-sentence blandness
- ceremonial setup
- three-plus sentences of explanation before the insight

#### Preferred moves
- compressed definition
- precision deployed casually

### Story Paragraph

**Job:** Report from inside experience.

#### Required
- specific scene or sensation
- unresolvedness if the story is about discovery
- first-person if the story is Wendell's

#### Forbidden
- retrospective lesson tag
- summary of the lesson instead of the moment
- generic "you" replacing lived detail

#### Preferred moves
- real-time processing
- self-disclosure that turns universal

### Practice Paragraph

**Job:** Give the reader a move, not a sermon.

#### Required
- one concrete action, question, or check
- one reason the move matters

#### Forbidden
- abstract encouragement without action
- inflated spiritual language replacing instruction

#### Preferred moves
- Wilber move: verify in experience now
- compressed practice definition

### Transition Paragraph

**Job:** Reorient the reader without losing pressure.

#### Required
- one sentence that names what is changing
- one sentence that points forward

#### Forbidden
- limp recap
- generic bridge language

#### Preferred moves
- flat delivery of the profound
- three-part escalation if building toward next section

### Reader-Catch Paragraph

**Job:** Catch the reader so precisely she feels recognized.

#### Required
- one advanced-trap marker or one highly specific lived contradiction
- one line that differentiates this book from generic allyship discourse

#### Forbidden
- beginner critique as primary move
- soft permission before recognition lands

#### Preferred moves
- direct diagnosis
- self-disclosure that turns universal

---

## Section Contracts

Use these section-level expectations when relevant.

### Ch0 Diagnostic Sections

Must include:
- one compressed definition
- one advanced-trap marker for the ideal reader
- one non-moralizing reframe
- zero hedge starters in the main diagnosis

Must not rely on:
- courtroom allyship as the whole target
- generic performance critique alone

### Face Exile / Distortion Sections

Must include:
- one direct naming of what the village lost or distorted
- one sentence that could stand alone as the section's insight

Must not:
- over-explain the shadow
- protect the reader from the diagnosis

### Game Moves / Practice Sections

Must include:
- named move
- concrete application
- line that tells the reader what the move is actually for

Must not:
- collapse into pure framework explanation

---

## Allowed Voice Moves

These are the main permitted tools. Use only what the paragraph contract can support.

1. **Compressed definition**
2. **Precision deployed casually**
3. **Flat delivery of the profound**
4. **Pop culture reference as argument**
5. **Three-part escalation**
6. **Real-time processing**
7. **Self-disclosure that turns universal**
8. **Direct allyship observation**

See `WENDELL_VOICE_PROFILE.md` for descriptions and examples.

---

## Face Guidance

Use `VOICE_MATRIX_BY_FACE.md` for influence detail.

Operationally:

### Shaman
- allow real-time processing
- require bodily or felt specificity

### Challenger
- ban hedge starters aggressively
- prioritize direct diagnosis

### Regent
- require stewardship logic, not just critique

### Architect
- prioritize precision and compressed logic
- avoid decorative references

### Diplomat
- require presence and field sensitivity
- allow first-person permeability

### Sage
- require altitude clarity without inflated register
- demand one point of personal risk if the section is meta

---

## Evidence-Based Evaluation Template

Return evaluations in this shape:

```yaml
paragraph_type: diagnosis|concept|story|practice|transition|reader-catch
reader_target: wendell_reader|ideal_reader|both
pass: true|false
required_checks:
  item_name: pass|fail
forbidden_checks:
  item_name: pass|fail
evidence:
  line_1: "quoted sentence"
  line_2: "quoted sentence"
notes:
  - concise reason
```

If `evidence` is weak or empty, fail the evaluation.

---

## No-Pass Conditions

Fail automatically if any are true:

1. The evaluator cannot quote the line doing the work.
2. The paragraph explains the insight after already stating it.
3. The diagnosis relies on hedges or generic collectivizing language.
4. The personal story resolves itself into a lesson.
5. The paragraph claims to target the ideal reader but only critiques beginner allyship.
6. The paragraph claims Wendell voice fidelity but has no compressed, direct, or risky line.

---

## Final Aliveness Check

Only after the hard gates pass, ask:

1. Is there one sentence worth remembering?
2. Does the paragraph trust the reader?
3. Is the language more alive than the generic allyship version?
4. Did the tests produce sterile compliance?

If sterile:
- keep the constraints
- rewrite the sentence, not the standards

---

## Quick Operational Checklist

- [ ] Paragraph type named
- [ ] Reader target named
- [ ] Required features present
- [ ] Forbidden features absent
- [ ] Evidence lines quoted
- [ ] No automatic fail condition triggered
- [ ] Final aliveness check passed

---

## Related

- `WENDELL_VOICE_PROFILE.md`
- `VOICE_MATRIX_BY_FACE.md`
- `IDEAL_READER_PROFILE.md`
- `VOICE_SYSTEM_REWRITE_AUDIT_2026-05-09.md`
