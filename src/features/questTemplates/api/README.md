# Quest Template API Layer

API entry points for the template extraction engine.

## Intended Contracts

- `extractTemplates(params)` — Run extraction
- `listTemplates(params)` — List with filters
- `getTemplate(id)` — Get one template
- `approveTemplate(id, metadata)` — Approve candidate
- `rejectTemplate(id, reason)` — Reject candidate
- `getExtractionReport(extractionId?)` — Report summary

See [quest-template-api.md](../../../docs/architecture/quest-template-api.md).

## Implementation

May be implemented as:

- Next.js API routes under `/api/quest-templates/`
- Server actions in `actions/`
- Direct service calls from admin tooling
