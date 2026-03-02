# Prompt: Market Redesign for Launch

**Use this prompt when implementing the Market redesign for the Bruised Banana launch.**

## Prompt text

> Implement the Market Redesign spec per [.specify/specs/market-redesign-launch/spec.md](../specs/market-redesign-launch/spec.md). The Market shows only player-created quests (quests players make for each other). System quests live in Adventures. Make it easy to filter quests and explore what people want. (1) Change getMarketContent to exclude system quests for all users, (2) Add allyship domain pills and improve filter UI, (3) Update empty states, (4) NavBar: "PLAY" on both mobile and desktop (remove carrot-only on mobile), (5) Add verification quest cert-market-redesign-v1. Use game language: Market = peer commissions; Adventures = campaign content.

## Checklist

- [ ] getMarketContent: isSystem: false for all users
- [ ] Allyship domain pills in filter bar
- [ ] Clear all resets domain selection
- [ ] Empty state: no quests globally vs filtered
- [ ] Remove System badge from QuestCard (no system quests in Market)
- [ ] NavBar: "PLAY" on mobile and desktop
- [ ] Add cert-market-redesign-v1 to seed-cyoa-certification-quests.ts

## Reference

- Spec: [.specify/specs/market-redesign-launch/spec.md](../specs/market-redesign-launch/spec.md)
- Plan: [.specify/specs/market-redesign-launch/plan.md](../specs/market-redesign-launch/plan.md)
- Tasks: [.specify/specs/market-redesign-launch/tasks.md](../specs/market-redesign-launch/tasks.md)
