# Spec: The council's spec contract

game: no
intake: not a game or world brief (a process for every council move; the games it shapes run the intake themselves)

## The ask

> "https://github.com/github/spec-kit Need to fold this discipline into the 6 face game master councils most
> importantly I want to use this discipline to create another formal way to integrate the 6 game masters the design
> ontology and the game studio skills into a contract that makes the moves More consistent" (Wendell, 2026-10-28,
> project thread "Fold spec-kit discipline into the council")

**Who it is for:** every session that runs a council move, and Wendell, who reads what those moves produce.
**What they feel now, and what should change:** the rules exist, but they live in eight places and each thread
meets them one at a time; he steers by catching the step a thread skipped. One contract, checked by a tool, should
catch the skip before he does.

## Purpose

Bind the six faces, the design ontology and the studio skills into one stage contract, in the shape spec-kit gives:
a constitution every plan checks, stages that each name who signs, what ontology fields they fill and which skills
they load, and an analyze step that reads the three files before a line is built.

## User stories

### A session starts a feature

**As a session**, I want the templates and one check to tell me which face signs, which fields and which skills each
stage owes, so the move runs the same way every time.
**Acceptance:** `python3 council/tools/contract_check.py <folder>` names every gap by stage, and exits 0 on a folder
that keeps the contract.

### Wendell reads a result

**As Wendell**, I want a move to arrive with its constitution check and signatures already done, so I steer the
design rather than the process.
**Acceptance:** the board carries the contract as positions and one look at the stage matrix.

## Requirements

- **FR-001** `council/constitution.md` gathers the council's standing rules as numbered articles, each naming its
  home, its guarding face, its check and its stages, without restating the rule.
- **FR-002** Each stage in `council/pipeline.yaml` names its spec-kit command, owners, ontology fields and articles;
  the new stages `clarify` (the reach test) and `analyze` (the check) sit where spec-kit puts them.
- **FR-003** `council/tools/contract_check.py` fails a spec folder that breaks the contract and prints the matrix.
- **FR-004** The spec-kit templates carry the new sections: requirements, ontology, signatures, constitution check,
  footing lines, numbered tasks and the proof line.
- **FR-005** The proposal reaches the board as positions and a look, with no ask in chat.

## Design decisions

| Decision | Choice | Whose |
|---|---|---|
| Where the contract lives | In `council/pipeline.yaml`, beside the stages it binds, not a second file | council |
| Constitution | Pointers to the rules' homes, not copies; amended only by his ruling | council; faces.yaml precedent |
| Field owners | The faces `docs/experience-intake.md` already gives each ontology field | the record (2026-10-27) |
| spec-kit's clarify | The reach test, with every surviving question as a board row | CLAUDE.md board rule |
| Older specs | Not checked; the contract binds specs written from 2026-10-28 | council |

## Contracts

`contract_check.py <folder> [--through <stage>]` exits 0 or 1 and prints one line per problem, `<stage> <problem>`.
`--matrix` prints the stage table. pipeline.yaml `contract.field_owners` maps each ontology field to one face.

## Ontology

- `design_intent`: moves arrive the same way every time, so Wendell's attention goes to the design and not the process.
- `intrinsic_pleasure`: n/a: a process for sessions; the pleasure is his relief at not having to steer.
- `ontology_objects`: the eleven output fields become per-stage obligations; no new ontology object is added.
- `mechanical_claims`: a stage is done when its owners sign and its fields are filled; the check is the only gate it adds.
- `aqal_attention`: It (the check and files), We (faces signing), I (his steering load) held; Its left to the steward.
- `agency_and_consent`: he can flip any position; articles change only by his ruling.
- `evidence_and_unknowns`: of ten existing spec folders, five have no plan or tasks; none name a face per stage or an ontology field. Unknown: whether threads will fill it or pad it.
- `provenance_effects`: every article cites the rule's home and date; nothing is restated, so the record stays one source.
- `risks_and_tests`: risk of ceremony: a check that every folder passes with boilerplate. Test below.
- `implementation_translation`: one Python check, yaml keys on existing stages, template sections; no new service.
- `decision_or_open_authority`: no question; positions stand and his look on spk-contract-look-1 is the gate.

## Reserved items

There are none: `council/faces.yaml` is not changed.

## How we will know it failed

- **The cheap test, run before building:** run the check on the ten existing spec folders; it should fail every one on
  real gaps (missing plan, no face per stage), not on formatting. Result 2026-10-28: all ten fail; five lack plan and
  tasks, the other five fail on missing signatures, fields, footing and the constitution check.
- **The result that stops the work:** if the next three features pass the check with boilerplate fields (the same
  sentence in every folder) the check is ceremony; the steward's retro on 2026-11-15 reads them and retires it.

## Definition of done

- [x] `tests/test_contract_check.py` passes.
- [x] This folder passes its own check.
- [ ] Wendell's look on spk-contract-look-1 says yes, or names what to change.

## Signed

- intake: shaman, diplomat (2026-10-28)
- spec: architect, regent (2026-10-28)
- clarify: sage (2026-10-28)
- falsify: challenger (2026-10-28)
- plan: architect, regent (2026-10-28)
- analyze: sage, challenger (2026-10-28)
