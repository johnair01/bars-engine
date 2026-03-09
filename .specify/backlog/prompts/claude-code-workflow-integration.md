# Prompt: Claude Code Workflow Integration

**Use this prompt when onboarding contributors to Claude Code or maintaining CLAUDE.md.**

## Prompt text

> Follow the spec in [.specify/specs/claude-code-workflow-integration/spec.md](../specs/claude-code-workflow-integration/spec.md): CLAUDE.md must include workflow guidance so contributors using Claude Code can integrate with the spec workflow. Add content between `<!-- MANUAL ADDITIONS START -->` and `<!-- MANUAL ADDITIONS END -->` covering: (1) Spec Workflow — specs in `.specify/specs/<feature>/`, backlog prompts in `.specify/backlog/prompts/`, BACKLOG.md; (2) Agent Context Refresh — run `./.specify/scripts/bash/update-agent-context.sh claude` when switching branches or after pulling; (3) Fail-Fix Workflow — `npm run build` and `npm run check` must pass before proceeding; `npm run db:sync` after schema changes; (4) Key Docs — README, ARCHITECTURE, FOUNDATIONS, docs/DEVELOPER_ONBOARDING, docs/ENV_AND_VERCEL. Ensure Commands section lists build, check, db:sync, update-agent-context. Do not remove or overwrite content outside the Manual Additions block.

## Checklist when setting up Claude Code for a contributor

1. Install Claude Code extension in Cursor (Extensions → search "Claude Code").
2. Run `./.specify/scripts/bash/update-agent-context.sh claude` to create/refresh CLAUDE.md.
3. Verify CLAUDE.md Manual Additions block contains workflow guidance (if not, apply this prompt).
4. Point contributor to [docs/DEVELOPER_ONBOARDING.md](../../docs/DEVELOPER_ONBOARDING.md) for env and verification steps.

## Reference

- Spec: [.specify/specs/claude-code-workflow-integration/spec.md](../specs/claude-code-workflow-integration/spec.md)
- Plan: [.specify/specs/claude-code-workflow-integration/plan.md](../specs/claude-code-workflow-integration/plan.md)
- CLAUDE.md: [CLAUDE.md](../../../CLAUDE.md)
