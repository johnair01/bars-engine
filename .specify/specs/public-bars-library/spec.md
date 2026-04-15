# Spec: Public BARs in Library

## Purpose

Provide a place for players to browse public BARs for discovery—distinct from the marketplace. The marketplace is for public **quests** (claimable work). The Library is for public **BARs** (discovery, inspiration, context). Players can see what others have shared without claiming it as a quest.

**Problem**: There is no player-facing surface to browse public BARs. The Library page has "Public BARs — Coming soon." The marketplace (`/bars/available`) is for quests. Public BARs need a home for discovery.

**Goal**: Implement Public BARs in the Library as the Wake Up discovery surface. Not the marketplace—this is for browsing BARs as inspiration and context.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Route** | `/library/bars` or `/library` with Public BARs section. Library already exists at `/library`. |
| **Content** | List public BARs (visibility: 'public') that are NOT quests-for-claim, or a curated subset. Exclude onboarding-only BARs if desired; include player-created public BARs. |
| **Marketplace vs Library** | Marketplace = quests you can claim/play. Library Public BARs = BARs you browse for discovery. Same CustomBar table; different filters and intent. |
| **Filtering** | Consider excluding `sourceType: 'onboarding'` from Library if we want only "intentional" public BARs. Or include all public BARs for maximum discovery. |

## Functional Requirements

### FR1: Public BARs List

- Route: `/library/bars` (or integrated into `/library`)
- Query: CustomBars where `visibility: 'public'`, `status: 'active'`, optionally exclude `sourceType: 'onboarding'` or filter by type
- Display: Title, description (truncated), creator (optional), tags, link to detail

### FR2: Public BAR Detail (Optional)

- Optional: `/library/bars/[id]` for full BAR view
- Or: expand inline on Library page

### FR3: Library Integration

- Library page (`/library`) links to Public BARs (replace "Coming soon" placeholder)
- Library = Wake Up lobby; Public BARs = discovery content

### FR4: Distinction from Marketplace

- Marketplace: quests to claim. Filter: player-created, quest-like, exclude onboarding.
- Library Public BARs: BARs to browse. Filter: public, for discovery. May include or exclude onboarding BARs per product decision.

## Non-Functional Requirements

- Mobile-friendly list/grid
- Pagination or "load more" if many BARs
- Performance: index on visibility, status

## Dependencies

- [Game Map and Lobby Navigation](.specify/specs/game-map-lobbies/spec.md) — Library as Wake Up lobby
- [Onboarding BARs Wallet](.specify/specs/onboarding-bars-wallet/spec.md) — Clarifies onboarding BARs exclusion from market; may inform Library filter

## Non-Goals (v0)

- Claiming BARs from Library (that's marketplace)
- Full-text search (defer)
- Admin curation of "featured" BARs (defer)
