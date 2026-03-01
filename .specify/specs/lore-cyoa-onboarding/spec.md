# Spec: Lore Index + Event-Driven CYOA Onboarding

## Purpose

Merge the Lore Index (AF) and Event-Driven CYOA (AC) into a single implementation. The lore index and wiki become the canonical content source for both the Event page and the CYOA onboarding narrative. Event page information is essential for creating CYOA content; both share the same definitions and campaign context.

**Supersedes**: [lore-index-knowledge-base](../lore-index-knowledge-base/spec.md) (AF), [event-driven-cyoa-developmental-assessment](../../backlog/prompts/event-driven-cyoa-developmental-assessment.md) (AC)

## Rationale

1. **Single source of truth**: Lore index + wiki hold canonical definitions (Bruised Banana, vibeulons, moves, domains, etc.)
2. **Event page and CYOA share content**: No drift between "what you read on the event page" and "what the CYOA says"
3. **Admin edits flow to both**: EventCampaignEditor updates Instance; both Event page and CYOA intro nodes use that content

## Conceptual Model (Game Language)

- **WHO**: Nations, Archetypes — indexed with handbook content
- **WHAT**: Quests, BARs — glossary entries
- **WHERE**: Allyship domains — indexed with definitions
- **Energy**: Vibeulons — glossary entry
- **Personal throughput**: 4 moves (Wake Up, Clean Up, Grow Up, Show Up) — indexed
- **Campaign**: Bruised Banana Residency, Fundraiser — Event Page and CYOA narrative source

## User Stories

### Phase 1: Lore Index and Wiki

**P1.1**: Proper-noun index — Canonical index of terms used in Event Page and CYOA. File at `content/lore-index.md` with categories and slugs.

**P1.2**: Wiki index — `/wiki` displays index with links to nations, archetypes, domains, moves, campaign, glossary, I Ching.

**P1.3**: Knowledge base pages — `/wiki/campaign/bruised-banana`, `/wiki/moves`, `/wiki/domains`, `/wiki/glossary` with content from terminology.md, FOUNDATIONS.md, allyship-domains.ts.

**P1.4**: Event page link — Wake Up section includes "Learn more" link to `/wiki` or `/wiki/campaign/bruised-banana`.

### Phase 2: CYOA Content Pipeline

**P2.1**: Lore-aware CYOA — BB_Intro and BB_ShowUp use `instance.wakeUpContent`/`showUpContent` (already done). Extend to optionally inject wiki links for terms (e.g., vibeulon → `/wiki/glossary#vibeulon`).

**P2.2**: Developmental assessment — Choice-based questions mapped to Integral Theory stages/lines; store in `player.storyProgress`.

**P2.3**: Personalized quest assignment — `assignOrientationThreads` accepts nationId, playbookId, allyshipDomains, developmental hint from campaignState.

**P2.4**: Verification quest — Seed cert quest for full onboarding flow.

## Functional Requirements

### Phase 1

- **FR1**: Lore index file MUST exist at `content/lore-index.md` with canonical proper-noun list and slugs.
- **FR2**: Wiki layout MUST exist at `src/app/wiki/layout.tsx` with breadcrumb, "Back to app" link.
- **FR3**: Wiki index MUST exist at `/wiki` with links to all knowledge base sections.
- **FR4**: Pages MUST exist at `/wiki/campaign/bruised-banana`, `/wiki/moves`, `/wiki/domains`, `/wiki/glossary`.
- **FR5**: Event page Wake Up section MUST include link to wiki (index or campaign page).

### Phase 2

- **FR6**: CYOA nodes MAY inject wiki links for proper nouns when appropriate.
- **FR7**: Developmental assessment responses MUST be stored in `player.storyProgress`.
- **FR8**: `assignOrientationThreads` MUST accept personalization params from campaignState.
- **FR9**: Verification quest MUST be seeded by `npm run seed:cert:cyoa` for full onboarding flow.

## Content Flow

| Content | Event Page | CYOA |
|---------|------------|------|
| Wake Up (story) | `instance.wakeUpContent` | BB_Intro uses same |
| Show Up (contribute) | `instance.showUpContent` | BB_ShowUp uses same |
| Proper nouns | Link to wiki | Inline or link to wiki definitions |
| Bruised Banana lore | Link to `/wiki/campaign/bruised-banana` | Campaign page expands narrative |
| 4 moves | — | BB_Moves_* nodes; definitions from lore |

## Non-functional Requirements

- No schema changes for Phase 1.
- Wiki pages are public (no auth required).
- Instance remains the source for admin-editable campaign copy; lore index is reference.

## Proper Noun Index (Reference)

| Category | Terms |
|----------|-------|
| Campaign | Bruised Banana Residency, Bruised Banana Fundraiser |
| People | Wendell Britt, Eddy, JJ |
| Nations | Argyra, Pyrakanth, Virelune, Meridia, Lamenth |
| Archetypes | Heaven, Earth, Thunder, Wind, Water, Fire, Mountain, Lake |
| Allyship Domains | Gathering Resources, Direct Action, Raise Awareness, Skillful Organizing |
| 4 Moves | Wake Up, Clean Up, Grow Up, Show Up |
| Economy | Vibeulons |
| Kernel | BAR |
| Kotter | Urgency, Coalition, Vision, Communicate, Obstacles, Wins, Build On, Anchor |

## Out of Scope (v1)

- Lore index as source for Instance (admin continues editing Instance directly).
- Nations/archetypes wiki pages (defer if handbook content sparse).
- Avatar config from CYOA choices (AD spec).
- Auto-linking proper nouns in rich text.

## Reference

- Cursor plan: [merge_af_ac_lore_cyoa_4ba57c0b](../../../.cursor/plans/merge_af_ac_lore_cyoa_4ba57c0b.plan.md)
- Bruised Banana onboarding: [bruised-banana-onboarding-flow](../bruised-banana-onboarding-flow/spec.md)
- Bruised Banana analysis: [bruised-banana-house-integration/ANALYSIS.md](../bruised-banana-house-integration/ANALYSIS.md)
- Adventures API: [src/app/api/adventures/[slug]/[nodeId]/route.ts](../../../src/app/api/adventures/[slug]/[nodeId]/route.ts)
