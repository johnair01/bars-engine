---
type: spec
tags:
  - mtgoa
  - ch3
  - ch4
  - challenger
  - regent
  - energy-ecology
  - personal-energy-economy
created: 2026-06-04
status: implemented
related:
  - [[CHAPTER_0_INFINITE_ARCADE]]
  - [[CHAPTER_2_SHAMAN]]
  - [[CHAPTER_3_CHALLENGER]]
  - [[CHAPTER_4_REGENT]]
  - [[SPEC_CH2_ENERGY_ECOLOGY_REPLACEMENT_2026-06-04]]
source_decision:
  - /Users/wendellbritt/The Library /mtgoa-manuscript/appendices/AD-2026-0522-001_ENERGY_ECONOMY.md
---

# SPEC — Ch3/Ch4 Energy Reconciliation

## Governing Doctrine

From the Ch0/Ch2 bridge:

> Personal energy economy is the meter. Energy ecology is the farm. Mastery is learning how to spend the meter in ways that make the farm more alive.

This means:

- **Personal energy economy** is allowed when it means the player's stamina meter: what a move costs me and whether I can afford it.
- **Energy ecology** is the field-level question: what does this move do to the living system over time?
- The rejected model is the numeric/scored framework: `+2/+1/-1`, `Transcend`, `Generative Translate`, `Control Translate`, and accounting language.

## Current Finding

Ch3 and Ch4 both still contain the rejected point-value model in their live surfaces.

### Ch3 Current Use

Ch3 uses energy to describe **available will**:

> The Challenger's practice has an energy economy — a set of named conversions that either generate or deplete the available will.

Then it lists:

- `Transcend moves (+2 energy)`
- `Generative Translate moves (+1 energy)`
- `Control Translate moves (−1 energy)`

Ch3's real underlying insight is not wrong. The useful question is:

> What does this move do to my capacity to draw the line cleanly and leave the field more honest?

The Challenger's energy is the energy of **charge becoming clean action**.

### Ch4 Current Use

Ch4 uses energy to describe **carrying something across time**:

> At Amber altitude, the energy question is: what does it cost to carry something across time?

Then it lists:

- `Transcend moves (+2 energy)`
- `Generative Translate (+1 energy)`
- `Control Translate (-1 energy)`

Ch4's real underlying insight is also not wrong. The useful question is:

> What does this move do to my capacity to carry, reform, and pass on the inheritance without disappearing into it?

The Regent's energy is the energy of **loyalty becoming stewardship**.

## Recommended Reconciliation

### Ch3: Will Ecology

Replace `The Energy Economy` with a sharper face-specific frame:

> ### The Will Ecology

Reader-facing doctrine:

> The Challenger does not ask whether a move generated points. The Challenger asks whether the fire became a clean line, a clean consequence, or smoke in the room.

Three categories:

1. **Replenishing moves**
   - Raw charge becomes clean action.
   - Outrage becomes a righteous act.
   - Fear of being unwelcome becomes willingness.
   - Grief in the fight becomes moral clarity.
   - Protective rage becomes calm defense.
   - Defiance becomes creation.

2. **Sustaining moves**
   - Channel shifts that keep the confrontation workable.
   - Line -> Interrupt
   - Interrupt -> Demand
   - Demand -> Refusal
   - Refusal -> Reckoning
   - These do not need to be framed as point-generating. They keep the will moving without letting the fire take over.

3. **Costly / depleting moves**
   - Charge -> Swallow
   - Charge -> Performative outrage
   - Charge -> Collapse
   - Charge -> Passive-aggression
   - These spend charge without protecting the line. They may discharge energy, but they do not return capacity.

Ch3 continuity line:

> Chapter 0 gave you the stamina meter. Chapter 2 taught you to ask what a move does to the field. The Challenger adds the fire question: did this charge become a line, or did it become smoke?

### Ch4: Stewardship Ecology

Replace `The Energy Economy` with:

> ### The Stewardship Ecology

Reader-facing doctrine:

> The Regent does not ask whether loyalty generated points. The Regent asks whether the thing you are carrying becomes more alive, more honest, and more receivable over time.

Three categories:

1. **Replenishing moves**
   - Obedience -> True Allegiance
   - Duty -> Service
   - Rigidity -> Integrity
   - Dogma -> Faithfulness
   - Inheritance-Shame -> Inheritance-Gift
   - These are replenishing because they convert compulsory carrying into chosen stewardship.

2. **Sustaining moves**
   - Custodian -> Reformer
   - Inheritor -> Teacher
   - Teacher -> Keeper of Vows
   - These keep the inheritance moving across time without freezing it in place.

