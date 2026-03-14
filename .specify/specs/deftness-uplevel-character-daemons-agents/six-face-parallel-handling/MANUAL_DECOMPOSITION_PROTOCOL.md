# Manual Decomposition Protocol (v0)

**Per** [six-face-parallel-handling/spec.md](spec.md) — DC-6 Phase 1

Human decomposes feature; assigns to faces; runs agents sequentially or manually parallel.

## When to Use

- Feature request spans multiple domains (schema + UI + copy + quest design)
- You want to parallelize work across the six Game Master faces
- Before v1/v2 automation is mature

## The Six Faces and Their Domains

| Face | Domain | Example Tasks |
|------|--------|---------------|
| **Shaman** | Mythic, belonging, ritual, identity | Character resonance, daemon discovery, talisman design |
| **Challenger** | Action, edge, proving ground | Validation flows, quest completion logic, gameboard UX |
| **Regent** | Order, structure, roles | Schema changes, playbook updates, campaign structure |
| **Architect** | Strategy, blueprint, quest design | Quest grammar, CYOA flow, character creation |
| **Diplomat** | Relational, care, connector | Copy, community narrative, feedback loops |
| **Sage** | Integration, coordination, meta | Cross-cutting synthesis, backlog coordination |

## Decomposition Template

For each feature, fill out:

```markdown
## Feature: [Name/ID]

**Description**: [1–2 sentences]

### Tasks by Face

| Face | Task | Dependencies |
|------|------|--------------|
| Shaman | [Concrete task] | - |
| Challenger | [Concrete task] | - |
| Regent | [Concrete task] | - |
| Architect | [Concrete task] | - |
| Diplomat | [Concrete task] | - |
| Sage | [Integration/synthesis task] | Shaman, Challenger, Regent, Architect, Diplomat |

### Execution Order

1. [Independent tasks can run in parallel]
2. [Dependent tasks after their deps]
3. Sage synthesis last
```

## Manual Execution

1. **Decompose** — Use the template above; assign each sub-task to a face.
2. **Invoke** — Call each face via backend API or `run-parallel-feature` script (v1).
3. **Collect** — Gather outputs (spec, plan, copy, schema, etc.).
4. **Synthesize** — Sage or human combines outputs; resolve conflicts.
5. **Review** — Human reviews before commit.

## Backend Endpoints (v1+)

- `POST /api/agents/{face}/task` — Run a generic task for a face
- `POST /api/agents/sage/consult` — Decomposition and synthesis prompts

## Example

**Feature**: Add daemon discovery to onboarding

| Face | Task |
|------|------|
| Shaman | Design the 321 Wake Up variant for daemon discovery |
| Architect | Add /daemons route and discovery flow |
| Regent | Add Daemon, DaemonSummon models to schema |
| Diplomat | Copy for discovery success and summon ritual |
| Challenger | Validation: complete discovery, summon, use move |
| Sage | Synthesize: ensure flow coherence, no gaps |
