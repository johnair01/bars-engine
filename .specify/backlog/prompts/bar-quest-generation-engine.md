# Backlog Prompt: BAR → Quest Generation Engine v0

## Spec

- Spec: [.specify/specs/bar-quest-generation-engine/spec.md](../specs/bar-quest-generation-engine/spec.md)
- Plan: [.specify/specs/bar-quest-generation-engine/plan.md](../specs/bar-quest-generation-engine/plan.md)
- Tasks: [.specify/specs/bar-quest-generation-engine/tasks.md](../specs/bar-quest-generation-engine/tasks.md)

## Summary

Convert BARs (player inspiration artifacts) into structured, reviewable quest opportunities. Pipeline: BAR intake → eligibility → interpretation → emotional alchemy resolution → quest proposal → admin review → publication. Admin review required in v0.

## Key Deliverables

- **BAR eligibility**: status=active, title+description+allyshipDomain present, not already converted
- **Interpretation layer**: derive quest_type (resource, coordination, awareness, action, reflection), domain, tags
- **Emotional alchemy**: canonical grammar resolution; unresolved does not block
- **Quest proposals**: new model; review_status pending/approved/rejected/deferred
- **Admin UI**: list proposals, review, publish
- **Publication**: create CustomBar quest, link to campaign

## API Endpoints

- POST /bars/:bar_id/generate-quest-proposal
- GET /quest-proposals?status=pending
- POST /quest-proposals/:id/review
- POST /quest-proposals/:id/publish

## Dependencies

- Transformation Move Registry (FK)
- Quest Grammar (BY)
- Starter Quest Generator (DM)
