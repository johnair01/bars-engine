# Plan: Encounter Slot Context Schema

## Overview

Extend `PassageSlot` and `GenerateOptions` with structured context fields so GM agents can generate grammatically correct campaign encounters. Three phases: (1) types + seed data (no AI), (2) backend contract + admin UI, (3) full agent wiring.

## Phase 1 — Types + Seed (No AI, No Schema Change)

Extend TypeScript interfaces and seed templates. Pure in-memory / JSON change — no Prisma migration.

**Files touched:**
- `src/lib/template-library/index.ts` — PassageSlot + GenerateOptions + SlotContextKey + getPlaceholderForSlot update
- `scripts/seed-adventure-templates.ts` — add slot context to encounter-9-passage; add gather-resources-encounter

**Deliverable**: Generating from `gather-resources-encounter` produces face-specific placeholders that include `campaignFunction` text.

## Phase 2 — Backend Contract + Admin UI

Stub the generation endpoint; expose campaign context inputs in admin UI.

**Files touched:**
- `src/lib/template-library/index.ts` — EncounterGenerationContext type; contentPerSlot param
- `backend/app/routes/` — new `generate_encounter_passages` route (stub)
- `src/app/admin/templates/` — "Generate with AI" button + campaign context inputs

**Deliverable**: Admin can fill in `campaignGoal`, `kotterStage`, `blockers` → click "Generate with AI" → passages populated from backend stub.

## Phase 3 — GM Agent Wiring (AI)

Wire backend agents to slot grammar. Seed remaining domain templates.

**Files touched:**
- `backend/app/agents/` — shaman, challenger, diplomat, regent, architect — consume slot context
- `scripts/seed-adventure-templates.ts` — RAISE_AWARENESS, DIRECT_ACTION, SKILLFUL_ORGANIZING templates

**Deliverable**: Full AI generation per slot, routed by `gameMasterFace`, using campaign + player context.

## Dependencies

- template-library-gm-placeholders ✅ Done
- game-master-template-content-generation (Phase 2 = this Phase 3)
- backend GM agents (already exist, need context consumption wiring)
- portal-path-hint-gm-interview (hexagramTone input source)

## File Impact Summary

| File | Phase | Action |
|------|-------|--------|
| `src/lib/template-library/index.ts` | 1, 2 | Extend PassageSlot, GenerateOptions, add EncounterGenerationContext |
| `scripts/seed-adventure-templates.ts` | 1, 3 | Add slot context + new domain templates |
| `backend/app/routes/` | 2 | Add generate_encounter_passages endpoint |
| `src/app/admin/templates/` | 2 | Campaign context inputs + Generate with AI button |
| `backend/app/agents/` | 3 | Consume slot context in each agent |
