---
name: spec-kit-discipline
description: Enforces the creation of spec kits before implementation. Use when planning new features or backlog items.
---

# Skill: Spec Kit Discipline

**Spec Kit is the implementation authority.** All feature work must flow from a spec kit rather than just an AI plan.

## Implementation Rule
1. **Spec kit exists first** — Create `.specify/specs/<spec-name>/` containing `spec.md`, `plan.md`, and `tasks.md` before implementing.
2. **Implementation follows tasks.md** — Execute tasks in order and use it as a checklist.
3. **Update tasks when done** — Check off completed tasks actively.

## When to Create Spec Kits
- New features or backlog items
- Emergent fixes that warrant documentation
- Any work tracked in `BACKLOG.md`

## Required Output
Each spec kit under `.specify/specs/<name>/` must have:
- `spec.md`: Requirements, user stories, schema, acceptance criteria
- `plan.md`: Implementation order, phases, file impacts
- `tasks.md`: Granular, checkable tasks

Always ensure this canonical artifact exists before proceeding to coding.
