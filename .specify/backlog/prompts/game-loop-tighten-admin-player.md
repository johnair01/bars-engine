# Backlog Prompt: Game Loop Tighten — Admin vs Player

**Strand**: `kfp71utqm82lolhvpgm6vvr4`  
**Spec**: [.specify/specs/game-loop-tighten-admin-player/STRAND_OUTPUT.md](../specs/game-loop-tighten-admin-player/STRAND_OUTPUT.md)

## Problem

Two user types (player, admin) with conflated needs. More admin tools than player experiences. Goal: Admin generates player content → players unlock opportunities → admin creates more. Content that matters: completing campaign quests.

**Admin need**: One-button press to create easily editable, grammatical quests from a given context.

**Explore blockers proactively** instead of hitting them blindly.

## Scope

1. **Admin one-click quest generation**
   - Unified API: `generateQuestFromContext(context)` — campaignRef, kotterStage, slotId, domain, template?
   - Output: grammatical (Epiphany Bridge or Kotter), easily editable (CustomBar + Twine or passages)
   - Campaign linkage: auto-attach to slot/thread or manual placement

2. **Player completion loop**
   - Discovery: players find campaign quests
   - Completion: what blocks?
   - Unlock: when player completes, what unlocks for admin? (funding, stage advance, new slot)

3. **Separation**
   - Admin vs player UX. Reduce conflation.

## References

- `src/actions/quest-grammar.ts` — compileQuestWithAI, generateQuestOverviewWithAI
- `src/actions/generate-quest.ts` — generateQuestFromReading, generateGrammaticQuestFromReading
- `src/actions/gameboard.ts` — slot generation, compileQuestWithAI
- `src/app/admin/quest-grammar/` — unpacking, compile, publish
- `src/app/campaign/board/GameboardClient.tsx` — handleCreateQuestForAid
- `src/lib/bar-quest-generation/` — BAR → proposal
