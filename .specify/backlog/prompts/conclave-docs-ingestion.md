# Spec Kit Prompt: Conclave Docs Ingestion

## Role

You are a Spec Kit agent implementing the Sage-powered Conclave docs ingestion pipeline. API-first, testable, deft.

## Objective

Implement the Conclave Docs Ingestion per [.specify/specs/conclave-docs-ingestion/spec.md](../specs/conclave-docs-ingestion/spec.md). The pipeline sends design docs (Orb Encounter Grammar, Orb Triadic Twee Generator, Bridge Scenario Engine, Onboarding Storytelling Grammar) to the Sage for analysis and writes structured output for spec kit updates.

## Prompt

> Implement Conclave Docs Ingestion per [.specify/specs/conclave-docs-ingestion/spec.md](../specs/conclave-docs-ingestion/spec.md). Create `scripts/conclave-analyze.ts` that reads .md and .twee from a path, calls `POST /api/agents/sage/consult` with a structured prompt, and writes analysis to `.specify/plans/conclave-analysis-{date}.md`. Add `npm run conclave:analyze`. Docs are in `.specify/fixtures/conclave-docs/`. Ensure script works when backend is running; fail gracefully with clear message when backend is down. Spec: [path].

## Requirements

- **Input:** Path to Conclave docs (default: `.specify/fixtures/conclave-docs`)
- **Process:** Read docs → build prompt → call Sage → write output
- **Output:** `.specify/plans/conclave-analysis-{YYYYMMDD}.md`
- **Testable:** Script runs; output file exists

## Checklist

- [x] Create `scripts/conclave-analyze.ts`
- [x] Add `npm run conclave:analyze`
- [x] Copy docs to `.specify/fixtures/conclave-docs`
- [ ] Run with backend; verify output
- [ ] Add unit test (mock fetch)

## References

- Spec: [.specify/specs/conclave-docs-ingestion/spec.md](../specs/conclave-docs-ingestion/spec.md)
- Plan: [.specify/specs/conclave-docs-ingestion/plan.md](../specs/conclave-docs-ingestion/plan.md)
- Summary: [.specify/specs/conclave-docs-ingestion/SUMMARY_AND_INTEGRATION.md](../specs/conclave-docs-ingestion/SUMMARY_AND_INTEGRATION.md)
- Existing Orb spec: [.specify/specs/orb-encounter-grammar/spec.md](../specs/orb-encounter-grammar/spec.md)
