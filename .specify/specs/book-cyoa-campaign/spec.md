# Spec: Book CYOA campaign (library book + Adventure + CampaignReader)

## Purpose

Deliver a **CYOA-shaped in-app experience** of steward-curated library books, starting with ***Mastering the Game of Allyship*** (*MtGoA*). Players **enter the book**, **branch within pedagogical bounds**, **mint BARs**, and **complete real quests** using production surfaces (Vault, campaigns, charges, collective flows where appropriate)—not a read-only preview with decorative buttons.

**Problem:** The [book-to-quest library](../book-to-quest-library/spec.md) optimizes **linear** `QuestThread` pull from `/library`. Backers and players need a **unified narrative shell** (passages) that **bridges** reading to **embodied practice** while staying honest about scope (chapter vs full book).

## Dependencies (do not duplicate)

| Spec | Relationship |
|------|----------------|
| [book-to-quest-library](../book-to-quest-library/spec.md) | Source of `CustomBar` quests, `QuestThread`, `Book`, admin publish flow |
| [bruised-banana-allyship-domains](../bruised-banana-allyship-domains/spec.md) | Domain vocabulary for choices and quest linkage |
| [campaign-hub-spoke-landing-architecture](../campaign-hub-spoke-landing-architecture/spec.md) | Epiphany Bridge / hub-spoke language (reference; not full CHS scope) |
| [unified-cyoa-graph-authoring](../unified-cyoa-graph-authoring/spec.md) | Graph validation, dangling targets—**align** Passage saves when UGA ships overlap |
| [campaign-onboarding-cyoa](../campaign-onboarding-cyoa/spec.md) | Shared CYOA ontology; **steward** book campaigns vs **invite** CYOA—facets, not a second graph model |
| [player-facing-cyoa-generator](../player-facing-cyoa-generator/spec.md) | **Out of scope** for v1: this feature is **steward-seeded** from books, not player-authored CYOA |

**Code anchors:** `src/actions/book-to-thread.ts`, `src/app/campaign/components/CampaignReader.tsx`, `src/app/campaign/page.tsx`, `src/lib/quest-adventure.ts`, Prisma `Adventure`, `Passage`, `QuestThread.adventureId`, `Passage.linkedQuestId`, `QuestAdventureLink`.

## Product vision

### Final product

CYOA **version of the book** inside BARs: paths, BAR minting, quest completion, and normal product affordances end-to-end.

### Phase 1 (this spec’s first delivery)

**Chapter 1 only** as a **structured backer preview**, proving:

- Passage → assign/start quest → complete → persist → return to CYOA (or controlled handoff).
- At least one **Epiphany Bridge** beat and at least one **practice loop** using **real** quest completion (and BAR mint / Vault when the chapter calls for it—no stubs).

### Pedagogical stack

- **Epiphany Bridge** — reframe and commitment beats.
- **Passage types** (content + optional machine-readable tag): `epiphany_bridge`, `expository`, `storytelling`, `skill_development` — may drive different downstream actions (reflect-only vs assign quest vs Forge-oriented CTA).
- **Four moves spine:** Wake Up → Clean Up → Grow Up → Show Up as **macro** structure (acts/chapters). **CYOA branching** primarily **inside** a move unless the book explicitly allows cross-move jumps.

### Template goal

MtGoA Chapter 1 is the **reference adventure** for **reusable templates** (AdventureTemplate slots + authoring guide) so additional library books can clone the pattern (swap `bookId` / `campaignRef`).

## Data model (v1 — mostly existing)

- **`Adventure`** — one per book campaign slice (e.g. chapter-1 demo); stable `campaignRef` + `slug` for `/campaign?ref=…`.
- **`Passage`** — `nodeId`, `text`, `choices` JSON, optional `linkedQuestId`, optional **`metadata` JSON** (existing column).
- **Convention (spec-defined):** `metadata.passageType` ∈ `epiphany_bridge` \| `expository` \| `storytelling` \| `skill_development`; optional `metadata.move` ∈ `wake_up` \| `clean_up` \| `grow_up` \| `show_up` for template validation and docs (no migration required for v1 if stewards follow convention only).
- **`QuestThread.adventureId`** — optional link from library thread to the shell adventure (one conceptual product in data).
- **`QuestAdventureLink`** — `CustomBar` ↔ `Adventure` with `moveType` where applicable.

## API contracts (define before UI-heavy work)

Names are provisional; implement behind spec-approved signatures.

### `linkLibraryThreadToAdventure`

**Input:** `{ threadId: string; adventureId: string }` (admin or script; RBAC TBD in tasks)  
**Output:** `Promise<{ success: true } \| { error: string }>`

- Sets `QuestThread.adventureId` when thread is library + book-backed; validates FK and no conflicting product rules.

