# Plan: The council's spec contract

primitives: ontology (the design ontology's output contract, made per-stage)
footing: ei-intake-lines, cf-footing-tripwire
tier: Convened; the spec contract binds faces, ontology and skills per stage; basis pass spec-contract-1_2026-10-28
scout: rung 2, we have it: council/spec-kit/, council/pipeline.yaml stages and skills_here.py already hold most of spec-kit; github/spec-kit's own CLI was weighed and not installed, since its templates and commands are the part we take
skills: six-faces, design-ontology, primitives, brief-master, scout
skipped: better - the ask was already deep; it named the three things to bind
skipped: intake_check - not a game or world brief

## Constitution check

| Article | Verdict | Why |
|---|---|---|
| 1 Questions go to the board | pass | the name was answered from the record (spk-name); the rest are positions |
| 2 The player comes first | n/a | not a game or world brief |
| 3 Primitives and footing | pass | lines above |
| 4 Ontology invariants | pass | fields filled; no person ranked, no consent inferred |
| 5 Cheapest proof first | pass | the check ran on ten folders before the templates changed |
| 6 Tool before build | pass | scout line above |
| 7 Something to see | pass | the matrix still on the board |
| 8 Reserved items | pass | faces.yaml untouched |
| 9 One session, one piece | pass | one thread; the next steps go to the callsheet |
| 10 Transcend and include | pass | the old templates' sections kept; older specs left as they are |

## Approach

Fold rather than add: spec-kit's stages are mapped onto the pipeline the council already runs, two missing stages
(clarify, analyze) are added where spec-kit puts them, and the constitution points at rules that already exist. The
alternative weighed was installing spec-kit's CLI and its slash commands; it would bring a second template set that
knows nothing of the faces or the board.

## Files touched

| File | Change |
|---|---|
| council/constitution.md | new: ten articles |
| council/pipeline.yaml | contract block; speckit, fills, articles on every stage; clarify and analyze |
| council/tools/contract_check.py | new: the analyze step |
| council/spec-kit/*.md | requirements, ontology, signatures, constitution check, numbered tasks |
| tests/test_contract_check.py | new |

## Order

1. The falsification run on the ten older folders.
2. pipeline.yaml contract, then the constitution, then the check.
3. Templates, then this folder as the first to keep the contract.

## What Wendell does, and when

His look on spk-contract-look-1, from the board. Nothing waits on it: the positions stand until he flips them.
