# Spec: 2D Sprite Avatar from CYOA Choices

## Purpose

Give players a visual identity derived from their CYOA character creation choices. The 2-minute CYOA ends with nation, playbook, and domain selection; those choices should generate a 2D sprite avatar that represents the player across the app (dashboard, profile, quest cards).

## Rationale

- **Character = visual identity**: The player character is currently abstract (name, nation, playbook). A sprite avatar makes the character tangible.
- **CYOA payoff**: Choices during onboarding should have visible consequences; the avatar is the payoff.
- **Game language**: WHO (nation, archetype) + WHERE (domain) map to visual representation.

## User Stories

### P1: Avatar config on character creation
**As a new player**, I want my CYOA choices (nation, playbook, domain) to generate an avatar configuration, so my character has a visual identity from the start.

**Acceptance**: On character creation (from CYOA or guided flow), `avatarConfig` is derived from nationId, playbookId, campaignDomainPreference and stored on Player.

### P2: Avatar component with fallback
**As a player**, I want to see my avatar in the app, or a fallback (initials/generic icon) when no avatar is configured, so I always have a visual representation.

**Acceptance**: Avatar component renders sprite when avatarConfig exists; otherwise renders initials or generic icon.

### P3: Avatar display surfaces
**As a player**, I want my avatar visible in dashboard header, profile, and quest cards, so my identity is consistent across the app.

**Acceptance**: Avatar appears in dashboard header, profile page, and quest card UI where player identity is shown.

### P4: Verification quest
**As a tester**, I want a certification quest that verifies avatar derivation and display, so I can validate the feature and earn vibeulons. Narrative: preparing the party for the Bruised Banana Fundraiser.

**Acceptance**: `cert-avatar-from-cyoa-v1` walks through CYOA completion, sign-up, and confirms avatar appears in dashboard/profile.

## Functional Requirements

- **FR1**: Player model MUST have `avatarConfig String?` (JSON). Schema change via Prisma.
- **FR2**: On character creation (createCampaignPlayer, guided flow), derive avatarConfig from nationId, playbookId, campaignDomainPreference. Options: (a) composable parts keyed by nation/playbook/domain, (b) sprite sheet with variants, (c) v1: one sprite per nation or per playbook.
- **FR3**: Avatar component MUST render sprite when avatarConfig exists; otherwise fallback to initials or generic icon.
- **FR4**: Avatar MUST be displayed in dashboard header, profile, and quest cards.
- **FR5**: Verification quest `cert-avatar-from-cyoa-v1` MUST be seeded by `npm run seed:cert:cyoa`.

## Non-functional Requirements

- v1: Use simple sprite mapping (e.g. nationId → sprite key; playbookId → variant). No sprite assets needed initially — use placeholder or generic icon keyed by config until assets exist.
- Fallback MUST always work (no broken images when config is invalid).

## Avatar Config Schema (JSON)

```json
{
  "nationKey": "string",
  "playbookKey": "string",
  "domainKey": "string",
  "variant": "string"
}
```

Keys are derived from nation.id/name, playbook.id/name, domain. For v1, `variant` can be "default" or derived from developmental hint.

## Out of Scope (v1)

- Custom sprite assets
- Avatar editing UI
- Animated sprites

## Reference

- Player model: [prisma/schema.prisma](../../prisma/schema.prisma)
- Character creation: [src/app/campaign/actions/campaign.ts](../../src/app/campaign/actions/campaign.ts)
- Dashboard: [src/app/page.tsx](../../src/app/page.tsx)
- Related: [lore-cyoa-onboarding](../lore-cyoa-onboarding/spec.md)
