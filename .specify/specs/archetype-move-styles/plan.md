# Plan: Archetype Move Styles v0

## Overview

Implement Archetype Move Styles as an overlay on the Transformation Move Library. Use the 8 canonical trigram-linked Playbooks (The Bold Heart, The Devoted Guardian, etc.). Archetype key = playbook slug (bold-heart, devoted-guardian, etc.). Profiles influence prompt phrasing and quest style.

## Phases

### Phase 1: Profile Data

- Add `src/lib/narrative-transformation/moves/archetype-profiles.ts`.
- Define ArchetypeMoveStyle type.
- Implement profiles for all 8 archetypes.
- Implement getArchetypeMoveStyle(archetypeKey).

### Phase 2: Selection Overlay

- Implement applyArchetypeOverlay(moves, profile): modify prompt phrasing via promptModifiers.
- Integrate with selectMoves in Transformation Move Library.
- Use archetypeKey = playbook slug (resolve from playbookId or playbook name if needed).

### Phase 3: Quest Flavor

- Add archetype_style to QuestSeed.
- Implement applyArchetypeQuestFlavor(questSeed, profile).

### Phase 4: Tests

- Unit tests: getArchetypeMoveStyle, applyArchetypeOverlay.
- Integration: archetype profiles influence move selection and quest output.

## Implementation Layout

```
src/lib/narrative-transformation/moves/
  archetype-profiles.ts
  selectMoves.ts       # Use applyArchetypeOverlay
  questSeed.ts         # Add archetype_style
```

## Archetype Key Resolution

- Input: archetypeKey (playbook slug) or playbookId.
- If playbookId: resolve Playbook.name → slugify → archetypeKey.
- Slugify: "The Bold Heart" → "bold-heart" per avatar-utils.
