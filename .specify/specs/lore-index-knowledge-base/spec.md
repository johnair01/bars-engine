# Spec: Lore Index and Knowledge Base

## Purpose

Index all proper nouns from the Event Page, story context, and onboarding flow, and create a knowledge base with linkable pages. This supports onboarding and invitations by providing canonical lore that the Event Page (Wake Up, Show Up) and the Event-Driven CYOA (AC) can reference. New visitors can "Learn the story" with definitions for terms they encounter.

**Broader vision**: The knowledge base becomes the canonical reference for agents, content creators, and players. Event page content links to definitions; CYOA passages reference indexed terms.

## Conceptual Model (Game Language)

- **WHO**: Nations, Archetypes — indexed with handbook content
- **WHAT**: Quests, BARs — glossary entries
- **WHERE**: Allyship domains — indexed with definitions
- **Energy**: Vibeulons — glossary entry
- **Personal throughput**: 4 moves (Wake Up, Clean Up, Grow Up, Show Up) — indexed
- **Campaign**: Bruised Banana Residency, Fundraiser — Event Page–specific lore

## User Stories

### P1: Proper-noun index (canonical list)
**As a content creator or agent**, I want a canonical index of all proper nouns used in the Event Page, story context, and onboarding, so I can reference terms consistently and link to definitions.

**Acceptance**: A lore-index file exists (e.g. `content/lore-index.md` or `.agent/context/lore-index.md`) with categories: Campaign, People, World, Nations, Archetypes, Allyship Domains, 4 Moves, Economy, Kernel, Kotter, Frameworks. Each term has a slug and optional wiki path.

### P2: Wiki index page
**As a visitor or player**, I want a wiki index page that lists all knowledge base entries by category, so I can browse and find definitions.

**Acceptance**: `/wiki` (or `/wiki/index`) displays an index page with links to nations, archetypes, domains, moves, campaign, glossary. Links to existing I Ching page.

### P3: Knowledge base pages
**As a visitor**, I want dedicated pages for nations, archetypes, allyship domains, moves, and the Bruised Banana campaign, so I can learn the story before signing up or donating.

**Acceptance**: Pages exist at `/wiki/nations/[slug]`, `/wiki/archetypes/[slug]`, `/wiki/domains`, `/wiki/moves`, `/wiki/campaign/bruised-banana`, `/wiki/glossary`. Content sourced from handbook or static definitions.

### P4: Event Page link to knowledge base
**As a visitor on the Event page**, I want a "Learn more" or "Glossary" link in the Wake Up section, so I can dive deeper into terms like Bruised Banana, vibeulons, quests, BARs.

**Acceptance**: Event page Wake Up section (or "Read more" details) includes a link to `/wiki` or `/wiki/campaign/bruised-banana`.

### P5: Bruised Banana lore page
**As a visitor**, I want a dedicated page for the Bruised Banana Residency and Fundraiser, so I understand the campaign context before contributing.

**Acceptance**: `/wiki/campaign/bruised-banana` exists with content: Residency, Fundraiser, house (Wendell, Eddy, JJ), link to Event Page. Content can be expanded as lore develops.

## Functional Requirements

- **FR1**: Lore index file MUST exist with canonical proper-noun list and slugs.
- **FR2**: Wiki index route MUST exist at `/wiki` with links to all knowledge base sections.
- **FR3**: Wiki layout MUST provide breadcrumb, back-to-app link, consistent styling.
- **FR4**: Nations and archetypes pages MUST reuse or link to `docs/handbook/` content.
- **FR5**: Allyship domains, 4 moves, glossary pages MUST exist with content from terminology.md and FOUNDATIONS.md.
- **FR6**: Bruised Banana campaign page MUST exist with Event Page–specific lore.
- **FR7**: Event page MUST include at least one link to the wiki (index or campaign page).

## Non-functional Requirements

- No schema changes required.
- Content is static or read from handbook; no DB for lore pages in v1.
- Wiki pages are public (no auth required).

## Proper Noun Index (Reference)

| Category | Terms |
|----------|-------|
| Campaign | Bruised Banana Residency, Bruised Banana Fundraiser, Bruised Banana Campaign |
| People | Wendell Britt, Eddy, JJ |
| World | Conclave, Robot Oscars, Constructs |
| Nations | Argyra, Pyrakanth, Virelune, Meridia, Lamenth |
| Archetypes | Heaven, Earth, Thunder, Wind, Water, Fire, Mountain, Lake |
| Allyship Domains | Gathering Resources, Direct Action, Raise Awareness, Skillful Organizing |
| 4 Moves | Wake Up, Clean Up, Grow Up, Show Up |
| Economy | Vibeulons |
| Kernel | BAR |
| Kotter | Urgency, Coalition, Vision, Communicate, Obstacles, Wins, Build On, Anchor |

## Out of Scope (v1)

- Auto-linking proper nouns in rich text (tooltips or inline links).
- Editable lore via admin UI (content in files or handbook).
- Search across knowledge base.

## Reference

- Lore conceptual model: [.specify/specs/lore-conceptual-model/spec.md](../lore-conceptual-model/spec.md)
- Story context: [docs/handbook/world/story_context.md](../../../docs/handbook/world/story_context.md)
- Event page: [src/app/event/page.tsx](../../../src/app/event/page.tsx)
- Event-Driven CYOA: [.specify/backlog/prompts/event-driven-cyoa-developmental-assessment.md](../../backlog/prompts/event-driven-cyoa-developmental-assessment.md)
- Bruised Banana analysis: [.specify/specs/bruised-banana-house-integration/ANALYSIS.md](../bruised-banana-house-integration/ANALYSIS.md)
