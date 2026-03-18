# Spec: Campaign Authoring Flow

## Purpose

Give admins (and eventually GM agents) a **top-down, passage-by-passage** view of a campaign so they can author or generate content with full context — from the outer narrative kernel down to each individual slot.

**Problem**: The current admin adventure editor shows passages as a raw table (nodeId, text snippet, Edit link). It provides no:
- Visibility into which GM face owns each passage and what function it serves
- Campaign outer context (what is this adventure for? what are we trying to say?)
- Per-passage AI generation with that context
- Summary view of which passages are filled, drafted, or still placeholder

**Practice**: Deftness Development — build at the speed of admin exploration (Phase 1), then accelerate to agent-driven generation (Phases 2–4).

---

## The Four Phases

### Phase 1 — Admin-Paced, Context-Aware Editing

The admin opens an Adventure and sees the **campaign structure top-down**: each passage slot labeled with its GM face and function, color-coded by fill status (placeholder / AI draft / authored). Clicking into a passage shows the full outer context: campaign goal, Kotter stage, subcampaign domain, what adjacent passages say. A "Generate this passage" button calls the backend with that context and populates a draft.

**No new schema. No AI required to see context — generation is optional.**

### Phase 2 — Auto-Generate CYOA Adventures from Campaign Deck

Admin selects a set of gameboard quests (or a domain) and the system spawns a CYOA Adventure whose passages match the tone and domain of those quests. The campaign deck becomes the narrative source — passages reference real quests by ID, choices route players toward relevant gameboard slots.

**The encounter becomes the bridge between the narrative layer (Adventure) and the action layer (gameboard deck).**

### Phase 3 — PDF Quest Bridge

Quests extracted from uploaded PDFs (Book-to-Quest Library) are woven into CYOA adventures. The `artifact` slot in an encounter can reference a PDF-extracted quest as its real-world deliverable. The passage text is generated from the book context; completion links back to the quest.

**Books become campaign content. The PDF is compostable material.**

### Phase 4 — Whole Campaign from Narrative Kernel

Admin provides a one-paragraph campaign description ("Bruised Banana is a three-month residency building the Mastering the Game of Allyship system in Portland. Kotter Stage 1. Primary domain: Gather Resources."). The system generates:
- All subcampaign Adventures (one per domain) with passage content
- Gameboard quest descriptions calibrated to the kernel
- Campaign goal text and contribution language
- Portal path hints aligned to the campaign tone

**The kernel is the campaign's seed. Everything grows from it.**

---

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Face derivation** | Phase 1 derives GM face from `nodeId` prefix (context_*→Shaman, etc.) using existing `FACE_PLACEHOLDER` map. No schema change needed for display. |
| **Context source** | Adventure's `campaignRef`, `subcampaignDomain`, instance's `kotterStage` + `targetDescription`, and slot's `campaignFunction` (from ESC spec when available). |
| **Per-passage generation** | Backend endpoint `generate_single_passage(adventureId, passageId, campaignContext)` → returns `{ text: string }`. Routes to correct GM agent by face. |
| **Fill status** | A passage is "authored" if its text does NOT match the `getPlaceholderForSlot` pattern. "Draft" if it was AI-generated (flagged by prefix or metadata). "Placeholder" otherwise. |
| **Campaign hub** | Phase 1 adds a campaign context panel to the existing passage edit page. Phase 2+ adds a `/admin/campaign/[ref]/author` hub. |
| **Adjacent context** | When generating a passage, send preceding passage texts so the agent can write with continuity. Max 2 preceding passages. |

---

## Conceptual Model

### The Authoring Context Stack

```
Campaign (bruised-banana)
  └── Instance (kotterStage, goalAmountCents, targetDescription)
        └── Adventure (subcampaignDomain: DIRECT_ACTION)
              └── Passage (nodeId: anomaly_2)
                    ├── Face: Challenger
                    ├── Function: "Surface internal resistance — what the player carries"
                    ├── Required context: [playerArchetype, playerNation]
                    ├── Preceding: anomaly_1 text (primary blocker named)
                    └── Following: anomaly_3 (what must be composted)
```

Every piece of this stack is available at edit time. Phase 1 surfaces it in the UI. Phase 2 passes it to the AI.

### Fill Status

| Status | Meaning | Visual |
|--------|---------|--------|
| `placeholder` | Text matches `getPlaceholderForSlot` pattern | Gray, italic |
| `draft` | AI-generated, not yet admin-reviewed | Yellow dot |
| `authored` | Admin has written or approved content | Green dot |

---

## Functional Requirements

### Phase 1: Context-Aware Editor

