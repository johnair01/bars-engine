# Tasks: Game Master Template Content Generation

## Phase 1: Manual Flow (No AI)

- [ ] **1.1** Implement template-library-gm-placeholders per spec
- [ ] **1.2** Extend `generateFromTemplate(templateId, options?)` with `options.campaignRef?: string`; set `Adventure.campaignRef` when provided
- [ ] **1.3** Admin templates page: add campaignRef selector (or instance selector) when generating; pass to generateFromTemplate
- [ ] **1.4** Campaign page: when resolving by ref, prefer DB Adventure (status ACTIVE, campaignRef or slug match) over file fallback

## Phase 2: AI Per Slot

- [ ] **2.1** Backend: add `generate_encounter_passages(templateId, context)` → `{ [nodeId]: string }`
- [ ] **2.2** Implement slot→face mapping (context_*→Shaman, anomaly_*→Challenger, choice→Diplomat, response→Regent, artifact→Architect)
- [ ] **2.3** Frontend: "Generate with AI" button → call backend → contentPerSlot → generateFromTemplate
- [ ] **2.4** Admin review gate: all generated content is DRAFT; admin must promote

## Phase 3: Orientation Wiring

- [ ] **3.1** Add orientation template type/tag
- [ ] **3.2** Adventure → TwineStory conversion or QuestThread.adventureId
- [ ] **3.3** Instance-scoped generation ("orientation for instance X")

## Verification

- [ ] **V1** Generate Adventure with campaignRef; campaign page shows it
- [ ] **V2** "Generate with AI" produces slot content; admin can review and promote
- [ ] **V3** `npm run build` and `npm run check` pass
