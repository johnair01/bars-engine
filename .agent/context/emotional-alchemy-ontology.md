---
description: Emotional alchemy moves and derivation rules for Quest Grammar. Energy economy, not morality. 5 elements, WAVE, 15 canonical moves.
---

# Emotional Alchemy Ontology

The Quest Grammar compiles unpacking answers into a narrative arc. **Emotional alchemy** is the core move grammar—an **energy economy**, not a morality wheel. Control moves are high-cost precision moves (stabilizing, defensive, protective, catalytic), not bad moves.

## 5 Elements + Lessons (canonical)

| Element | Channel | Lesson |
|---------|---------|--------|
| Metal | Fear | Risk or opportunity detected. Excitement = Fear interpreted as opportunity. |
| Water | Sadness | Something I care about is distant or misaligned. |
| Wood | Joy | Vitality detected. |
| Fire | Anger | Obstacle present OR boundary violated. |
| Earth | Neutrality | Whole-system perspective / detachment. |

**Onboarding mapping**: Confusion → Metal. Expectation violation → Fire.

## WAVE progression per element

Each element supports four stages. Translation (element-to-element) may only occur **after** Show stage is complete.

| Stage | Meaning | Narrative behavior |
|-------|---------|-------------------|
| Wake | Notice signal | Detect emotional activation |
| Clean | Correct distortion | Clarify boundary, risk, meaning |
| Grow | Extract lesson | Integrate insight |
| Show | Act aligned with lesson | Execute move |

## 15 Canonical Moves

### Transcend (vertical completion) — Energy +2

Complete WAVE within same element.

| Move | Element | Narrative |
|------|---------|-----------|
| Step Through (Excitement) | Metal | Fear → opportunity |
| Reclaim Meaning | Water | Sadness → value restored |
| Commit to Growth | Wood | Joy → sustained vitality |
| Achieve Breakthrough (Triumph) | Fire | Anger → boundary honored |
| Stabilize Coherence | Earth | Neutrality → system clarity |

### Generative translate (flow cycle) — Energy +1

Cycle: Wood → Fire → Earth → Metal → Water → Wood. Natural forward movement.

| Move | From → To | Narrative |
|------|-----------|-----------|
| Declare Intention | Wood → Fire | Momentum into action |
| Integrate Gains | Fire → Earth | Action into structure |
| Reveal Stakes | Earth → Metal | Structure into clarity |
| Deepen Value | Metal → Water | Clarity into meaning |
| Renew Vitality | Water → Wood | Meaning into vitality |

### Control translate (high-cost precision) — Energy -1

Control cycle: Wood↔Earth, Fire↔Metal, Earth↔Water, Metal↔Wood, Water↔Fire. NOT negative—protective, catalytic, strategic pivots. Higher friction, higher mastery requirement.

| Move | From → To | Positive intention |
|------|-----------|-------------------|
| Consolidate Energy | Wood → Earth | Ground enthusiasm; prevent overextension |
| Temper Action | Fire → Metal | Reassess risk after bold action |
| Reopen Sensitivity | Earth → Water | Soften rigid structure; reconnect meaning |
| Activate Hope | Metal → Wood | Convert fear into forward momentum |
| Mobilize Grief | Water → Fire | Turn sadness into boundary-setting |

## Binary moves (legacy / Epiphany Bridge)

| Move | Meaning | When it applies |
|------|---------|-----------------|
| **translate** | Work within current frame. Integrate without shifting level. | Lower shadow density; more satisfaction |
| **transcend** | Cross threshold. Include lower in higher frame. Structural shift. | Higher shadow density; more dissatisfaction; self-sabotage blocks translation |

## Derivation rules

From multi-select **satisfaction** (Q2), **dissatisfaction** (Q4), **self-sabotage** (Q6):

1. **Shadow score**: Count of distinct self-sabotage beliefs. More shadows → transcend.
2. **Satisfaction score**: Count of satisfaction states. More satisfaction → translate.
3. **Dissatisfaction score**: Count of dissatisfaction states. More dissatisfaction → transcend.
4. **Balance**: If shadow + dissatisfaction > satisfaction → transcend-dominant. Else → translate-dominant.

### Per-node assignment (Epiphany Bridge)

Default: `['translate','translate','translate','translate','transcend','transcend']`. Transcend-dominant shifts more nodes to transcend earlier.

## Mastery and completion rules

| Quest move type | Completion | Implementation |
|-----------------|------------|----------------|
| **Wake Up** | Choice-based. Orientation, teaching. Pass on passage reach. | No required inputs on end passage. |
| **Show Up** | Action-based. Pass by taking action. | End passage MUST have required attestation input; completion blocked until submitted. |

Quest threads end with action. Wake Up quests are the exception.

**Twee author guidance**: For Show Up quests, end passages need `[BIND input_action_attestation required]` or equivalent so PassageRenderer blocks completion until the player submits the action attestation. Wake Up quests: no required inputs on end passage.

## Onboarding emotional scaffolding

Emotional alchemy is the scaffolding for onboarding. Story progresses with emotional beats across story/game logic. As onboarding is edited, passages align to WAVE stages and elements.

## Schema / Code

- **Types**: `MovementType`, `EmotionalChannel` in `src/lib/quest-grammar/types.ts`
- **Elements**: `src/lib/quest-grammar/elements.ts` — element-channel mapping
- **Move engine**: `src/lib/quest-grammar/move-engine.ts` — 15 moves config, energy deltas
- **Derivation**: `deriveMovementPerNode()` in `src/lib/quest-grammar/emotional-alchemy.ts`
- **Consumers**: `compileQuest`, AI prompts, publishQuestPacketToPassages

## Reference

- [quest-grammar-ux-flow spec](../../.specify/specs/quest-grammar-ux-flow/spec.md)
- [questGrammarSpec.md](../../src/lib/quest-grammar/questGrammarSpec.md)
- [transcend_include_analysis.md](transcend_include_analysis.md)
