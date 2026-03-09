# Plan: Nation Move Profiles v0

## Overview

Implement Nation Move Profiles as an Emotional Alchemy-integrated overlay on the Transformation Move Library. Each nation maps to one emotion channel (fear, anger, sadness, neutrality, joy) and has developmental emphasis, move style modifiers, and quest flavor modifiers. Profiles influence move selection weighting and prompt phrasing.

## Phases

### Phase 1: Profile Data

- Add `src/lib/narrative-transformation/moves/nation-profiles.ts` (or extend existing).
- Define NationMoveProfile type: nationId, emotionChannel, element, developmentalEmphasis, preferredMoves, moveStyleModifiers, questFlavorModifiers, exampleMoveFlavors.
- Implement profiles for all 5 nations (Argyra, Pyrakanth, Lamenth, Meridia, Virelune).
- Implement getNationMoveProfile(nationId).

### Phase 2: Selection Overlay

- Implement applyNationOverlay(coreMoves, profile): weight/order moves by developmentalEmphasis.
- Integrate with selectMoves in Transformation Move Library.
- Ensure prompts use moveStyleModifiers and exampleMoveFlavors when nationId provided.

### Phase 3: Quest Flavor

- Implement applyNationQuestFlavor(questSeed, profile): incorporate questFlavorModifiers.
- Ensure quest seeds vary by nation (Argyra vs Pyrakanth vs Lamenth feel different).

### Phase 4: Tests

- Unit tests: getNationMoveProfile, applyNationOverlay.
- Integration: nation profiles influence move selection and quest seed output.

## Implementation Layout

```
src/lib/narrative-transformation/moves/
  nation-profiles.ts   # Extend with emotion_channel, full profile model
  selectMoves.ts       # Use applyNationOverlay
  questSeed.ts         # Use applyNationQuestFlavor
```

## Out of Scope

- Separate transformation engines per nation.
- Bypassing core WCGS moves.
- Large move libraries.
