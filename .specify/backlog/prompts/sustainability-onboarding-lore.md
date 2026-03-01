# Prompt: Sustainability and Onboarding Lore

**Use this prompt when implementing the sustainability and onboarding lore for the wiki. Unblocks narrative throughput by providing a coherent story for onboarding, financial model, journey (player → workshop → coaching → consulting), and how the app stays sustainable.**

## Context

The Bruised Banana Residency is being created so that the Mastering the Game of Allyship campaign can be developed. The Bruised Banana Residency is a **dependency** on developing both:
- Mastering the Game of Allyship
- A Bruised Banana Organization instance

This emerged from joint ventures and connections between campaigns and instances. The lore should reflect this dependency chain and the relationship between campaigns and instances.

**Integral Emergence / AI agents**: AI agents act as NPCs in the game. They can create and resolve quests, make I Ching draws, and (future) create quests that call in archetypes from hexagrams for players to create next. Agents are Kotter-stage-context-aware (quest thread or campaign). To other users they appear as regular players. Design goal: real users outpace AI via collaboration and ability to mint vibeulons from their real lives. AI agents can only mint vibeulons by completing story quests — not from capital injections or real-world actions. Exception: agents can acquire vibeulons via Admin 3-2-1 shadow process infusion (see [admin-agent-forge](admin-agent-forge.md)).

## Prompt text

> Implement the Sustainability and Onboarding Lore per [.specify/specs/sustainability-onboarding-lore/spec.md](../specs/sustainability-onboarding-lore/spec.md). Create `/wiki/onboarding-path` (flagship program Mastering the Game of Allyship, support pyramid workshops → coaching → consulting, tiered unlocks, quest creation from financial participation, value proposition). Create `/wiki/sustainability` (dual model non-profit Patreon + profit licensing, first goal Bruised Banana Residency, vibeulon minting from playing + capital injections, Patreon MVP early access). Create `/wiki/integral-emergence` (AI agents as NPCs; can create/resolve quests; can only mint vibeulons by completing story quests; can make I Ching draws; future: quests that call in archetypes from hexagrams for players to create next; agents Kotter-stage-context-aware; appear as regular players; design goal = real users outpace AI via collaboration + minting vibeulons from real lives). Expand `/wiki/campaign/bruised-banana` with sustainability goal, connection to Mastering the Game of Allyship, and dependency context (Residency enables Mastering Allyship campaign + Bruised Banana Org instance; emerged from joint ventures and connections between campaigns and instances). Add "Sustainability & Onboarding" section to wiki index (onboarding-path, sustainability, integral-emergence); update lore-index with Mastering the Game of Allyship, Integral Emergence, AI agents. Use game language: WHO (players, coaches, consultants, AI agents), WHAT (quests from financial participation), WHERE (allyship domains), Energy (vibeulons), personal throughput (4 moves).

## Checklist

- [ ] Create `src/app/wiki/onboarding-path/page.tsx`
- [ ] Create `src/app/wiki/sustainability/page.tsx`
- [ ] Create `src/app/wiki/integral-emergence/page.tsx` (AI agents, vibeulon constraints, I Ching/archetypes, Kotter context, human advantage)
- [ ] Expand `src/app/wiki/campaign/bruised-banana/page.tsx` with sustainability goal, flagship connection, dependency context
- [ ] Add "Sustainability & Onboarding" section to `src/app/wiki/page.tsx` (onboarding-path, sustainability, integral-emergence)
- [ ] Update `content/lore-index.md` with Mastering the Game of Allyship, Integral Emergence, AI agents
- [ ] (Optional) Add "Learn more" link to Event page Wake Up section

## Reference

- Spec: [.specify/specs/sustainability-onboarding-lore/spec.md](../specs/sustainability-onboarding-lore/spec.md)
- Plan: [.specify/specs/sustainability-onboarding-lore/plan.md](../specs/sustainability-onboarding-lore/plan.md)
- Tasks: [.specify/specs/sustainability-onboarding-lore/tasks.md](../specs/sustainability-onboarding-lore/tasks.md)
- Related: [lore-index-knowledge-base](lore-index-knowledge-base.md), [lore-cyoa-onboarding](lore-cyoa-onboarding.md), [bruised-banana-onboarding-flow](../../specs/bruised-banana-onboarding-flow/spec.md)
