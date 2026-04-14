# Plan: Book → CYOA Stewardship

## Phases

### Phase A — 1st party (now)

1. Author **steward runbook** (markdown under `docs/` or `.specify/specs/book-cyoa-stewardship/` — single canonical path).
2. Define **attribution UI/copy contract** (component props or content schema).
3. Select **one pilot** adaptation; track in `tasks.md`.
4. Ship pilot behind normal campaign/CYOA flows; collect internal sign-off.

### Phase B — Third party (after gate)

1. Licensing checklist + permission workflow doc.
2. Optional: admin or steward UI for “external source record.”
3. Pitch materials template (out of engine if needed).

## File impacts

| Deliverable | Location |
|-------------|----------|
| Runbook | `docs/book-cyoa-stewardship-runbook.md` (or `stewardship-runbook.md` in this spec folder) |
| Attribution | React components or narrative template fields as pilot requires |
| Pilot | Existing CYOA/composer/adventure pipelines — no new stack unless pilot demands |

## Related specs

- [walkable-sprite-pipeline-demo](../walkable-sprite-pipeline-demo/spec.md) — unrelated; parallel track.
- [campaign-ontology-alignment](../campaign-ontology-alignment/spec.md) — where adaptation initiatives attach.
