# Tasks: Game Master Face Sentences

## Phase 1: Canonical Face Sentences in Path_*_Start

- [x] **1.1** Create `src/lib/face-sentences.ts` (or equivalent) exporting canonical face sentences keyed by face (shaman, challenger, regent, architect, diplomat, sage).
- [x] **1.2** Update Path_Sh_Start.json: Replace or prepend "(Entering Shaman Path)" with Shaman face sentence. Keep `<<set $active_face = "shaman">>`.
- [x] **1.3** Update Path_Ch_Start.json: Challenger face sentence.
- [x] **1.4** Update Path_Re_Start.json: Regent face sentence.
- [x] **1.5** Update Path_Ar_Start.json: Architect face sentence.
- [x] **1.6** Update Path_Di_Start.json: Diplomat face sentence.
- [x] **1.7** Update Path_Sa_Start.json: Sage face sentence.

## Phase 2: Integration (when BB integrates 6 Faces)

- [ ] **2.1** When Center_ChooseLens (or equivalent) is added to BB flow: Ensure face sentence is displayed when player selects face, and `$active_face` is set for template resolution.
- [ ] **2.2** Template resolver: Include `faceCopy` (or face sentences) in context when `$active_face` is set, for nodes that use `{{faceCopy.intro}}` etc.
- [ ] **2.3** Quest assignment: Confirm `assignOrientationThreads` / `assignGatedThreads` use `completed_shaman`, etc. for face-aligned quests when available.

## Verification

- [x] **V1** Play wake-up flow; select each of 6 faces; confirm face sentence appears in Path_*_Start.
- [ ] **V2** When 6 Faces in BB: Add cert quest step to verify face sentence in flow.
- [x] **V3** Manual: Confirm face sentences match spec table (no typos, correct face mapping).
