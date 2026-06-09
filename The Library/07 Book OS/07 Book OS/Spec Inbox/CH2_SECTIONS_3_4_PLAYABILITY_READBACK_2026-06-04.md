---
type: readback
tags:
  - mtgoa
  - ch2
  - emotional-alchemy
  - wave-spiral
  - somatic-register
  - playability
created: 2026-06-04
status: complete
related:
  - [[CHAPTER_2_SHAMAN]]
  - [[CH2_ORIENTATION_READBACK_2026-06-04]]
  - [[EA_CHANNEL_REFERENCE]]
---

# Ch2 Sections 3-4 Playability Readback

## Passage Read

Read:

- Section 3: `What Emotional Alchemy Actually Is`
- Section 4: `The WAVE-Spiral`
- WAVE stages
- five-channel table
- channel mechanics
- energy economy
- four scenarios
- somatic markers
- 3-2-1 / Polarity Map previews

Source:

- `/Users/wendellbritt/The Library /mtgoa-manuscript/chapters/ch2-SHAMAN/CHAPTER2_SHAMAN_FULL_DRAFT.md`

Core question:

> Does Emotional Alchemy become playable before WAVE becomes homework?

## Verdict

Section 3 succeeds.

Section 4 starts well, then over-teaches.

The issue is not WAVE itself. The WAVE-Spiral is necessary and should stay. The issue is the pile-up after the first clean explanation:

- WAVE stages
- five elements table
- separate 5-channel mechanics sequence
- channel questions and default move patterns
- quick triage
- numeric energy economy
- four scenarios
- somatic markers
- promise section
- 3-2-1 preview
- polarity preview

This is too many cognitive doors before the Gates walk. The reader came from Ch1 ready to play. Section 4 risks making her sit through an equipment lecture.

## What Works

### Section 3

Section 3 is strong. It makes Emotional Alchemy feel necessary before it becomes a system.

Strong beats:

- customer service story
- Tough Conversations game
- "They got efficiency. They needed presence."
- "probably my stuff" as the governor on somatic trust
- emotion as teacher, not problem
- fear / anger / sadness / joy as different kinds of information

This section earns Capability and Benevolence trust because it says: the reader already has signal; the problem is what they have been trained to do with it.

### WAVE Opening

The first WAVE definition works:

> activation -> clarity -> integration -> action

This is simple enough to be playable.

The four stages also mostly work:

- Wake: notice the signal
- Clean: clarify what it is showing
- Grow: let the lesson land
- Show: act from the lesson

This is the spine. Do not cut the spine.

### Five-Channel Table

The table is useful as a reference. It should probably stay, especially because WAVE is a signature contribution and the source docs require each channel to have concrete presence.

But the table should do more of the work so the later mechanics block can do less.

## What Fails

### 1. The Separate Channel Mechanics Block Re-teaches the System

The `5 Emotional Channels — Mechanics` block repeats the WAVE logic after the reader has just learned WAVE and just received the channel table.

It turns the section from "here is how to play" into "here is the operating manual."

Best path:

- fold the useful "Common distortion" lines into the five-channel table
- cut the long per-channel default move patterns
- keep a short bridge that says the channels are not a second system

### 2. Numeric Energy Economy Is Already Rejected

`CH2_EDITORIAL_SPEC_PHASE2.md` records an author decision:

> The +2/+1/-1 model is too crunchy, underspecced, and too hard to put into practice.

But the current draft still teaches:

- Transcend `+2`
- Generative Translate `+1`
- Control Translate `-1`

This is a blocker for final Ch2 polish.

The energy ecology concept matters. The numeric scoring model should not survive in body prose as currently written.

### 3. Somatic Markers Cross Into Prescription

The current section says:

> Your body should know you're doing it.

and then gives expected body confirmations:

- thinking slows
- nervous system shifts
- breathing deepens
- shoulders drop
- body says "yes"

This risks the exact problem named in `EA_CHANNEL_REFERENCE`:

> The body responds to good story, not to prescription.

The problem is not body-first practice. The problem is telling the reader what their body should confirm. This can make the suspicious reader feel like they are failing the body test.

## Trust Matrix

### Capability

Mixed.

Section 3 increases capability. Early WAVE increases capability. The channel mechanics and numeric economy may decrease perceived capability by making the reader feel they need to learn too many distinctions before acting.

### Integrity

Mixed.

Lineage and naming decisions are mostly clean, but the rejected energy economy model is still present. That creates an integrity problem against the editorial record.

### Benevolence

Mixed.

The chapter is benevolent when it says the reader's signal is real. It becomes less benevolent when the practice implies a correct body response or asks the reader to track too many systems before they get a move.

## Recommended Spec Direction

Create an active Ch2 revision spec with three lanes:

### Lane 1: Keep The WAVE Spine

Preserve:

- WAVE-Spiral definition
- four stages
- five-channel table
- scenarios as needed
- connection to Gates walk

### Lane 2: Compress Channel Mechanics

Recommended move:

- add a `Common distortion` column to the five-channel table
- cut the long `Channel Questions + Default Move Patterns` block
- replace mechanics block with a short bridge:

> The channels are not a second system. They are the same WAVE pointed at whichever feeling is loudest: name the channel, ask what it is showing you, make one visible move.

### Lane 3: Replace Numeric Energy Economy

Do not patch `+2/+1/-1`.

Write a new energy ecology section that keeps the valid distinction:

- some moves replenish
- some moves sustain
- some moves cost

But remove the scoring frame unless Wendell re-approves a mature version.

### Lane 4: Revise Somatic Markers Into Consent-Based Signals

Replace "your body should..." language with:

- possible signs
- no single correct somatic confirmation
- if nothing obvious happens, choose the smallest honest signal and continue

The point is not to pass a body test. The point is to stop overriding information.

## Recommended Next Move

Make a spec before editing.

This should not be a blind prose tightening pass. Ch2 has a real architecture decision:

- how much system belongs before the Gates walk
- how to preserve WAVE as the signature tool
- how to remove rejected energy scoring
- how to keep body-first practice without somatic prescription

Recommended spec title:

`SPEC_CH2_WAVE_PLAYABILITY_AND_SOMATIC_CONSENT_2026-06-04.md`

Then implement only the lowest-risk lane first: channel mechanics compression.
