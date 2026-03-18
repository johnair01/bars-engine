# Plan: Game Master Template Content Generation

## Overview

Wire GM agents to template-based content generation. Phased: (1) manual flow with campaignRef, (2) AI per slot via backend, (3) orientation wiring.

## Phase 1: Manual Flow (No AI)

- Implement template-library-gm-placeholders
- Extend `generateFromTemplate(templateId, options?)` with `options.campaignRef?: string`
- Admin templates page: campaignRef selector when generating
- Campaign page: prefer DB Adventure when ref matches

## Phase 2: AI Per Slot

- Backend: `generate_encounter_passages(templateId, context)` → `{ [nodeId]: string }`
- Slot→face mapping (context_*→Shaman, anomaly_*→Challenger, etc.)
- Frontend: "Generate with AI" → backend → contentPerSlot → generateFromTemplate
- Admin review gate before promote

## Phase 3: Orientation Wiring

- Orientation template type/tag
- Adventure → TwineStory conversion or QuestThread.adventureId
- Instance-scoped generation

## File Impacts

| File | Phase | Action |
|------|-------|--------|
| template-library-gm-placeholders | 1 | Implement |
| generateFromTemplate | 1 | Add campaignRef option |
| Admin templates UI | 1 | Add campaignRef selector |
| Campaign page | 1 | Prefer DB Adventure |
| Backend passage endpoint | 2 | Add generate_encounter_passages |
| Frontend | 2 | Wire "Generate with AI" |

## Dependencies

- [template-library-gm-placeholders](../template-library-gm-placeholders/spec.md)
- [template-library-draft-adventure](../template-library-draft-adventure/spec.md)
- Backend GM agents (architect, shaman, challenger, etc.)
