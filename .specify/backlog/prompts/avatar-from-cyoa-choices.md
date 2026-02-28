# Prompt: 2D Sprite Avatar from CYOA Choices

**Use this prompt when implementing player avatars derived from CYOA/campaign choices.**

## Context

The player character is currently abstract (name, nation, playbook). The 2-minute CYOA ends with character creation; those choices (nation, playbook, domain, developmental assessment) should generate a visual identity: a 2D sprite avatar. The avatar becomes the player's representation across the app (dashboard, profile, quest cards, map).

## Prompt text

> Implement 2D sprite avatars derived from CYOA choices. Add avatarConfig (String?, JSON) to Player schema. On character creation (from CYOA or guided flow), derive avatarConfig from nationId, playbookId, campaignDomainPreference (or domain choice), and optionally developmental assessment. Options: (a) composable sprite parts keyed by nation/playbook/domain, (b) sprite sheet with variants selected by config, (c) v1: one sprite per nation or per playbook. Create Avatar component that renders the sprite; fallback to initials or generic icon when no avatar. Display avatar in dashboard header, profile, quest cards. Use game language: character = visual identity in the game.

## Checklist

- [ ] Schema: Player.avatarConfig (String?, JSON)
- [ ] Derive avatarConfig on character creation from nation, playbook, domain
- [ ] Avatar component (renders sprite or fallback)
- [ ] Sprite assets or sprite sheet (nation/playbook keyed)
- [ ] Display avatar in dashboard, profile, quest UI
- [ ] db:sync after schema change

## Reference

- Player model: [prisma/schema.prisma](../../prisma/schema.prisma)
- Character creation: [src/actions/conclave.ts](../../src/actions/conclave.ts), [src/app/campaign/actions/campaign.ts](../../src/app/campaign/actions/campaign.ts)
- Dashboard: [src/app/page.tsx](../../src/app/page.tsx)
- Related: [event-driven-cyoa-developmental-assessment](event-driven-cyoa-developmental-assessment.md)
