# Spec: Quest Upgrade to CYOA (Phase 5c Extension)

## Purpose

Extend Phase 5c recursive generation so admins can **upgrade existing quests** (player-created or system-generated) into full CYOA adventures. This enables the flow: BARs → Quests → Adventures → Campaigns. Admin-only for v1; future player use requires creator permission.

## Content hierarchy (confirmed)

| Level | Schema | Notes |
|-------|--------|-------|
| **BAR** | CustomBar (type: vibe, inspiration) or Bar | Base unit |
| **Quest** | CustomBar (type: standard, etc.) | Has `title`, `description`, optional `twineStoryId` |
| **Adventure** | Adventure + Passage[] | CYOA structure; passages can `linkedQuestId` → CustomBar |
| **Campaign** | Instance + Adventure.campaignRef | Campaign orients via Adventure |

**Current quest shape** (from schema):
- CustomBar: `title`, `description`, `twineStoryId` (optional), `storyContent`, `storyMood`, `inputs`, `moveType`
- Quest without CYOA: `twineStoryId` null; no `QuestThread.adventureId`; no linked Passage
- Quest with CYOA: `QuestThread.adventureId` → Adventure; `Passage.linkedQuestId` → CustomBar (edit sync)

## User stories

**As an admin**, I want to take any existing quest (player-created or system-generated) and extend it with CYOA content—either as a wrapper (orientation leads to quest completion) or as a replacement (quest content becomes passages). The original quest is preserved for provenance.

**As an admin**, I want to trigger "Upgrade to CYOA" from the quest detail view (Admin → Quests → [quest]) or from the Quest Grammar flow ("Start from existing quest"). The generation CYOA runs and produces an Adventure + QuestThread linked to the original quest.

**As an admin**, I want to merge multiple Adventures into one Adventure.

## Upgrade modes (forking)

| Mode | Description | Output |
|------|-------------|--------|
| **Wrapper** | CYOA as wrapper | New Adventure with orientation/story passages that leads to the existing quest as the completion step.
| **Replacement** | CYOA as replacement | Quest content turned into passages (each beat → passage). Original quest preserved and linked. |

Both modes are **translation moves**—the original quest is preserved and linked to the new CYOA for posterity. Future player-facing use: requires creator permission to transform another player's quest.

## Entry points

1. **Admin → Quests → [quest] → "Upgrade to CYOA"** — button on quest detail page
2. **Quest Grammar / generation flow → "Start from existing quest"** — option to seed the unpacking flow from an existing quest's description

## Functional requirements

### Phase 5c: Recursive generation (extended)

- **FR24**: Admin MUST be able to trigger "Generate another quest" from within a quest; the generation CYOA runs and the new quest gets added to the adventure.
- **FR24a**: Admin MUST be able to trigger "Upgrade to CYOA" from the quest detail view (Admin → Quests → [quest]).
- **FR24b**: Quest Grammar flow MUST support "Start from existing quest" — select a quest to seed unpacking; generation produces Adventure + QuestThread linked to that quest.
- **FR24c**: Upgrade MUST support two modes: (a) Wrapper — orientation passages lead to quest completion; (b) Replacement — quest content becomes passages. Admin chooses mode per upgrade.
- **FR24d**: Original quest content MUST be preserved and linked to the new CYOA (provenance).
- **FR24e**: One Adventure per quest (each upgraded quest gets its own CYOA). Schema: QuestThread.adventureId (optional) links thread to Adventure.

### Merge adventures

- **FR24f**: Admin MUST be able to merge multiple Adventures into one Adventure. (Distinct from campaigns: multiple Adventures → one Campaign; merge = multiple Adventures → one combined Adventure.)

## Non-functional requirements

- Admin-only for v1.
- Future player use: requires creator permission to transform another player's quest.
- Provenance: original quest always preserved; link from CYOA back to source quest.

## Implementation notes

- **Upgrade flow (v1)**: Admin goes through full unpacking flow (q1–q7, model, segment, archetype, lens, expected moves, player POV) before upgrade. Pre-fill from quest: `moveType` → q7 (aligned action), `description` → q6Context and q5. Inline on quest detail page (expandable section). Also available from Quest Grammar "Upgrade from quest" tab.

- **Output paths** (both supported):
  - **Path A**: `compileQuestWithAI` → QuestPacket → `publishQuestPacketToPassagesWithSourceQuest` (new Adventure, last node `linkedQuestId` = source quest).
  - **Path B**: `generateQuestOverviewWithAI` → .twee → `createAdventureAndThreadFromTwee` with `sourceQuestId` (end passage links to original quest).

- **Quick upgrade** (wrapper/replacement without unpacking): Hidden until mature. `upgradeQuestToCYOA` remains in codebase for future use.

- **Wrapper mode** (quick): Orientation passages → final passage with `linkedQuestId` = original quest.

- **Replacement mode** (quick): Parse `description` into beats; create passages; completion passage links to original quest.

- **Schema**: QuestThread.sourceQuestId records provenance.

## Reference

- Phase 5c: [quest-grammar-ux-flow](../quest-grammar-ux-flow/spec.md)
- Schema: CustomBar, QuestThread, Adventure, Passage in [prisma/schema.prisma](../../prisma/schema.prisma)
- Admin quest detail: [src/app/admin/quests/[id]/page.tsx](../../src/app/admin/quests/[id]/page.tsx)
