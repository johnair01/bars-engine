# Plan: Claude Code Workflow Integration

## Goal

Add workflow guidance to CLAUDE.md so contributors using Claude Code can integrate with the spec workflow, refresh agent context, and follow fail-fix conventions.

## Technical Context

**Language/Version**: N/A (documentation)
**Primary Dependencies**: N/A
**Storage**: N/A
**Project Type**: Documentation / contributor onboarding

## Implementation

### Phase 1: CLAUDE.md Manual Additions

Add content between `<!-- MANUAL ADDITIONS START -->` and `<!-- MANUAL ADDITIONS END -->` in [CLAUDE.md](../../../CLAUDE.md):

1. **Spec Workflow**
   - Specs live in `.specify/specs/<feature>/` with spec.md, plan.md, tasks.md
   - Backlog prompts in `.specify/backlog/prompts/` — paste into Claude Code for spec-driven work
   - BACKLOG.md: [.specify/backlog/BACKLOG.md](../../backlog/BACKLOG.md) — objective stack

2. **Agent Context Refresh**
   - Run `./.specify/scripts/bash/update-agent-context.sh claude` when:
     - Switching to a feature branch (uses that spec's plan.md)
     - After pulling new specs
     - On main: uses specs/main/plan.md

3. **Fail-Fix Workflow**
   - Before moving on: `npm run build` and `npm run check` must pass
   - After schema changes: `npm run db:sync`
   - See [.cursor/rules/fail-fix-workflow.mdc](../../../.cursor/rules/fail-fix-workflow.mdc)

4. **Key Docs**
   - [README.md](../../../README.md), [ARCHITECTURE.md](../../../ARCHITECTURE.md), [FOUNDATIONS.md](../../../FOUNDATIONS.md)
   - [docs/DEVELOPER_ONBOARDING.md](../../../docs/DEVELOPER_ONBOARDING.md), [docs/ENV_AND_VERCEL.md](../../../docs/ENV_AND_VERCEL.md)

### Phase 2: Commands Section

Ensure CLAUDE.md Commands section (or Manual Additions) lists:
- `npm run build` — full build
- `npm run check` — lint + type-check
- `npm run db:sync` — after prisma/schema.prisma changes
- `./.specify/scripts/bash/update-agent-context.sh claude` — refresh agent context

### Phase 3: Backlog Prompt

Create [.specify/backlog/prompts/claude-code-workflow-integration.md](../../backlog/prompts/claude-code-workflow-integration.md) for contributors setting up or maintaining Claude Code integration.

### Phase 4: BACKLOG.md Entry

Add Claude Code Workflow Integration to [.specify/backlog/BACKLOG.md](../../backlog/BACKLOG.md).

## Verification

- CLAUDE.md Manual Additions block contains all workflow sections
- Run update-agent-context.sh — Manual Additions preserved
- Backlog prompt exists and references spec
- BACKLOG.md has entry
