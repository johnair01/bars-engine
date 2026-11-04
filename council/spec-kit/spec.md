# Spec: [Feature name]

<!-- The six-faces pipeline's spec template. Stages and owners: council/pipeline.yaml.
     In a repo with its own template (bars-engine's .specify/spec-template.md), use that one and add
     the three council sections: The ask, Whose decision, and How we will know it failed.
     The stage contract (who signs, which ontology fields, which skills) is council/pipeline.yaml `contract`;
     the articles are council/constitution.md; `python3 council/tools/contract_check.py <this folder>` is the analyze step.
     An open question is written [NEEDS CLARIFICATION: <what> | board: <row id>] once the reach test has put it on the
     board; a marker with no row fails the check. -->

game: no                     <!-- yes for game or world design; then the next line names the callsheet's Intake -->
intake: not a game or world brief ([why])

## The ask

> [Wendell's words, quoted, with the date and where he said it.]

**Who it is for:** [the person who will use it, named by role]
**What they feel now, and what should change:** [the Shaman's read, in one or two sentences]

## Purpose

[One to three sentences: what this feature does and why.]

## User stories

### [Title]

**As a [role]**, I want [goal], so [benefit].
**Acceptance:** [what a person will see when it works]

## Requirements

- **FR-001** [The system or the council does something a person can check.]

## Design decisions

| Decision | Choice | Whose |
|---|---|---|
| [topic] | [choice and reason] | Wendell (cite) / [source] / council |

## Contracts

[Routes, actions, data shapes, before any screen is built. Leave out when the feature has none.]

## Ontology

<!-- The design ontology's output contract (.claude/skills/design-ontology/SKILL.md). The face named owns the line.
     A field that does not apply says `n/a: <why>`. -->

- `design_intent`: [Diplomat]
- `intrinsic_pleasure`: [Shaman]
- `ontology_objects`: [Sage]
- `mechanical_claims`: [Architect]
- `aqal_attention`: [Shaman]
- `agency_and_consent`: [Diplomat]
- `evidence_and_unknowns`: [Sage]
- `provenance_effects`: [Regent]
- `risks_and_tests`: [Challenger]
- `implementation_translation`: [Architect]
- `decision_or_open_authority`: [Regent; the only field that may escalate, after the reach test]

## Reserved items

[Money, a live paywall, prose, a person's name, consent. Each one listed here is a board question, never
a decision made in this spec. Write "None" when there are none.]

## How we will know it failed

- **The cheap test, run before building:** [what to run, and what it should show]
- **The result that stops the work:** [what would make the council drop or rethink the design]

## Definition of done

- [ ] [checks the repo runs]
- [ ] [what a person sees on the preview]
- [ ] [anything only Wendell can confirm; it goes on his steps list]

## Signed

<!-- One line per stage reached, naming every owner in council/pipeline.yaml. -->

- intake: shaman, diplomat ([date])
