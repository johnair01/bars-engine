# Quest Template Extraction Engine

Subsystem for extracting reusable quest templates from the normalized corpus.

## Spec

- [Quest Template Extraction Engine](../../../docs/architecture/quest-template-extraction-engine.md)
- [Quest Template API](../../../docs/architecture/quest-template-api.md)

## Structure

| Directory | Purpose |
|-----------|---------|
| `api/` | HTTP route handlers or service entry points |
| `services/` | Extraction logic, clustering, confidence scoring |
| `types/` | TypeScript types for templates, patterns, reports |
| `__tests__/` | Unit and integration tests |

## Integration

This subsystem sits between:

- **Upstream:** Corpus normalization, scoring rubric
- **Downstream:** AI generation, admin authoring, onboarding flows

## Note

The existing `actions/quest-templates.ts` and `lib/quest-templates.ts` serve hand-authored templates for the quest wizard. This feature is for **corpus-derived** templates from the extraction engine. Both can coexist.