### `ensurePlayerAdventureProgress` (or reuse existing progress init)

**Input:** `{ playerId: string; adventureId: string }`  
**Output:** `Promise<PlayerAdventureProgress \| { error: string }>`

- Idempotent create/read of `PlayerAdventureProgress` for `/campaign` entry (align with current `CampaignReader` data loading).

### `startQuestFromBookPassage` (optional if not already covered by campaign actions)

**Input:** `{ playerId: string; passageNodeId: string; adventureId: string }` or `{ questId: string; … }`  
**Output:** `Promise<{ success: true; redirectPath?: string } \| { error: string }>`

- When a choice or `linkedQuestId` implies **assign/start** a library quest, call existing assign/start paths; **no parallel quest state machine**.

*Exact consolidation with existing server actions (e.g. quest grammar, campaign deck) is an implementation detail; the spec requires one documented happy path for Chapter 1.*

## User stories

### P1 — Chapter 1 backer demo

- As a **backer**, I can open a **canonical URL**, sign in per the published account model, and complete **Chapter 1** of the MtGoA CYOA with at least one **real** in-app quest loop.
- As a **steward**, I can reproduce the demo using a **short runbook** (3–5 bullets) without internal tools.
- As a **player**, I understand I am getting a **Chapter 1 preview**, not the full book, unless we explicitly expand messaging.

### P2 — Full book spine (later)

- As a **player**, I can continue through additional chapters/acts on the same `Adventure` or sequenced adventures (spec’d when P1 is frozen).

### P3 — Multi-book templates

- As an **admin/steward**, I can author a new library book CYOA using documented **template slots** and **passage types**, reusing `AdventureTemplate` patterns.

## Functional requirements

### Phase 1 (Chapter 1)

- **FR1:** One seeded `Adventure` with stable `campaignRef` (e.g. `mtgoa-chapter-1-demo` or `allyship-book`) loadable via `/campaign` + `CampaignReader`.
- **FR2:** Passages cover Chapter 1 beats; choices JSON valid; no dangling targets **or** document manual QA until UGA validator applies to Passage saves.
- **FR3:** At least one passage uses **`metadata.passageType`** per convention (minimum one `epiphany_bridge` or agreed equivalent).
- **FR4:** At least one **practice** connection: `linkedQuestId` and/or choice-driven assign for a **published** library quest from MtGoA Chapter 1.
- **FR5:** `QuestThread.adventureId` set for the MtGoA library thread used in the demo (script or admin).
- **FR6:** Runbook under `docs/runbooks/` — canonical URL, auth requirements, 3–5 step click path, explicit **non-goals** for Phase 1 (rest of book).
- **FR7:** Copy tone: invite practice, not performance—align with [BBM message framework](../bb-residency-marketing-metabolism/message-framework.md) for outward-facing strings where this campaign is public.

### Phase 2 (templates)

- **FR8:** Document `AdventureTemplate` slot list (e.g. `intro`, `bridge_open`, `domain_pick`, `expository_block`, `story_prompt`, `skill_practice`, `move_recap`, `library_cta`).
- **FR9:** Authoring guide: `nodeId` naming, `choices` shape, `metadata` keys, mapping to `allyshipDomain` / `moveType` on `CustomBar`.

### Phase 3 (optional certification)

- **FR10:** Optional `cert-book-cyoa-allyship-ch1-v1` (or similar) CYOA cert quest mirroring other cert seeds—deferred until P1 stable.

## Game Master faces (acceptance lens)

| Face | Acceptance question |
|------|---------------------|
| **Shaman** | Is the **graph** for Chapter 1 small enough to hold in one mind and seed without hidden edges? |
| **Regent** | Does “done” include **one real** quest completion + honest **preview** messaging? |
| **Challenger** | Are **macro four-move** and **micro branch** rules explicit so we do not promise total freedom? |
| **Architect** | Are **passage types** + template slots documented for the next book? |
| **Diplomat** | Is backer-facing copy **shame-safe** and practice-forward? |
| **Sage** | Does insight (passages) reliably hand off to **embodied** product mechanics without broken state? |

## Risks

- **Auth friction** — document login/signup in the runbook.
- **AI drift** on generated library quests — manual steward pass before public CYOA; [narrative-quality](../../../.agents/skills/narrative-quality/SKILL.md) as needed.
- **Overselling** — external messaging must say **Chapter 1** until P2 ships.

## Open decisions

- Exact **Chapter 1 boundaries** in the published MtGoA TOC (seed scope).
- **Backer account model:** individual signup vs shared demo login vs batched invites.

## Non-goals (v1)

- Replacing [player-facing-cyoa-generator](player-facing-cyoa-generator/spec.md) or player-sovereign CYOA authoring.
- Full UGA admin UX for Passage graphs (reuse manual seed / existing admin until merged).
