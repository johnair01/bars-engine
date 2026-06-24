# Trigram Archetype Gap Resolution

## Summary

Calrunia's eight trigram archetypes need explicit inner/outer expression, developmental maturity, hexagram position, and nation-to-sect intersection layers. These additions turn trigrams from flat archetype labels into stateful interpretive objects that can support Inner Garden NPC seed data and autonomous agent behavior.

## Why This Exists

Autonomous NPCs need a difference between what they are carrying internally, what they express outwardly, how mature their expression is, and how their nation identity colors their sect training. Without these layers, NPCs behave like static archetype masks instead of agents with discernible inner weather and situational behavior.

## Ontological Role

- Trigram archetype: a canonical sect energy with inner mode, outer mode, and developmental spectrum.
- Hexagram position: the situational role a trigram plays in a draw.
- Nation x sect intersection: the character texture created when origin culture and chosen practice path combine.

## Non-Negotiable Rules

- Additive only: do not remove existing archetype or manifesto content.
- Upper trigram is Calrunia's presenting or outwardly legible force in a situation.
- Lower trigram is Calrunia's motivating, grounding, or driving force beneath the visible expression.
- Developmental stage is not shadow/light morality; it is young/forming versus developed/full expression.
- Nations and sects remain distinct systems: nations are origin/emotional channel, sects are study/practice path.

## Required User Outcomes

- Players and authors can read each archetype as both inner state and outer expression.
- NPC authors can seed young and developed examples of every sect.
- Inner Garden hexagram draws can distinguish Heaven over Earth from Earth over Heaven.
- Nation identity and sect training can be combined without collapsing into one ontology.

## Acceptance Criteria

- All eight handbook archetype files have Inner Expression and Outer Expression sections.
- All eight handbook archetype files have Developmental Spectrum sections with Young / Forming and Developed / Full Expression.
- The Inner Garden NPC advocate manifestos have Hexagram Positions sections.
- The Inner Garden NPC advocate manifestos document their Earlier Heaven natural opposition pair.
- The Fire/Water and Mountain/Lake natural opposition stubs are documented.
- A nation x sect intersections document exists with the eight priority seed entries.
- bars-engine architecture docs explain the canonical positional read.
- Engine-facing archetype profile data exposes inner/outer and developmental hooks without breaking existing consumers.

## Non-Goals

- Do not implement the full 40-entry nation x sect matrix in this pass.
- Do not implement the full 28 cross-sect relationship matrix in this pass.
- Do not alter production database schema.
- Do not change Render or Vercel runtime configuration.
