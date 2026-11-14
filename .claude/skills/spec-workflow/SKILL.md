---
name: spec-workflow
description: Spec-driven work in bars-engine. Use when writing or expanding a spec kit in .specify/specs/, working from a backlog prompt or BACKLOG.md, refreshing the agent context after switching branches or pulling specs, or running Ouroboros (ooo) commands.
---

# Spec workflow in bars-engine

Moved out of `CLAUDE.md` on 2026-11-05 (steer-slim change 4, Wendell's answer A on `sr-rules-to-principles`) so every
session that attaches this repo opens smaller. The text below is as it stood in `CLAUDE.md`.

## Spec Workflow

- **Specs**: `.specify/specs/<feature>/` — each feature has spec.md, plan.md, tasks.md
- **Backlog prompts**: `.specify/backlog/prompts/` — paste into Claude Code for spec-driven work
- **Objective stack**: [.specify/backlog/BACKLOG.md](../../../.specify/backlog/BACKLOG.md)

### Creating or expanding spec kits (read first)

Before authoring new feature specs, **read** [.agents/skills/spec-kit-translator/SKILL.md](../../../.agents/skills/spec-kit-translator/SKILL.md) and scaffold from [.specify/spec-template.md](../../../.specify/spec-template.md). The three-file folder alone is not enough: include Purpose/Practice where applicable, design decisions, conceptual model (WHO/WHAT/WHERE when relevant), data/API contracts before UI-heavy work, and a **Verification Quest** for user-facing changes (see skill § Verification Quests). After editing `BACKLOG.md`, run `npm run backlog:seed` per the skill. Rule reference: [.cursor/rules/spec-kit-plans.mdc](../../../.cursor/rules/spec-kit-plans.mdc).

## Agent Context Refresh

Run when switching branches or after pulling new specs:

```bash
./.specify/scripts/bash/update-agent-context.sh claude
```

- On a feature branch: uses that spec's plan.md
- On main: uses specs/main/plan.md

## Ouroboros

Specification-first `ooo` commands and agents: [docs/OUROBOROS.md](../../../docs/OUROBOROS.md).
