# Admin Template Composer API Layer

API entry points for the admin composer.

## Intended Contracts

- `listApprovedTemplates(params)` — List templates for composition
- `getTemplateDetails(templateId)` — Template details, constraints, placeholders
- `previewTemplateQuest(params)` — Generate preview without persisting
- `persistTemplateQuest(params)` — Save accepted quest
- `rejectTemplateQuest(draftId, reason)` — Reject with reason
- `regenerateTemplateQuest(draftId, updatedInputs)` — Regenerate with same template
- `createTemplateFromGoal(params)` — Goal-to-template creation
- `approveGoalTemplate(templateId, metadata)` — Approve goal-derived candidate
- `rejectGoalTemplate(templateId, reason)` — Reject goal-derived candidate

See [admin-template-composer-api.md](../../../docs/architecture/admin-template-composer-api.md) and [goal-to-template-creation.md](../../../docs/architecture/goal-to-template-creation.md).
