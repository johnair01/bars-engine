# Prompt: Event-Driven CYOA with Developmental Assessment

**Use this prompt when implementing the ~2 minute onboarding CYOA built from event page content, with developmental assessment and character creation.**

## Context

The CYOA is a "2-minute ride" where players learn about themselves and how they want to engage with the event. It uses event page content (Wake Up, Show Up, theme) as the narrative backbone, weaves in developmental assessment questions, and ends with character creation (nation, playbook, domain) and a 2D sprite avatar derived from choices.

## Prompt text

> Implement the event-driven CYOA per spec. Build a ~2 minute CYOA from instance/event page content (wakeUpContent, showUpContent, theme, targetDescription, kotterStage). Add developmental assessment nodes that "take the temperature" of the player's developmental level (Integral Theory, stages/lines). Store responses in storyProgress. End with sign-up and character creation (nation, playbook, domain). Use campaignState + developmental assessment to personalize orientation quests via assignOrientationThreads. Derive avatarConfig from CYOA choices for 2D sprite avatar (see avatar-from-cyoa-choices prompt). Use game language: WHO (nation, playbook), WHAT (quests), WHERE (allyship domains), developmental level for personalization.

## Checklist

- [ ] Event content → CYOA passages pipeline (instance fields drive narrative nodes)
- [ ] Developmental assessment nodes (choice-based questions mapped to stages/lines)
- [ ] Store developmental signal in player.storyProgress
- [ ] assignOrientationThreads accepts personalization params (nationId, playbookId, allyshipDomains, developmental hint)
- [ ] Orientation quests vary by campaign choices when applicable
- [ ] Handoff to avatar generation (avatarConfig from choices)
- [ ] Verification quest for full onboarding flow

## Reference

- Event page: [src/app/event/page.tsx](../../src/app/event/page.tsx)
- Instance fields: wakeUpContent, showUpContent, theme, targetDescription, kotterStage
- Guided onboarding: [src/app/conclave/guided/page.tsx](../../src/app/conclave/guided/page.tsx)
- Quest thread assignment: [src/actions/quest-thread.ts](../../src/actions/quest-thread.ts)
- Lore (developmental): [FOUNDATIONS.md](../../FOUNDATIONS.md), [docs/handbook/world/story_context.md](../../docs/handbook/world/story_context.md)
- Related: [avatar-from-cyoa-choices](avatar-from-cyoa-choices.md)
