---
description: Narrative game loop approach to testing
---

# Narrative Testing

Frame tests as quests to make verification engaging.

## The Loop

```
SETUP → CHALLENGE → ACTION → OUTCOME → REWARD
```

1. **Setup**: Create test character/scenario
2. **Challenge**: Introduce feature to test
3. **Action**: Execute the flow
4. **Outcome**: Log success/failure
5. **Reward**: Celebrate or debug

## Test Characters

- **The Wanderer**: New user, no account
- **The Veteran**: Returning player, existing account
- **The Creator**: User who makes quests/bars
- **The Keeper**: Admin user

## Quest Template

```markdown
## Quest: "[Name]"
- **Hero**: [Character]
- **Goal**: [What they're trying to do]
- **Steps**: [Numbered actions]
- **Victory**: [Success condition]
- **Defeat**: [Failure condition]
```

## Example

```markdown
## Quest: "The New Arrival"
- **Hero**: The Wanderer
- **Goal**: Join the Conclave
- **Steps**:
  1. Enter email at the gate
  2. Speak name and secret word
  3. Choose nation and playbook
- **Victory**: Dashboard shows welcome
- **Defeat**: Error message or redirect failure
```
