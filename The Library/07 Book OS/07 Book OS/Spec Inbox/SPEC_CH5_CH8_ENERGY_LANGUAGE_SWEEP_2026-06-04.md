---
title: Ch5-Ch8 Energy Language Sweep
date: 2026-06-04
status: implemented
chapters: [5, 6, 7, 8]
related:
  - SPEC_CH3_CH4_ENERGY_RECONCILIATION_2026-06-04
  - SPEC_CH2_ENERGY_ECOLOGY_REPLACEMENT_2026-06-04
---

# Ch5-Ch8 Energy Language Sweep

## Purpose

Bring Chapters 5-8 into continuity with the Ch0-Ch4 decision that the book should not use a numeric energy economy as its main teaching structure.

The global frame remains:

- **Personal energy economy**: the player's local stamina meter, introduced in Ch0 through the farming-game metaphor.
- **Energy ecology**: the living-field question introduced in Ch2 and carried locally through Ch3-Ch4 as will ecology and stewardship ecology.
- **Capacity language**: later chapters can name moves as sustaining or costly without reinstalling point totals.

## Implemented Changes

### Chapter 5: Architect

Changed the lingering table header **Transcend Outcome** to **Integrated Outcome**.

Rationale: Ch5 did not need a new ecology section. The chapter already works through structure, diagnosis, and integration. The cleanup prevents the old mechanic from reappearing as a formal label.

### Chapter 6: Diplomat

Replaced the remaining **Transcend 1 / Transcend 2** labels with **Alchemy 1 / Alchemy 2**.

Replaced **The Transcend alchemy / The Transcend move** with **The alchemy**.

Replaced numeric energy-cost statements with capacity language:

- Sustaining move: charge becomes contact instead of withdrawal.
- Costly move: containment, staying, repair, closing, and discernment spend real capacity and should be named.

Rationale: Diplomat is about relational terms. It needs to preserve the truth that certain moves cost more, but the chapter should not feel like it is tracking points. The reader should feel the ecology of contact, containment, repair, and agreement.

### Chapter 7: Sage

Replaced **Transcend Move 1-5** with **Alchemy Move 1-5**.

Removed **Transcend** from the dissatisfaction-to-satisfaction labels.

Replaced **The Transcend move:** with **The alchemy:**.

Rationale: Sage did not have numeric energy scoring, but the old formal label implied the previous mechanic. The revised language keeps the emotional alchemy while fitting the current book architecture.

### Chapter 8: Player

No live changes needed.

Rationale: Current Ch8 surfaces did not contain the old Transcend labels or numeric energy-cost language.

## Surfaces Updated

- Book OS chapter containers
- `mtgoa-manuscript` chapter drafts
- `The Library/manuscripts` chapter mirrors

## Acceptance Check

Live Ch5-Ch8 files should no longer contain:

- `Transcend Outcome`
- `Transcend Move`
- `[DISSATISFACTION → SATISFACTION] Transcend`
- `The Transcend`
- `Energy cost`
- `generative translate`
- `Control structure`

