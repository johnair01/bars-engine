# Tasks: CYOA Ritual Nursery Rooms

## Phase 1: Spatial Nursery Infrastructure — COMPLETE

- [x] P1-1: Seed 20 national move names into Nation model
- [x] P1-2: Create 20 canonical NationMove rows
- [x] P1-3: Create buildSpokeIntroRoom() room template
- [x] P1-4: Create buildNurseryRoom() for 4 types
- [x] P1-5: Write seed-nursery-rooms.ts script
- [x] P1-6: Seed rooms for BB spoke 0 and verify rendering
- [x] P1-7: Implement face NPC anchor + interaction modal (NPCs impassable)
- [x] P1-8: Reroute spoke portal to intro room
- [x] P1-10: Test hub → spoke → intro → nurseries end-to-end

## Phase 1.5: Move Library Integration — COMPLETE

- [x] P1.5-1: Save 52-move library to repo (move-library.json + archetype-move-library.json)
- [x] P1.5-2: Create typed accessor (move-library-accessor.ts)
- [x] P1.5-3: Enrich 20 NationMove DB rows with full library schema in effectsSchema
- [x] P1.5-4: Seed 32 archetype moves as NationMove rows (using archetypeId FK)

## Phase 2: Move-Driven Ritual Experience — COMPLETE

- [x] P2-1: Build NurseryRitualFlow component (4-phase: intro → core → bar → complete)
- [x] P2-2: Build ThreeTwoOneDialogue component (It... You... I... for Clean Up)
- [x] P2-3: Build StructuredBarReflection component (bar_prompt_template + 4 reflection fields)
- [x] P2-4: Build launchNurseryRitual() server action (resolve nation + archetype + face → moves)
- [x] P2-5: Wire nursery activity anchor to NurseryRitualFlow
- [x] P2-6: Persist face selection across room navigation (URL params)
- [x] P2-7: Build completeNurseryRitual() server action (CustomBar creation)

## Phase 2.5: Game Loop Closure — COMPLETE

- [x] A1-A3: Enrich completeNurseryRitual() — hub receipt + SpokeMoveBed planting + vibeulons
- [x] A4: Update NurseryRitualFlow completion phase — show BAR + vibeulons + planted badge
- [x] A5: Build getNurseryCompletionState() server action (check SpokeMoveBed)
- [x] A6: Update NurseryActivityModal — show completion state when nursery already done
- [x] B1: Add welcome_text anchor to intro room builder + Pixi colors
- [x] B2: Render campaign welcome overlay in intro room
- [ ] A7: Test: complete ritual → BAR planted on spoke → receipt in hub → vibeulons awarded
- [ ] A8: Test: re-enter completed nursery → see BAR summary, not "Begin Ritual"
- [ ] B3: Prepend campaign name to face NPC greetings when narrativeKernel available
- [ ] B4: Test: enter intro room → see campaign welcome text

## Phase 3: Polish + Template Extraction — FUTURE

- [ ] P3-1: Face voice templates — authored prose per face wrapping move mechanics
- [ ] P3-2: NarrativeTemplate extraction (4-category spine)
- [ ] P3-3: Verification quest cert-nursery-ritual-v1
- [ ] P3-4: Update BACKLOG.md with spec priority
