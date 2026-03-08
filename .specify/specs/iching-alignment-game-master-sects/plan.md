# Plan: I Ching Alignment and Game Master Sects

## Summary

Implement alignment scoring for I Ching draws: (1) create `iching-alignment.ts` with `getAlignmentContext`, `scoreHexagramAlignment`, `drawAlignedHexagram`; (2) create Game Master sect lore; (3) modify `castIChing` to use aligned draw; (4) modify `generateQuestCore` to pass campaign context to AI prompt. Target: I Ching produces only quests aligned with player's next available step (game clock, nation, archetype, developmental lens).

## Prerequisites

- [Campaign Kotter Domains](../campaign-kotter-domains/spec.md) — instance.kotterStage
- [Game Master Face Sentences](../game-master-face-sentences/spec.md) — 6 faces, active_face in storyProgress

## Phase 1: Alignment Context

### New file: `src/lib/iching-alignment.ts`

**getAlignmentContext(playerId)**:
- Fetch player with nation, playbook
- Fetch active instance (getActiveInstance)
- Parse player.storyProgress for `state.active_face`
- Derive Nation name from nationId (db.nation.findUnique)
- Derive playbook trigram: need playbook → trigram mapping. Options:
  - Add `trigram` field to Playbook model (schema change)
  - Use config in iching-alignment: `PLAYBOOK_TRIGRAM: Record<playbookName, Trigram>`
  - Parse playbook.description for "Element: X" (existing pattern in story-clock)
- Return IChingAlignmentContext

```ts
export type IChingAlignmentContext = {
  kotterStage: number | null
  nationName: string | null
  playbookTrigram: string | null
  activeFace: string | null
}
```

## Phase 2: Alignment Scoring

### scoreHexagramAlignment(hexagramId, context)

- Use `getHexagramStructure(hexagramId)` for upper/lower trigrams
- Kotter: current stage trigram from KOTTER_STAGES[context.kotterStage]
- Nation: NATION_AFFINITIES[context.nationName]
- Archetype: context.playbookTrigram
- Sect: FACE_TRIGRAM_PREFERENCE[context.activeFace] (new config)
- Return score + breakdown

### drawAlignedHexagram(context)

- If context.kotterStage == null: return random 1–64 (current behavior)
- Score all 64 hexagrams
- Build pool: hexagrams with score >= 1, or top 16 by score
- Weighted random: weight = score (or score^2 for stronger preference)
- Return hexagramId

## Phase 3: Game Master Sect Lore

### New file: `.agent/context/game-master-sects.md`

- Define 6 faces as sect heads
- FACE_TRIGRAM_PREFERENCE: Shaman→Earth, Challenger→Fire, Regent→Lake, Architect→Heaven, Diplomat→Wind, Sage→Mountain (example; can tune)
- Document "serving a Game Master" — how players choose and align

## Phase 4: Modify castIChing

### File: `src/actions/cast-iching.ts`

- After playerId check: call `getAlignmentContext(playerId)`
- Replace `Math.floor(Math.random() * 64) + 1` with `drawAlignedHexagram(context)`
- Optional: log alignment score in dev (when hexagram returned)

## Phase 5: Enrich generateQuestCore

### File: `src/actions/generate-quest.ts`

- Fetch alignment context (or accept as param from caller)
- Extend system prompt with:
  - "Campaign stage: N - {stageName}. Align quest with this phase."
  - "Player's nation: {nationName}. Consider nation affinities."
  - "Developmental lens: {activeFace}. Align with this sect's mission."
- Extend cache inputKey: `${hexagramId}:${playbookId}:${lensKey}:${kotterStage}:${nationName}:${activeFace}`

## File Impacts

| Action | Path |
|--------|------|
| Create | src/lib/iching-alignment.ts |
| Create | .agent/context/game-master-sects.md |
| Modify | src/actions/cast-iching.ts |
| Modify | src/actions/generate-quest.ts |

## Playbook → Trigram Mapping

Need a source for playbook name → trigram. Options:
- **A**: Add to seed-utils or prisma: Playbook has `trigram` or `element` field
- **B**: Static config in iching-alignment.ts keyed by playbook name
- **C**: Parse playbook.description for "Element: Heaven" etc. (fragile)

Recommend **B** for MVP: `PLAYBOOK_TRIGRAM: Record<string, Trigram>` in iching-alignment.ts, populated from player_archetypes.md mapping (The Bold Heart→Heaven, The Devoted Guardian→Earth, etc.).

## Implementation Order

1. Create game-master-sects.md with FACE_TRIGRAM_PREFERENCE
2. Create iching-alignment.ts (getAlignmentContext, scoreHexagramAlignment, drawAlignedHexagram)
3. Modify castIChing
4. Modify generateQuestCore
5. Run npm run build and npm run check — fail-fix

## Verification

- Cast I Ching with active instance at stage 1; hexagram should include Thunder (upper or lower)
- Cast with Argyra nation; prefer Heaven/Wind hexagrams
- generateQuestCore receives and uses kotterStage, nationName, activeFace in prompt
