# Prompt: Admin CYOA Preview, DRAFT-Only, New Passage Wizard

**Use when implementing admin preview for DRAFT adventures, DRAFT-only extensions, and New Passage wizard.**

## Prompt (API-First)

> **API-first, deft**: (1) **Preview**: `?preview=1` + admin → bypass ACTIVE; play page, API, AdventurePlayer, admin link. (2) **Status**: All adventure-creation → `status: 'DRAFT'`; append sets DRAFT. (3) **Form**: Extend `createPassage` with `linkFrom`; shared `ChoiceBuilder` (Create + Edit); enhance CreatePassageForm with Connect from section. No wizard—single form with sections. Spec: [.specify/specs/admin-cyoa-preview-draft-wizard/spec.md](../../specs/admin-cyoa-preview-draft-wizard/spec.md).

## Reference

- [spec](../../specs/admin-cyoa-preview-draft-wizard/spec.md) | [plan](../../specs/admin-cyoa-preview-draft-wizard/plan.md) | [tasks](../../specs/admin-cyoa-preview-draft-wizard/tasks.md)
