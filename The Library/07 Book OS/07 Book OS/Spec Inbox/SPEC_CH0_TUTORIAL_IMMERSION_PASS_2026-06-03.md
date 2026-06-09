---
type: spec
tags:
  - mtgoa
  - ch0
  - tutorial
  - ideal-reader
  - acceptance
created: 2026-06-03
status: implemented-in-draft
related:
  - [[CH0_IDEAL_READER_READBACK_2026-06-03]]
  - [[IDEAL_READER_FEEDBACK_PROMPT]]
  - [[SPEC_CH0_BAR_DOOR_OPTION_C_2026-06-02]]
  - [[SPEC_CH0_ALLYSHIP_DEFINITION_AND_SELF_SABOTAGE_MYTHS_2026-06-02]]
target_export: /Users/wendellbritt/The Library /mtgoa-manuscript/chapters/ch0-infinite-arcade/CHAPTER0_DRAFT.md
---

# SPEC — Ch0 Tutorial Immersion Pass

## Problem Statement

The Ch0 ideal reader readback identified that the middle third risks feeling like a game manual: useful systems explained before the reader is actively playing with them.

The emerging correction is not simply to cut onboarding. Ch0 is the onboarding for the game. The reader needs Token, Ticket, Three Games, Six Faces, character sheet, and BAR orientation before entering Ch1.

The acceptance problem is passive onboarding.

## Editorial Hypothesis

Ch0 will hold more onboarding if the reader applies each system to the live issue that made the book necessary.

Instead of teaching concepts in the abstract, Ch0 should establish one tutorial object:

**the allyship knot that drew the reader to buy the book**

Then each system becomes a control the reader tests against that issue.

Chapter spine:

**bring the thing -> learn the controls -> make the first move**

## Tutorial Object

Add a short passage before the systems onboarding begins, likely before or near `## You Are the Game Master`.

Candidate copy:

> Before we go further, bring one thing with you.
>
> Not the abstract reason you care about allyship. The actual situation that made this book feel necessary.
>
> A relationship you do not know how to repair. A room you keep trying to hold. A person you want to help but keep exhausting yourself around. A conflict where every available move feels wrong. A pattern in your own care that you are tired of repeating.
>
> Choose one.
>
> You do not have to solve it here. You do not even have to understand it yet. Just keep it nearby.
>
> We are going to use it to teach you the controls.

## Integration Requirements

### 1. Use One Live Issue Throughout

The chapter should not scatter the reader across many unrelated examples. It may use author examples and short illustrative moments, but the reader's primary practice should return to the same live issue.

### 2. Convert System Explanations Into Micro-Moves

Each major system should invite a small action:

| System | Micro-Move |
|---|---|
| Debt frame | What debt are you trying to retire through this situation? |
| Myths / six beliefs | Which private question is hiding inside this issue? |
| Henchmanship | Where have you stopped disagreeing because being useful felt safer than being honest? |
| Resistance to well-being | What would get harder if this actually got better? |
| Token System | What did this issue cost you: guilt, obligation, fear, love, clarity, anger, devotion, joy, time? |
| Ticket System | After engaging this issue, did you have more life available or less? |
| Three Games | What part was Chance? What part was Skill? What part was Passion? |
| Six Faces | Which Face showed up first? |
| BAR | Capture the moment you have been circling all chapter. |

### 3. Avoid Worksheet Feel

The micro-moves should feel like touching the controls, not filling out a workbook.

Guidelines:

- no numbered worksheet blocks unless the moment truly requires it
- keep most activities to one or two questions
- use white space sparingly and intentionally
- keep the tone conversational and slightly dangerous
- make the activities feel like the reader is being read, not managed

### 4. Preserve The Final BAR Door

The final BAR should remain the chapter's first explicit captured move.

The tutorial micro-moves can ask the reader to notice, locate, or hold an answer. They should not all become full BAR captures. The final BAR is where the issue becomes a saved move.

### 5. Cut Only After Tutorialization

Do not cut Token, Ticket, Three Games, or Six Faces solely because they are onboarding. First test whether they become immersive when tied to the live issue.

After tutorialization, cut:

- repeated explanation that the micro-move now makes unnecessary
- abstract claims that are already proven by the reader's own issue
- source-lineage repetition that slows the tutorial
- system details that belong in later chapters

## Acceptance Criteria

- [x] Ch0 invites the reader to bring the actual issue that made the book necessary.
- [x] Token System is applied to that issue as a felt cost.
- [x] Ticket System is applied to that issue as emotional payout or loss.
- [x] Three Games are applied to that issue as Chance / Skill / Passion.
- [x] Six Faces are introduced as capacities the reader can locate in the issue.
- [x] The final BAR clearly captures the issue the reader has been circling.
- [ ] The chapter feels like a tutorial level, not a manual.
- [x] The reader is asked to play before being asked to understand everything.
- [ ] The chapter does not become a worksheet.
- [ ] Any cuts are made after the playable tutorial frame is installed.

## Open Questions

- Where should the tutorial object enter: before `You Are the Game Master`, before `Token System`, or immediately after the allyship definition/myths section?
- How many micro-moves can Ch0 hold before it feels over-instructed?
- Should the final BAR explicitly say "use the issue you brought with you" or allow the reader to choose the hottest moment from the chapter?
- Does the tutorial object replace `Build Your Allyship Character`, or does it make that section land harder?

## Recommended Next Step

Implement a light tutorial pass in Ch0:

1. Insert the tutorial object. — DONE
2. Add one micro-move each to Token, Ticket, Three Games, and Six Faces. — DONE
3. Update the final BAR to reference the issue the reader has been carrying. — DONE
4. Then reread for cuts made unnecessary by the new playable structure. — NEXT

## Implementation Sync — 2026-06-03

Implemented in `/Users/wendellbritt/The Library /mtgoa-manuscript/chapters/ch0-infinite-arcade/CHAPTER0_DRAFT.md`.

Changes made:

- Added the tutorial object before `## The Myths That Keep You Playing the Wrong Game`.
- Added a private-question micro-move after the self-sabotage belief bargain.
- Added a henchmanship embodiment line: stopping disagreement because usefulness felt safer than honesty.
- Added a resistance-to-well-being micro-move: what would get harder if this actually got better?
- Added Token System micro-move: what has the issue been costing you?
- Added Ticket System micro-move: after engaging it, do you have more life available or less?
- Added Three Games micro-move: map Chance / Skill / Passion.
- Added Six Faces micro-move: which Face showed up first?
- Updated final BAR to use the thing carried through the chapter or a hotter recent moment.

Acceptance status:

- [x] Ch0 invites the reader to bring the actual issue that made the book necessary.
- [x] Token System is applied to that issue as a felt cost.
- [x] Ticket System is applied to that issue as emotional payout or loss.
- [x] Three Games are applied to that issue as Chance / Skill / Passion.
- [x] Six Faces are introduced as capacities the reader can locate in the issue.
- [x] The final BAR clearly captures the issue the reader has been circling.
- [ ] The chapter feels like a tutorial level, not a manual.
- [x] The reader is asked to play before being asked to understand everything.
- [ ] The chapter does not become a worksheet.
- [ ] Any cuts are made after the playable tutorial frame is installed.
