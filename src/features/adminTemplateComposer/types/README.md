# Admin Template Composer Types

TypeScript types for the admin composer.

## Intended Types

- `ComposerInputs` — Generation input fields
- `PreviewResult` — Flow + validation_report + simulation_report + score_summary
- `PersistParams` — Flow, provenance, campaign_attachment, mode
- `GoalInput` — Goal input contract (current_state, target_state, required_action, etc.)
- `GoalToTemplateResult` — Candidate template from goal
- `TemplateSummary` — List view for template selector

See [admin-template-composer-api.md](../../../docs/architecture/admin-template-composer-api.md) and [goal-to-template-creation.md](../../../docs/architecture/goal-to-template-creation.md) for payload shapes.
