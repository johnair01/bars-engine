# Tasks: Nation Move Profiles v0

## Phase 1: Profile Data

- [x] **T1.1** Define NationMoveProfile type with emotionChannel, developmentalEmphasis, moveStyleModifiers, questFlavorModifiers (`NationMoveProfileV1` + `NationMoveProfile` alias in `nation-profiles.ts`).
- [x] **T1.2** Implement getNationMoveProfile(nationId) returning full profile.
- [x] **T1.3** Add profiles for Argyra, Pyrakanth, Lamenth, Meridia, Virelune.

## Phase 2: Selection Overlay

- [x] **T2.1** Implement applyNationOverlay(bundle, profile) — coerces each stage to nation’s `NATION_STAGE_MOVE_PREFERENCE` when id is off-list.
- [x] **T2.2** Nation-aware selection: `selectDefaultMoveIds` + `NATION_STAGE_MOVE_PREFERENCE` in `pickForStage` (existing); overlay helper for post-hoc bundles.
- [x] **T2.3** `generateRegistryQuestSeed` passes `emotion_channel` from nation profile into `assembleQuestSeed` renderContext (prompt templates with `{emotion_channel}`).

## Phase 3: Quest Flavor

- [x] **T3.1** `applyNationQuestFlavor` merges profile into `NarrativeQuestSeed` (`emotion_channel`, `nation_move_profile_id`, `quest_flavor_tags`, `nation_flavor`).
- [x] **T3.2** `generateQuestSeed` calls `applyNationQuestFlavor`; seeds differ by `nationId` (nation_flavor + channel).

## Phase 4: Tests

- [x] **T4.1** `moves/__tests__/nation-profiles.test.ts`.
- [x] **T4.2** Tests cover profile lookup, overlay, flavor, and `generateQuestSeed` variance by nation.