3. **Costly / depleting moves**
   - Loyalty -> Compliance
   - Duty -> Martyrdom
   - Tradition -> Dogma
   - Role -> Mask
   - These spend the self to preserve the form. They may look loyal, but they make the inheritance less alive.

Ch4 continuity line:

> Chapter 0 gave you the stamina meter. Chapter 2 taught you to ask what a move does to the field. The Regent adds the stewardship question: does this way of carrying make the inheritance more alive, or does it preserve the form while draining the life?

## Recap Cleanup

Ch3 recap should replace:

> The **energy economy** — which moves generate (+2, +1) and which deplete (−1)

with:

> The **will ecology** — which moves turn charge into a clean line, which keep the confrontation workable, and which spend fire without protecting anything

Ch4 transition should replace:

> Everything up to now — the channels, the stages, the energy economy — that was preparation.

with:

> Everything up to now — the channels, the stages, the stewardship ecology — that was preparation.

## Surface Sync Warning

Ch3 Book OS and manuscript export currently differ in the energy section:

- Book OS has the five conversion bullets expanded inline.
- Manuscript export compresses those five conversions into one paragraph.

Ch4 Book OS and manuscript export also differ slightly:

- Book OS has the five conversion bullets expanded inline.
- Manuscript export compresses the same conversions into one paragraph.

Before implementing, choose one surface as canonical for each chapter or apply the same revised section to both surfaces deliberately.

## Acceptance Criteria

- [x] Ch3 no longer uses `The Energy Economy` as a section heading.
- [x] Ch3 no longer uses `+2/+1/-1`, `Transcend`, `Generative Translate`, or `Control Translate` in body prose.
- [x] Ch3 reframes energy as will ecology: charge becoming clean action, workable confrontation, or smoke.
- [x] Ch3 recap no longer references numeric energy economy.
- [x] Ch4 no longer uses `The Energy Economy` as a section heading.
- [x] Ch4 no longer uses `+2/+1/-1`, `Transcend`, `Generative Translate`, or `Control Translate` in body prose.
- [x] Ch4 reframes energy as stewardship ecology: loyalty becoming chosen carrying, ongoing transmission, or self-erasing preservation.
- [x] Ch4 transition into the Gates references stewardship ecology instead of energy economy.
- [x] Ch3 and Ch4 remain consistent with Ch0 personal energy economy and Ch2 energy ecology.
- [x] Appendix C does not need new terms unless `Will Ecology` and `Stewardship Ecology` become durable named concepts.

## Implementation Sync — 2026-06-04

Ch3 implemented in:

- `/Users/wendellbritt/The Library /The Library/07 Book OS/07 Book OS/CHAPTER_3_CHALLENGER.md`
- `/Users/wendellbritt/The Library /mtgoa-manuscript/chapters/ch3-CHALLENGER/CHAPTER3_CHALLENGER_FULL_DRAFT.md`
- `/Users/wendellbritt/The Library /The Library/manuscripts/chapters/ch3-CHALLENGER/CHAPTER3_CHALLENGER_FULL_DRAFT.md`

Changes made:

- Replaced `The Energy Economy` with `The Will Ecology`.
- Removed numeric scoring and old move labels from the live Ch3 chapter surfaces.
- Preserved the five charge conversions as replenishing will moves.
- Reframed channel shifts as sustaining will moves.
- Reframed swallow / performative outrage / collapse / passive-aggression as spending fire without protecting anything.
- Updated the Gates transition and recap bullet.

Ch4 implemented in:

- `/Users/wendellbritt/The Library /The Library/07 Book OS/07 Book OS/CHAPTER_4_REGENT.md`
- `/Users/wendellbritt/The Library /mtgoa-manuscript/chapters/ch4-REGENT/CHAPTER4_REGENT_FULL_DRAFT.md`
- `/Users/wendellbritt/The Library /The Library/manuscripts/chapters/ch4-REGENT/CHAPTER4_REGENT_FULL_DRAFT.md`

Changes made:

- Replaced `The Energy Economy` with `The Stewardship Ecology`.
- Removed numeric scoring and old move labels from the live Ch4 chapter surfaces.
- Preserved the five loyalty conversions as replenishing stewardship moves.
- Reframed inheritance-mode transitions as sustaining stewardship moves.
- Reframed compliance / martyrdom / dogma / mask as spending the self to preserve the form.
- Updated the Gates transition.

## Recommendation

Implement Ch3 first.

Reason: Ch3 is the direct next chapter after Shaman, and the line/fire language makes the new doctrine easiest to test. If Ch3 lands, Ch4 can borrow the same structure without feeling templated because its face-specific question changes from fire/line to loyalty/stewardship.
