# Admin Template Composer

Admin-facing subsystem for composing quests from templates and creating templates from goals.

## Spec

- [Admin Template Quest Composer](../../../docs/architecture/admin-template-quest-composer.md)
- [Admin Template Composer API](../../../docs/architecture/admin-template-composer-api.md)
- [Goal-to-Template Creation](../../../docs/architecture/goal-to-template-creation.md)

## Structure

| Directory | Purpose |
|-----------|---------|
| `api/` | API entry points, route handlers |
| `services/` | Preview, persist, reject, regenerate; goal-to-template derivation |
| `components/` | Admin UI components (preview, forms, review actions) |
| `types/` | TypeScript types |
| `__tests__/` | Unit and integration tests |

## Entry Points

- **Compose From Template:** Select approved template → fill inputs → preview → accept/reject/revise
- **Create Template From Goal:** Define goal → generate candidate template → review → approve/reject

## Integration

- **Upstream:** [questTemplates](../questTemplates/), [questGeneration](../questGeneration/)
- **Downstream:** Validation, simulation, scoring, quest persistence
