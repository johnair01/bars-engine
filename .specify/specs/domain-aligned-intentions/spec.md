# Spec: Domain-Aligned Intentions (U)

## Purpose

Let players choose from multiple predefined intentions when setting their journey intention. One option MUST be "Following my curiosity." Intentions are keyed by allyship domain (WHERE) so players can align their intention with their campaign path. This supports the larger scheme of players creating their own vibeulons (signature vibeulons on BAR completion).

## Conceptual Model (Game Language)

- **WHERE** = Allyship domains (Gathering Resources, Direct Action, Raise Awareness, Skillful Organizing)
- **Intention** = What the player commits to for their journey; stored from orientation quest completion
- **Personal throughput** = 4 moves (Wake Up, Clean Up, Grow Up, Show Up) — how players get things done

Intentions can be domain-aligned (e.g. "I intend to gather resources that support the residency") or cross-domain (e.g. "Following my curiosity").

## User Stories

### P1: Choose from predefined intentions
**As a player**, I want to select from a set of predefined intentions (including "Following my curiosity"), so I can quickly commit without writing from scratch.

**Acceptance**: Intention quest offers a "Choose from options" path with predefined intentions. At least one option is "Following my curiosity." Direct-write and guided-journey paths remain.

### P2: Domain-aligned intention options
**As a player**, I want intention options that match my chosen allyship domain(s), so my intention aligns with WHERE I want to contribute.

**Acceptance**: Predefined intentions are tagged with allyship domain (or null for cross-domain). When player has `campaignDomainPreference`, domain-aligned options are surfaced first. "Following my curiosity" is always available (cross-domain).

### P3: Add or change intention later
**As a player**, I want to update my intention when my focus shifts, so it stays aligned with my current commitment.

**Acceptance**: A persistent entry point (Profile, Settings, or dashboard) allows updating intention. Same UX as orientation: direct write, guided journey, or choose from options.

## Functional Requirements

- **FR1**: A predefined intention options list MUST exist with at least: "Following my curiosity" (cross-domain). Other options MAY be tagged with `allyshipDomain`.
- **FR2**: Intention quest (orientation-quest-1 or equivalent) MUST offer three paths: (a) Write directly, (b) Guided journey, (c) Choose from options. Path (c) shows predefined options; when `player.campaignDomainPreference` is non-empty, domain-aligned options appear first.
- **FR3**: "Following my curiosity" MUST always be visible in the choose-from-options path, regardless of domain preference.
- **FR4**: Completing the intention quest with a chosen option MUST store the intention text in quest inputs (same as today). No schema change for storage.
- **FR5**: A persistent "Update my intention" entry point MUST exist (Profile, Settings, or dashboard). Opens the same intention-setting UX.
- **FR6**: A verification quest `cert-domain-intentions-v1` MUST be seeded by `npm run seed:cert:cyoa`. It walks through choosing a predefined intention and confirming the Update flow. Required for UI features per Spec Kit skill.

## Non-functional Requirements

- Reuse existing intention quest flow and `intention-guided-journey.ts` patterns.
- No schema changes for Phase 1; use quest inputs for storage.
- Domain-aligned options are configurable (lib constant or seed); no admin UI required for v1.

## Out of Scope (v1)

- Admin UI to edit predefined intentions.
- Signature vibeulon minting on BAR completion (X spec).
- i18n for intention labels.

## Reference

- Intention-guided journey: [src/lib/intention-guided-journey.ts](../../src/lib/intention-guided-journey.ts)
- Allyship domains: [src/lib/allyship-domains.ts](../../src/lib/allyship-domains.ts)
- QuestDetailModal intention UX: [src/components/QuestDetailModal.tsx](../../src/components/QuestDetailModal.tsx)
- Q spec (campaign path): [bruised-banana-allyship-domains/spec.md](../bruised-banana-allyship-domains/spec.md)
