# Spec: Narrative OS Map v0

## Purpose

Define the **Narrative Operating System** world shell: four playable **spaces** (Library, Dojo, Forest, Forge) that are **separate from campaign logic**, playable **without** a loaded campaign, with **campaign overlays** that seed content into spaces via clear APIs. The **Graphic UI** (tabs, cards, lists, drawers) implements the **Narrative UI** (world positioning, mythic language) rather than replacing it.

**Source:** External product prompt (Narrative OS Map v0) analyzed against this repo; see [plan.md](./plan.md) for implementation phases.

---

## Ontology: Spaces, Moves, and Top Nav (product lock)

This section resolves the tension between three axes that **coexist** in BARs Engine:

| Axis | What it is | v0 behavior |
|------|------------|-------------|
| **Top nav** | Device shell: Now (`/`), Vault (`/hand` + related), Events (`/event`), Play (`/adventures`) | **Unchanged** in v0. No requirement to add a fifth primary tab for “World.” |
| **Throughput moves (WCGS)** | Wake Up, Clean Up, Grow Up, Show Up — developmental energy / game loop | **Cross-cutting.** Every space can host activities that skew toward one or more moves; moves are **not** the same as spaces. |
| **Narrative spaces (L/D/F/F)** | Library, Dojo, Forest, Forge — **where** the player is in the world metaphor | **Primary model for the Game Map screen** and for space-scoped APIs. Campaigns **seed into** spaces; they do **not** define the map. |

**Mapping (conceptual, not exclusive):**

| Space | Primary move skew | Secondary ties |
|-------|---------------------|----------------|
| Library | Grow Up | Wake Up (orientation), Show Up (hooks) |
| Dojo | Grow Up | Clean Up (regulation in practice) |
| Forest | Show Up | Wake Up (encounter), Grow Up (outcomes) |
| Forge | Clean Up | Grow Up (integration), Show Up (artifacts) |

**Relationship to [`/game-map`](../../../src/app/game-map/page.tsx):** Today the page groups links by **WCGS**. Target state: **space-first** grouping (four regions) with **move tags** on entries where helpful; `/game-map` remains the player-facing “choose where to play next” surface unless renamed in a later task. Baseline loop (AC7) is proven **across spaces**, not across move sections.

**Relationship to [player-main-tabs-move-oriented-ia](../player-main-tabs-move-oriented-ia/spec.md):** That spec organizes **Now / Vault / Play** by moves. Narrative OS organizes **world exploration** by spaces. Both stand: **tabs = where in the app**, **spaces = where in the world story**, **moves = how development flows**.

---

## User stories

1. **As a player**, I want a **Game Map** that shows four distinct spaces so I feel I am moving through a world, not a CMS.
2. **As a player**, I want to **play without a campaign** using starter content in each space.
3. **As a campaign**, I want to **inject** lore, quests, prompts, and rituals into a space **without** owning the top-level shell.
4. **As a developer**, I want **bounded APIs** per space and a **world map** API so the shell is data-driven over time.

---

## Functional requirements

- **FR1:** Four **SpaceId** values: `library`, `dojo`, `forest`, `forge` — canonical in domain types.
- **FR2:** **Narrative UI** (space names, descriptions, transitions) sits above **Graphic UI** (cards, lists); reuse shared components per [UI_COVENANT.md](../../../UI_COVENANT.md) and [vault-page-experience](../vault-page-experience/spec.md) patterns where applicable.
- **FR3:** **Baseline seed** package: each space has **starter** affordances with no campaign (lore/moves/encounter/forge flow as defined in plan).
- **FR4:** **Campaign overlays**: model with `sourceCampaignId`, `targetSpaceId`, priority, activation rules; render as **badges/annotations**, not a fifth primary nav destination.
- **FR5:** **API boundaries** — world map + per-space endpoints as in [plan.md](./plan.md) (v0 / mock / deferred tags); no single “god” world endpoint with unbounded conditionals.
- **FR6:** **Dual-track:** Core navigation and baseline play work **without** LLMs (aligns with player-main-tabs FR6).
- **FR7:** **Transition** semantics: space A → B has mechanical reason + narrative framing string (deterministic rules acceptable in v0).

---

## Domain types (summary)

Shared TS types / Zod schemas (full definitions in implementation; see download prompt for field lists):

- `SpaceId`, `WorldMapSpaceSummary`, `WorldMapState`
- `LibraryEntry`, `Move`, `PracticeEncounter`, `ForestEncounter`
- `ForgeSeed`, `Daemon`, `Talisman` (align naming with existing Prisma models where they overlap — avoid duplicate concepts without migration plan)
- `CampaignOverlay`

---

## Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC1 | App exposes a **top-level Game Map** screen with **four spaces** as the primary **world** navigation model on that screen. |
| AC2 | Each space has a **home** view with distinct narrative header, summary, primary CTA, and room for recommendations/activity. |
| AC3 | World is **playable with no campaign** using **starter** seeded content per space (minimal loop). |
| AC4 | Campaign content can be **injected** into spaces via overlay/seed APIs (v0: at least one path proven end-to-end or mocked with stable contract). |
| AC5 | Graphic UI **supports** Narrative UI (component vocabulary: SpaceCard, RecommendationCard, etc. — see plan). |
| AC6 | Clear **API boundaries** documented: map, Library, Dojo, Forest, Forge, campaign seeding (per plan tags). |
| AC7 | Player can complete **one baseline loop** across all four spaces without campaign content (order defined in plan). |
| AC8 | Code organized so **narrative skins** can swap without rewriting core services (domain vs presentation separation). |
| AC9 | **NavBar** and campaign hub (`/campaign/hub`, `/event`) do not duplicate the Narrative OS shell; overlays complement them. |

---

## Non-goals (v0)

- Full procedural Forest generation; full multiplayer orchestration; deep alchemy scoring; final art direction; fully dynamic map topology; complete campaign logic unification — per original v0 prompt.

---

## References

- [ARCHITECTURE.md](./ARCHITECTURE.md) — short layer diagram (Narrative OS vs campaign vs GUI)
- [`src/components/NavBar.tsx`](../../../src/components/NavBar.tsx)
- [`src/app/game-map/page.tsx`](../../../src/app/game-map/page.tsx)
- [player-main-tabs-move-oriented-ia](../player-main-tabs-move-oriented-ia/spec.md)
- [game-map-gameboard-bridge](../game-map-gameboard-bridge/spec.md)
- [campaign-map-phase-1](../campaign-map-phase-1/spec.md)
- External: `narrative_os_map_spec.md` (download prompt)
