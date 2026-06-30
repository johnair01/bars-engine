# Claude Design Handoff Review

## Verdict

The prototype is directionally strong and should become the interaction reference for Lenses onboarding. Its best move is making the player author goals through a repeated workshop loop:

```text
free-write -> make up to 10 options -> keep up to 5 -> lock in
```

This is more humane than a suggestion-first flow. It keeps Wishcraft-style dreaming alive, preserves player authorship, and avoids turning the superpower quiz into a deterministic personality assignment.

## Adopt

- Use the mobile-first screen sequence from `design-handoff/README.md`.
- Treat superpower as a prompt/reflection lens, not as a goal generator.
- Preserve the ambient 10-minute timer that never blocks, scores, or shames.
- Persist free-write text and discarded options as dream notes.
- Keep parked lenses/goals as wise focus, never failure.
- Preserve the Tap the Vein handoff framing: lenses notice resonance; they do not assign tasks.
- Preserve explicit BAR planting. Do not auto-create BARs from every captured task.

## Hostile Findings

- **P0: Prototype only descends Health.** Production must descend every kept goal across Relationships, Career, Money, Health, and Allyship. A Health-only descent would break the user's stated product goal.
- **P1: "Keep up to five" can create too much work.** The UX needs a parent goal/lens picker and visible progress so descent feels guided, not like a combinatorial spreadsheet.
- **P1: Earlier spec over-weighted suggestions.** The design correctly moves away from generated goals. Implementation should use deterministic prompt seeds and examples, not mysterious authority.
- **P1: Dream notes are now promised.** If discarded options disappear, the copy lies and narrowing will feel like loss.
- **P2: Tap the Vein resonance source is undecided.** We need to choose player-tagged, heuristic, or both. The rule is that resonance is noticing alignment, not assigning obligation.

## Implementation Implication

The first shippable version should prioritize the authoring engine and lineage model over visual polish:

1. Workshop state and persistence.
2. `LensGoal` lineage across cadences.
3. All-five-domain descent coverage.
4. Tap the Vein task-to-goal resonance.
5. Explicit Plant-a-BAR gate with lineage.

