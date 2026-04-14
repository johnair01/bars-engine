# Plan: campaignRef inventory audit

## Deliverables

| Artifact | Role |
|----------|------|
| [spec.md](./spec.md) | Taxonomy, FR, links |
| [tasks.md](./tasks.md) | Checklist + issue #40 |
| [docs/CAMPAIGNREF_INVENTORY.md](../../../docs/CAMPAIGNREF_INVENTORY.md) | Living document |
| [scripts/campaignref-inventory.ts](../../../scripts/campaignref-inventory.ts) | Regenerator |

## Order

1. Land spec + plan + tasks.
2. Add script + npm script + initial `CAMPAIGNREF_INVENTORY.md` (summary tables + generated block).
3. Review with Sage/Architect: order of migration from classification (separate issues).

## File impacts

- `package.json` — `campaignref:inventory`
- No production runtime behavior change.
