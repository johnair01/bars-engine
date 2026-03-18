# Spec: Game Master Template Content Generation

## Purpose

Define **when and where** Game Master faces should generate content, **what blocks** templates from orienting players to campaigns, and **what's needed** to create content with templates. This spec establishes the strategy; implementation is phased.

**Problem**: Template library exists but produces placeholders only. Campaigns need orientation content. GM agents (Architect, Shaman, Challenger, etc.) exist in the backend but are not wired to template generation. No clear path from "generate" to "players are oriented."

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI. Analysis-first; see [ANALYSIS.md](./ANALYSIS.md) for full detail.

---

## Design Decisions

| Topic | Decision |
|-------|----------|
| **GM generation scope** | Faces generate **per slot** in template structure. Slot→face mapping: context_*→Shaman, anomaly_*→Challenger, choice→Diplomat, response→Regent, artifact→Architect. |
| **Admin review gate** | All generated content is DRAFT. Admin must review and promote. No auto-publish. |
| **Campaign first** | Primary use case: generate Adventure with campaignRef for pre-auth campaign. Orientation quest wiring is Phase 3. |
| **API extension** | `generateFromTemplate` extends with optional `contentPerSlot` and `campaignRef`. Backend provides passage-generation endpoint. |

---

## Where Content Needs to Be Created

| Touchpoint | Content | Model | GM Faces |
|------------|---------|-------|----------|
| Campaign (pre-auth) | CYOA that orients before signup | Adventure + Passages | Shaman, Diplomat |
| Orientation encounter | 9-passage encounter per context | Adventure | All six (by slot) |
| Campaign onboarding | "Welcome to campaign X" | Adventure or TwineStory | Diplomat, Regent |
| Gameboard quest | Quest + optional encounter | CustomBar, Adventure | Architect, Challenger |

---

## Blockers (Summary)

| Blocker | Description |
|---------|-------------|
| **A** | No bridge template → campaign: manual edit, set campaignRef, promote. |
| **B** | Placeholders only; no AI generation per slot. |
| **C** | Campaign uses Adventure; quest play uses TwineStory. Split. |
| **D** | Bruised Banana loads from file; ignores DB. |
| **E** | No "orientation template" or campaign-scoped generation. |

---

## What We Need

### Phase 1: Manual Flow (No AI)

- GM placeholders (template-library-gm-placeholders)
- `generateFromTemplate(..., { campaignRef })`
- "Generate for campaign" in admin UI
- Campaign page: prefer DB Adventure when ref matches

### Phase 2: AI Per Slot

- Backend: `generate_encounter_passages(templateId, context)` → `{ [nodeId]: string }`
- Slot→face mapping in backend
- Frontend: "Generate with AI" → call backend → `contentPerSlot` → generateFromTemplate
- Admin review before promote

### Phase 3: Orientation Wiring

- Orientation template type/tag
- Adventure → TwineStory conversion or QuestThread.adventureId
- Instance-scoped generation ("orientation for instance X")

---

## Functional Requirements (Phase 1)

- **FR1**: Implement [template-library-gm-placeholders](.specify/specs/template-library-gm-placeholders/spec.md).
- **FR2**: Extend `generateFromTemplate(templateId, options?)` with `options.campaignRef?: string`; set `Adventure.campaignRef` when provided.
- **FR3**: Admin templates page: add campaignRef selector (or instance selector) when generating; pass to generateFromTemplate.
- **FR4**: Campaign page: when resolving by ref, prefer DB Adventure (status ACTIVE, campaignRef or slug match) over file fallback.

---

## References

- [ANALYSIS.md](./ANALYSIS.md) — full analysis
- [template-library-draft-adventure](../template-library-draft-adventure/spec.md)
- [template-library-gm-placeholders](../template-library-gm-placeholders/spec.md)
- [orb_triadic_twee_generator_spec](../../.specify/fixtures/conclave-docs/orb_triadic_twee_generator_spec.md)
- [onboarding-quest-generation-unblock](../onboarding-quest-generation-unblock/spec.md)
