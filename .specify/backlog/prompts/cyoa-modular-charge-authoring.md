# Prompt: CYOA Modular Charge Authoring (Lego-robotics UX)

**Use for:** implementation prep, **strand: consult**, or Sage-led integration after the six-face investigation.

## Context

Modular CYOA: **charge metabolization** → typed **story blocks** (Lego-robotics-style UX) → grammatical graphs → Twee/Twine export. Research: [docs/CYOA_MODULAR_AUTHORING_RESEARCH.md](../../docs/CYOA_MODULAR_AUTHORING_RESEARCH.md).

## MCP gate (do not skip)

```bash
npm run verify:bars-agents-mcp
```

Then **Cursor → Settings → MCP → bars-agents** ON; reload window if needed. See `docs/AGENT_WORKFLOWS.md` § MCP availability.

## Strand: consult (required before Phase 2 build)

1. Open [.specify/specs/cyoa-modular-charge-authoring/STRAND_CONSULT_SIX_FACES.md](../specs/cyoa-modular-charge-authoring/STRAND_CONSULT_SIX_FACES.md).
2. Run a multi-agent / strand investigation in order: **Shaman → Architect → Challenger → Regent → Diplomat → Sage**.
3. Each face: observations, risks, recommendations (see brief for questions).
4. **Sage** produces synthesis + `tasks.md` deltas; optionally append to `STRAND_OUTPUT.md` in the spec folder.

## Prompt text (implementation agent)

> Implement **only** checked tasks in [.specify/specs/cyoa-modular-charge-authoring/tasks.md](../specs/cyoa-modular-charge-authoring/tasks.md). Spec: [.specify/specs/cyoa-modular-charge-authoring/spec.md](../specs/cyoa-modular-charge-authoring/spec.md). Do **not** start Phase 2 until Phase 0 consult tasks are satisfied or explicitly waived by maintainer.

## Reference

| Doc | Path |
|-----|------|
| Spec | [.specify/specs/cyoa-modular-charge-authoring/spec.md](../specs/cyoa-modular-charge-authoring/spec.md) |
| Plan | [.specify/specs/cyoa-modular-charge-authoring/plan.md](../specs/cyoa-modular-charge-authoring/plan.md) |
| Tasks | [.specify/specs/cyoa-modular-charge-authoring/tasks.md](../specs/cyoa-modular-charge-authoring/tasks.md) |
| Six-face brief | [.specify/specs/cyoa-modular-charge-authoring/STRAND_CONSULT_SIX_FACES.md](../specs/cyoa-modular-charge-authoring/STRAND_CONSULT_SIX_FACES.md) |
| Strand system | [.specify/specs/strand-system-bars/spec.md](../specs/strand-system-bars/spec.md) |

## bars-agents quick map

| Face | Tools |
|------|-------|
| Shaman | `shaman_read`, `shaman_identify` |
| Regent | `regent_assess` |
| Challenger | `challenger_propose` |
| Architect | `architect_draft`, `architect_compile` |
| Diplomat | `diplomat_guide`, `diplomat_bridge` |
| Sage | `sage_consult` |
