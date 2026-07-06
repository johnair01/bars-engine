# Plan: Joy / Bliss Coverage

## Phase 1: Taxonomy

Document player-native blocker shapes that may call for joy/bliss work.

Impacted files:

- `.specify/specs/joy-bliss-coverage/spec.md`
- `.specify/specs/joy-bliss-coverage/candidate-tools.md` new

Implementation:

1. Define joy/bliss as participation, not entertainment.
2. Define blocker shapes from player language.
3. Distinguish reported blocker from inferred channel.
4. Document anti-bypass risks.

## Phase 2: Candidate Tool Prototype

Prototype Make It A Game without updating the registry yet.

Impacted files:

- `.specify/specs/joy-bliss-coverage/candidate-tools.md` new

Primary candidate:

- Make It A Game

Supporting modes:

- Real Good Scan / Happy Apples
- Find The Live Part
- Game Container

The candidate must include:

1. Generic name.
2. BARS name.
3. Core mechanic.
4. Six Game Master frames.
5. WAVE mode support.
6. Move-role support: metabolize / transcend / translate.
7. Protocol steps.
8. Expected outputs.
9. Completion criteria.
10. When not to use.
11. Handoff rules to sadness, fear, anger, or neutrality.

## Phase 3: Seven Hostile Cases

Generate the hostile case matrix.

Impacted files:

- `.specify/specs/joy-bliss-coverage/hostile-cases.md` new

Cases:

1. Dead Path.
2. Not Fun Enough.
3. Too Many Possibilities.
4. Performing Brightness.
5. Guilt About Good.
6. Joy Exposes Desire.
7. Overpromise.

For each case:

1. Player-native blocker.
2. Desired satisfaction.
3. Make It A Game mode.
4. Proposed game output.
5. Bypass risks.
6. Handoff needs.
7. Pass/fail.

## Phase 4: Comparison Review

Compare tool candidates before implementation.

Impacted files:

- `.specify/specs/joy-bliss-coverage/comparison-review.md` new

Review questions:

1. Does Make It A Game handle metabolize joy?
2. Does Make It A Game handle transcend joy?
3. Which modes carry which cases?
4. Where does it bypass sadness/fear/anger?
5. Which outputs are most playable?
6. Does Make It A Game belong in MVP?
7. What scoring changes would be needed if selected?

## Phase 5: Decision Gate

Choose one path.

Options:

1. Add Make It A Game as MVP.
2. Keep Happy Apples / Find The Live Part as separate tools.
3. Keep Make It A Game as a future tool and leave joy/bliss yellow.
4. Keep joy/bliss yellow and research more.

No code changes to `tool-registry.ts`, recommendation scoring, or overlay status should happen until the decision is written.

## Phase 6: Implementation Follow-Up

Only after decision:

Potential impacted files:

- `src/lib/alchemy/tool-registry.ts`
- `src/lib/allyship-deck/practice-recommendations.ts`
- `src/lib/allyship-deck/practice-overlays.ts`
- relevant tests

Possible implementation:

1. Add or promote selected tool.
2. Add joy/bliss blocker hints.
3. Tune vector-family metadata if needed.
4. Update recommendation quality tests.
5. Update overlay pilot review.
