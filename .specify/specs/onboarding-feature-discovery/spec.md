# Spec: Onboarding Feature Discovery and Send Experience

## Purpose

Clean up the onboarding experience so players know how to use core features, get excited about the app, and start using it in ways that move the needle forward. Content must exist both as **quests** (in-context, actionable) and in **documentation** (reference, deep dive).

**Problem**: Players complete onboarding but don't know how to make a BAR, what a BAR is, or how it connects to gameplay. They don't know how to create quests or add subquests to campaign quests. They don't know how to use Emotional First Aid. Donation to the campaign is unclear. The send experience leaves players unsure what to do next.

**Goal**: Excite people to use the app, learn its features, and use them in ways that move the needle forward.

## Core Topics (Dual Delivery: Quests + Docs)

| Topic | Quest Content | Documentation |
|-------|---------------|---------------|
| **BARs** | What a BAR is; how to make one; how it connects to gameplay (inspiration → quests, context on quests) | Player Handbook / docs: BAR creation, BAR-to-quest flow, BAR-on-quest |
| **Quests** | How to make a quest; how to add subquests to campaign quests | Docs: Quest creation, subquests, campaign quest flow |
| **Emotional First Aid** | How to use EFA; when to use it; what it does | Docs: EFA guide, vibeulon moves, grounding tools |
| **Donation** | How to donate to the campaign; where; why it matters | Docs: Donation flow; link from dashboard/campaign |

## Design Principles

1. **Quest-first discovery** — Orientation or post-onboarding quests introduce each feature with a small, actionable step (e.g., "Create your first BAR").
2. **Docs as reference** — Documentation exists for players who want to read more or look something up.
3. **Excitement over obligation** — Copy and flow should feel inviting, not instructional. "Here's something powerful" not "You must do this."
4. **Move the needle** — Features are framed in terms of impact: BARs fuel quests; quests advance the campaign; EFA unblocks; donations support the residency.

## Functional Requirements

### FR1: BAR Discovery

- **Quest**: Orientation or post-onboarding quest explains what a BAR is, how to create one, and how BARs connect to gameplay (inspiration for quests, context on quests).
- **Docs**: Player Handbook section on BARs—creation, types, BAR-to-quest, BAR-on-quest.

### FR2: Quest Discovery

- **Quest**: Explain how to make a quest and how to add subquests to campaign quests.
- **Docs**: Quest creation guide; subquests; campaign quest flow; gameboard.

### FR3: Emotional First Aid Discovery

- **Quest**: Explain how to use EFA, when to use it, what it does (vibeulon moves, grounding).
- **Docs**: EFA guide in Player Handbook or wiki.

### FR4: Donation Discovery

- **Quest**: Optional quest or prompt that surfaces donation as a way to support the campaign.
- **Docs**: Donation flow documented; clear path from dashboard/campaign to donate.
- **UI**: Donation link visible and accessible (event page, campaign, dashboard).

### FR5: Send Experience Flow

- Post-signup flow should guide players toward: Game Map → first BAR → first quest → EFA (when stuck) → donation (when ready).
- No single rigid path; players can explore. But key actions are surfaced and explained.

## Non-Functional Requirements

- Content tone: inviting, clear, game-language aligned (WHO, WHAT, WHERE, Energy).
- Mobile-friendly for quest and doc surfaces.
- Docs linkable from quests; quests linkable from docs.

## Dependencies

- [Game Map and Lobby Navigation](.specify/specs/game-map-lobbies/spec.md) — Game Map as entry; Library for docs
- [Dashboard Orientation Flow](.specify/specs/dashboard-orientation-flow/plan.md) — Post-signup redirect, orientation threads
- [K-Space Librarian](.specify/specs/k-space-librarian/spec.md) — Quest-driven docs (if applicable)
- Event/Donation flow (existing)

## Non-Goals (v0)

- Full guided tour or mandatory sequence
- Replacing existing onboarding CYOA
- Admin-side quest grammar changes (player-facing only)
