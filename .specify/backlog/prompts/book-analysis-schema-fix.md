# Spec Kit Prompt: Book Analysis Schema Fix

## Role

Fix the OpenAI structured-output schema error when running Book analysis (Trigger Analysis).

## Objective

Implement per [.specify/specs/book-analysis-schema-fix/spec.md](../specs/book-analysis-schema-fix/spec.md). Root cause: OpenAI requires every property in the schema to be in the `required` array; `allyshipDomain` was optional.

## Requirements

- **Fix**: Change `allyshipDomain` from `.optional().nullable()` to `.nullable()` in the analysis schema
- **Verification**: Trigger Analysis completes without "required is required to be supplied" error

## Deliverables

- [ ] Update src/actions/book-analyze.ts
- [ ] Test: Trigger Analysis on extracted book

## Reference

- Spec: [.specify/specs/book-analysis-schema-fix/spec.md](../specs/book-analysis-schema-fix/spec.md)
- Plan: [.specify/specs/book-analysis-schema-fix/plan.md](../specs/book-analysis-schema-fix/plan.md)
