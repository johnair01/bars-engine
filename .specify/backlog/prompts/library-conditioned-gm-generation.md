# Spec Kit Prompt: Library-conditioned Game Master generation

## Role

You are a Spec Kit agent implementing **retrieval-conditioned** passage generation for the six Game Master faces.

## Objective

Implement per [.specify/specs/library-conditioned-gm-generation/spec.md](../specs/library-conditioned-gm-generation/spec.md). Follow [tasks.md](../specs/library-conditioned-gm-generation/tasks.md) in order.

## Checklist (API-First Order)

- [ ] API contract: optional `LibraryConditioningInput` on generate-passage / `_generate_slot`
- [ ] Internal `retrieveLibraryExcerpts` + chunk parity note vs `src/lib/book-chunker.ts`
- [ ] `LIBRARY_USE_POLICY` prompt block (cite-or-silence)
- [ ] Tests: golden traces + pytest smoke
- [ ] `docs/AGENT_WORKFLOWS.md` update
- [ ] Phase B only: Prisma migration + admin UI per spec

## Deliverables

- [ ] `.specify/specs/library-conditioned-gm-generation/` (spec, plan, tasks — may already exist)
- [ ] Backend retrieval + route changes
- [ ] Optional: cert `cert-library-conditioned-gm-v1`

## Game Language

BARs four moves, Kotter, nations, allyship domains — generation must stay **BARs-native**; retrieved excerpts may be **tabletop-prep** style but must not **override** ontology with unrelated RPG mechanics unless verbatim in excerpts.
