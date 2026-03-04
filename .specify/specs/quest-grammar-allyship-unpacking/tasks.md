# Tasks: Quest Grammar Allyship Unpacking

## Phase 1: Types and Input Shape

- [ ] Define `AllyshipUnpackingAnswers` and `AllyshipQuestCompileInput` in types.ts (or separate file).
- [ ] Define experience options: Gather Resource, Skillful Organizing, Raise Awareness, Direct Action.
- [ ] Define life state options: Flowing, Stalled, Neutral.
- [ ] Define move options: Wake Up, Clean Up, Grow Up, Show Up.
- [ ] Investigate BAR/quest schema for moveType and quest-type mapping.

## Phase 2: Form UX

- [x] Add allyship mode toggle (or campaign-aware default) to UnpackingForm. — Default: experience dropdown, move dropdown, multi-select (via quest-grammar-ux-flow Phase 1)
- [x] When allyship mode: replace Q1 with experience dropdown.
- [x] Replace Q3 with life state dropdown (Flowing, Stalled, Neutral) + "How far do you feel from your creation?" short text.
- [x] Replace Q6 with multi-select (checkboxes) for reservations + short text for context.
- [x] Replace aligned action input with move dropdown (Wake Up, Clean Up, Grow Up, Show Up).
- [x] Preserve mobile-first, CYOA-style layout.

## Phase 3: Compilation

- [ ] Implement `compileQuestAllyship` (or extend compileQuest) that accepts allyship input.
- [ ] Map experience, life state, reservations, move → QuestPacket.
- [ ] Ensure quest type reflects selected move (moveType or equivalent on output).
- [ ] Integrate with compileQuestWithAI if AI enhancement is used.

## Phase 4: Verification

- [ ] Manual test: allyship form produces coherent output.
- [ ] Verify quest type per move is correct.
- [ ] Verify multi-select reservations flow through to node text.

## Verification

- [ ] Unpacking form: allyship mode shows experience, life state, multi-select reservations, move dropdown.
- [ ] Compile & Preview: output reflects move type; nodes are coherent.
- [ ] Mobile-first layout preserved.
