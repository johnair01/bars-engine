# Quest Generation API Layer

API entry points for template-conditioned quest generation.

## Intended Contracts

- `generateQuestFromTemplate(params)` — Generate from approved template
- `getTemplateConstraints(templateId)` — Return constraints for clients
- `validateGeneratedFlow(flow, templateId)` — Validate without persisting
- `previewGeneration(params)` — Generate draft for admin review

See [template-conditioned-generation-api.md](../../../docs/architecture/template-conditioned-generation-api.md).

## Implementation

May be implemented as:

- Next.js API routes under `/api/quest-generation/`
- Server actions
- Direct service calls from admin tooling
