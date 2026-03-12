# Skill: Momentum Unpacking

Helps the user get momentum on a desired outcome by asking unpacking questions, then interfacing with the backlog to generate the next step. Use when the user expresses desire for momentum, feels stuck, asks "what's next," wants help shipping, or mentions emergent blockers or dissatisfaction.

## Purpose

When the user recognizes they want more momentum, this skill:
1. Asks a version of the 6 unpacking questions (adapted from Admin Agent Forge)
2. Reads the backlog and related sources
3. Outputs 1–3 prioritized next steps with spec links

## Trigger Terms

- momentum, stuck, what's next, help me ship
- emergent blockers, shipping blockers, dissatisfaction
- copy quality, mechanics, quest quality (dissatisfaction areas)

## Flow

1. **Phase 1 — Unpack**: Ask questions 1–3 (outcome, feeling, current state). Can batch 2–3 per message.
2. **Phase 2 — Blockers**: Ask questions 4–6 (what's in the way, conditions, reservations).
3. **Phase 3 — Generate**: Ensure backlog is current, then read [.specify/backlog/BACKLOG.md](.specify/backlog/BACKLOG.md), apply matching logic, output next steps.

**Shortcut**: If user provides rich context (e.g. "I'm stuck on onboarding copy quality"), skip or abbreviate questions and go straight to backlog interface.

## Backlog Interface

**Backlog freshness**: Before reading the backlog (e.g. when switching machines), run `npm run backlog:fetch -- --write-md` to fetch from API and update BACKLOG.md. On the machine with DB, run `npm run backlog:regen` to refresh from database.

**Sources**: [.specify/backlog/BACKLOG.md](../../.specify/backlog/BACKLOG.md), [.specify/specs/bruised-banana-house-integration/ANALYSIS.md](../../.specify/specs/bruised-banana-house-integration/ANALYSIS.md)

**Logic**:
- Filter Ready items (`[ ] Ready`)
- Apply House integration priority when relevant: AH → U → V, W, X
- Match user answers to backlog categories (see unpacking-questions.md)

**Output format**:
```
## Next steps

1. **[ID]** [Feature Name](path/to/spec.md) — [one-line rationale]
2. ...
```

## Additional Resources

- Full 6 questions + mapping: [unpacking-questions.md](unpacking-questions.md)
- Spec: [.specify/specs/momentum-unpacking-skill/spec.md](../../.specify/specs/momentum-unpacking-skill/spec.md)