- **FR1**: Adventure detail page (`/admin/adventures/[id]`): passage table adds a "Face" column — GM face badge (Shaman, Challenger, Diplomat, Regent, Architect) derived from `nodeId`. Color-coded by role (existing face palette).
- **FR2**: Passage table shows fill status dot (placeholder / authored) next to each row.
- **FR3**: Passage edit page (`/admin/adventures/[id]/passages/[passageId]/edit`): add a collapsible "Context" panel showing:
  - GM face + function guidance (from `FACE_PLACEHOLDER` or slot context when available)
  - Campaign ref + subcampaign domain
  - Campaign goal from instance (`targetDescription`)
  - Preceding passage text (max 2)
- **FR4**: Passage edit page: add "Generate with [Face]" button. Calls `generateSinglePassage(passageId, campaignContext)` server action → fills textarea with AI draft. Button is disabled if no `OPENAI_API_KEY`/backend.
- **FR5**: `generateSinglePassage` action: calls backend `generate_single_passage` endpoint with slot context + campaign context + preceding passages. Returns generated text.
- **FR6**: Backend `generate_single_passage(adventureId, passageId, context)` → routes to face agent → returns passage text.
- **FR7**: `npm run build` and `npm run check` pass.

### Phase 2: Campaign Deck → CYOA Spawn

- **FR8**: Admin campaign hub `/admin/campaign/[ref]/author` — lists all Adventures for the campaign, their subcampaign domain, passage fill status (X/9 passages authored).
- **FR9**: "Generate Adventure from Deck" — admin selects domain + Kotter stage → system finds top 3 quests from domain deck → generates Adventure with passage content referencing those quests.
- **FR10**: `choice` slot generates 2–3 choices that correspond to real gameboard quests (by title/description). Completing the encounter can optionally surface those quests on the gameboard.
- **FR11**: `artifact` slot links to a specific quest ID via `linkedQuestId` on the Passage.

### Phase 3: PDF Quest Bridge

- **FR12**: In the passage editor, an "Import from quest" picker lets admin select a CustomBar from the campaign deck. Sets passage text to quest description as starting point.
- **FR13**: `artifact` slot: "Link to quest" — sets `passage.linkedQuestId`; when player reaches artifact node, quest is surfaced as a gameboard action.
- **FR14**: Book quests (from PDF import) can be linked the same way — `artifact` slot becomes the entry point for a book-extracted quest.

### Phase 4: Campaign from Kernel

- **FR15**: Admin provides a kernel paragraph + domain + Kotter stage. System generates all 3 subcampaign Adventures (one per domain) with passage content.
- **FR16**: Kernel is stored on Instance as `narrativeKernel: String?`. All subsequent generation passes the kernel as campaign context.
- **FR17**: Generated content is DRAFT; all 27 passages (9 × 3 subcampaigns) are marked for admin review before promoting.

---

## Implementation Order

Phase 1 is entirely in the admin UI + one backend endpoint. No schema change. Builds directly on `getPlaceholderForSlot` and the `FACE_PLACEHOLDER` map already in the template library.

**Critical path for Phase 1:**
1. Face badge + fill status in passage table (pure display, no backend)
2. Context panel in passage edit page (display only)
3. "Generate with [Face]" button + `generateSinglePassage` action (AI, optional)
4. Backend `generate_single_passage` endpoint

---

## Dependencies

- [template-library-gm-placeholders](../template-library-gm-placeholders/spec.md) — ✅ Done (FACE_PLACEHOLDER, getPlaceholderForSlot)
- [encounter-slot-context-schema](../encounter-slot-context-schema/spec.md) — Phase 1 provides richer slot context when available
- [game-master-template-content-generation](../game-master-template-content-generation/spec.md) — Phase 2 backend agent routing
- [book-to-quest-library](../book-to-quest-library/spec.md) — Phase 3 PDF quest bridge
- Backend GM agents: `backend/app/agents/` — shaman, challenger, diplomat, regent, architect

## References

- [src/app/admin/adventures/[id]/page.tsx](../../src/app/admin/adventures/%5Bid%5D/page.tsx)
- [src/app/admin/adventures/[id]/passages/[passageId]/edit/page.tsx](../../src/app/admin/adventures/%5Bid%5D/passages/%5BpassageId%5D/edit/page.tsx)
- [src/lib/template-library/index.ts](../../src/lib/template-library/index.ts) — FACE_PLACEHOLDER, getPlaceholderForSlot
- [backend/app/agents/](../../backend/app/agents/) — face agents
- [src/actions/gameboard.ts](../../src/actions/gameboard.ts) — linkedQuestId + deck drawing
