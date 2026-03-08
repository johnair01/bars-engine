# Prompt: I Ching Alignment and Game Master Sects

**Use this prompt when implementing aligned I Ching draws and Game Master sect framing.**

## Context

The I Ching draw IS the campaign deck. Upgrade it so draws produce only quests aligned with the player's next available step — a function of game clock (instance kotterStage), nation, archetype, and developmental lens (Game Master face). Game Masters are reframed as Taoist sect heads; players choose to show up to a sect, learn missions, and align with the campaign.

## Prompt text

> Implement the I Ching Alignment and Game Master Sects per [.specify/specs/iching-alignment-game-master-sects/spec.md](../specs/iching-alignment-game-master-sects/spec.md). Create `src/lib/iching-alignment.ts` with `getAlignmentContext`, `scoreHexagramAlignment`, `drawAlignedHexagram`. Create `.agent/context/game-master-sects.md` with FACE_TRIGRAM_PREFERENCE. Modify `castIChing` to use aligned draw instead of random. Modify `generateQuestCore` to pass kotterStage, nationName, activeFace into AI prompt and extend cache key. Use NATION_AFFINITIES from elemental-moves, KOTTER_STAGES from kotter, getHexagramStructure from iching-struct. Playbook→trigram from PLAYBOOK_TRIGRAM config (The Bold Heart→Heaven, The Devoted Guardian→Earth, etc.). Run `npm run build` and `npm run check` — fail-fix.

## Checklist

- [ ] Phase 1: Create game-master-sects.md with FACE_TRIGRAM_PREFERENCE
- [ ] Phase 2: Create iching-alignment.ts (getAlignmentContext, scoreHexagramAlignment, drawAlignedHexagram)
- [ ] Phase 3: Modify castIChing to use drawAlignedHexagram
- [ ] Phase 4: Modify generateQuestCore with campaign context in prompt and cache key
- [ ] Phase 5: Verification (manual test alignment)

## Reference

- Spec: [.specify/specs/iching-alignment-game-master-sects/spec.md](../specs/iching-alignment-game-master-sects/spec.md)
- Plan: [.specify/specs/iching-alignment-game-master-sects/plan.md](../specs/iching-alignment-game-master-sects/plan.md)
- Tasks: [.specify/specs/iching-alignment-game-master-sects/tasks.md](../specs/iching-alignment-game-master-sects/tasks.md)
- Related: [game-master-face-sentences](../specs/game-master-face-sentences/spec.md), [campaign-kotter-domains](../specs/campaign-kotter-domains/spec.md)
