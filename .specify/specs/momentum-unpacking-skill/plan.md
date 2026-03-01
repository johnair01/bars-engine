# Plan: Momentum Unpacking Skill

## Architecture

### Skill Location

Project skill: `.cursor/skills/momentum-unpacking-skill/` (in bars-engine) or personal: `~/.cursor/skills/momentum-unpacking-skill/`

Recommendation: Project skill so it lives with the backlog and can reference `.specify/` paths.

### Skill Structure

```
momentum-unpacking-skill/
├── SKILL.md                    # Main instructions
└── unpacking-questions.md      # Full question set + mapping to backlog
```

### Interaction Flow

1. **Trigger**: User says "I want more momentum" or similar.
2. **Phase 1 — Unpack**: Agent asks questions 1–3 (outcome, feeling, current state). Can ask all 3 in one message.
3. **Phase 2 — Blockers**: Agent asks questions 4–6 (what's in the way, conditions, reservations). Can ask all 3 in one message.
4. **Phase 3 — Generate**: Agent reads BACKLOG.md, applies matching logic, outputs next steps.

**Shortcut**: If user provides rich context ("I'm stuck on onboarding copy quality"), agent may skip or abbreviate questions and go straight to backlog interface.

### Backlog Matching Logic

| User Answer Signal | Backlog Filter |
|--------------------|----------------|
| "copy," "prose," "quality" | UI specs; cert feedback (copy-related) |
| "mechanics," "flow," "UX" | UI specs; certification quests |
| "quests," "personalization" | assignOrientationThreads; quest assignment specs |
| "shipping," "triumph" | Emergent blocker; Ready items with no deps |
| "admin edit," "can't edit" | onboarding-adventures-unification |
| "House," "Bruised Banana" | House integration priority (AH, U, V, W, X) |

Default when unclear: Use House integration priority order.

## File Impacts

| File | Change |
|------|--------|
| .cursor/skills/momentum-unpacking-skill/SKILL.md | Create: skill body, trigger, flow, backlog interface |
| .cursor/skills/momentum-unpacking-skill/unpacking-questions.md | Create: 6 questions + mapping table |
| .specify/backlog/BACKLOG.md | Add backlog item + prompt link (optional) |

## Verification

- Invoke: "I want more momentum on shipping"
- Agent asks unpacking questions (or proceeds if context given)
- Agent outputs next steps with spec links from BACKLOG
