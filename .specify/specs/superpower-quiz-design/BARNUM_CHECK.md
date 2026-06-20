# Barnum / Forer Self-Check — Superpower Descriptions

> The antidote to the Barnum effect is **differentiation**: a result is only
> diagnostic if some takers would *reject the wrong type*. Per
> [RESEARCH_quiz-construction.md](./RESEARCH_quiz-construction.md) §4 [b7]: show a
> person a *foreign* type's description; if it lands as well as their own, the copy
> is vacuous. This doc records the manual check on `quiz/descriptions.ts`.

## Method
For each superpower description, ask:
1. **Falsifiable?** Could a reader honestly say "that's *not* me"?
2. **Behavioral, not adjectival?** Does it name what the person *does*, not vague
   praise ("creative," "caring")?
3. **Shadow present?** Does it include a real downside (favorability not equalized)?
4. **No two-sided hedge?** No "you're X but also the opposite of X."
5. **Cross-distinct?** Would it read as *wrong* for an adjacent type?

## Review

| Superpower | Falsifiable behavioral claim | Shadow (rejectable) | Distinct from neighbor |
|-----------|------------------------------|---------------------|------------------------|
| Connector | "the right introduction at the right moment; your work is invisible because it works" | over-mediates, burns out absorbing others' feelings | ≠ Coach (intro vs next-step) ✔ |
| Storyteller | "move people from rage to triumph by reframing the story they're trapped inside" | the Manipulator / the Lost Author | ≠ Disruptor (reframe vs break) ✔ |
| Strategist | "see the whole board and the move three steps out; find the leverage" | analysis paralysis / won't act without a perfect plan | ≠ Coach (plan vs push) ✔ |
| Disruptor | "feel the fire when something's broken and name it" | the Chaos Bringer / the Caged Rebel | ≠ Coach (break system vs nudge person) ✔ |
| Alchemist | "you don't just feel emotion — you move it" | Emotional Overload / Detached Observer | ≠ Storyteller (feeling vs framing) ✔ |
| Escape Artist | "see the cage before the walls close in; leaving is a skill" | the Martyr / the Ghost | ≠ Coach (leave system vs leave a level) ✔ |
| Coach | "help people remember their own power by abandoning the level they've outgrown" | the Taskmaster / the Empty Cheerleader | ≠ Disruptor (softened, person not system) ✔ |

## Findings
- **No two-sided hedges** found. Each description commits to a stance.
- **Every description carries a shadow** — favorability is not equalized (a key
  anti-Barnum requirement and an ethos fit: "energy is fuel, not judgment").
- **Behavioral anchors** present in every gift line; no pure-adjective profiles.
- **Adjacency risk:** Coach overlaps conceptually with Disruptor / Strategist /
  Escape Artist (by design — it's the integrator). Mitigation: Coach copy is
  explicitly framed as *softened, person-not-system, level-not-cage*, and the quiz
  reports **primary + secondary**, so a near-Coach reads honestly as "Coach with a
  Strategist secondary," not a forced single label.

## Action items
- [ ] Optional: live A/B — show testers a foreign type's description during the
      verification quest; confirm they rate their own as a better fit.
- [ ] Re-run this check whenever `descriptions.ts` changes.
