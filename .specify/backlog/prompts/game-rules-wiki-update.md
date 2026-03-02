# Prompt: Game Rules Wiki Update — BAR Ecology, Decks, Quests, Vibeulons, Compost, Slot Market

**Use this prompt when implementing the game rules wiki update. Wiki update only — no code changes to game logic or schema.**

## Context

Update the game rules wiki to include newly designed mechanics: BARs as seeds/cards, private vs public membrane, quadrant tagging, anonymity and stewardship, deck/hand/in-play states (Dominion/Pokemon-style), vibeulon economics and provenance, compost heap lifecycle and destruction, quest BAR slots (FCFS, withdrawal, displacement via merge/buyout), capacity and refinement progression. Tone: dojo/ecology, not bureaucratic. No AQAL jargon in onboarding; human-language quadrant only.

## Prompt text

> Implement the Game Rules Wiki Update per [.specify/specs/game-rules-wiki-update/spec.md](../specs/game-rules-wiki-update/spec.md). Create a coherent "Rules" section in the wiki with: (1) BARs: Private vs Public — notebook vs spellbook, membrane rule, refinement required. (2) BAR Format: brevity + quadrant (About me, About something happening, About us, About the system). (3) Anonymity + Stewardship Adoption — anonymous toggle, anyone can adopt, persistence. (4) Decks: Library / Equipped / In Play / Compost / Destroyed — equipped does nothing passively. (5) Quests + BAR Slots + Minting — fixed slots, FCFS, 1 vibeulon per played BAR on completion. (6) Compost Heap — composting, transformation requirement, expiration, destruction (BAR + attached vibeulons), ecological tone. (7) Slot Offers — voluntary withdrawal (1 vibeulon cost), merge/buyout, public offers, time-based override, response window. (8) Capacity + Refinement Progression — hand size expands via refinement. (9) Design Principles — Vibes Must Flow, Signal→Seed→Cultivation→Action→Treasure, Sense/Respond. (10) Glossary — BAR, Vibeulon, Quest, Stewardship, Compost, Equipped, In Play, Quadrant. Content in `content/rules/*.md`; wiki pages at `/wiki/rules` and `/wiki/rules/[slug]`. Use game language: WHAT (BARs, Quests), Energy (vibeulons), Clean Up (compost). Tone: dojo/ecology.

## Checklist

- [ ] Create content/rules/*.md for all 9 sections
- [ ] Create /wiki/rules index page
- [ ] Create /wiki/rules/[slug] dynamic route (or individual pages)
- [ ] Implement markdown rendering (ReactMarkdown)
- [ ] Add Rules section to wiki index
- [ ] Expand glossary with new terms
- [ ] Verify internal consistency (minting, compost, equipping, slots)
- [ ] Verify tone (dojo/ecology)

## Reference

- Spec: [.specify/specs/game-rules-wiki-update/spec.md](../specs/game-rules-wiki-update/spec.md)
- Plan: [.specify/specs/game-rules-wiki-update/plan.md](../specs/game-rules-wiki-update/plan.md)
- Tasks: [.specify/specs/game-rules-wiki-update/tasks.md](../specs/game-rules-wiki-update/tasks.md)
- FOUNDATIONS.md (BAR as kernel, vibeulons)
- Existing wiki: [src/app/wiki/](../../src/app/wiki/)
