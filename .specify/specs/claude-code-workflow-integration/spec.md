# Spec: Claude Code Workflow Integration

## Purpose

Enable contributors using Claude Code (in Cursor or standalone) to integrate into the bars-engine spec workflow. CLAUDE.md is the primary project context file Claude Code reads; it must include clear guidance on specs, backlog, fail-fix, and how to run the agent-context update script.

**Problem**: Contributors who install Claude Code and open bars-engine lack context on how to work with `.specify/` specs, backlog prompts, and project conventions. They may skip the fail-fix workflow or not know how to refresh CLAUDE.md when switching features.

**Practice**: Spec Kit first — contributors use specs and backlog prompts as the source of truth. CLAUDE.md surfaces that workflow.

## Design Decisions

| Topic | Decision |
|-------|----------|
| CLAUDE.md content source | Auto-generated sections (from update-agent-context.sh) + Manual Additions block for workflow guidance |
| Spec structure | `.specify/specs/<feature>/` with spec.md, plan.md, tasks.md |
| Agent context refresh | `./.specify/scripts/bash/update-agent-context.sh claude` — run when switching branches or after pulling new specs |
| Fail-fix | `npm run build` and `npm run check` must pass before proceeding; documented in .cursor/rules and CLAUDE.md |

## User Stories

### P1: Contributor discovers spec workflow
**As a contributor** using Claude Code in bars-engine, I want CLAUDE.md to explain the spec structure (spec.md, plan.md, tasks.md) and where to find backlog prompts, so I can work from specs instead of ad-hoc prompts.

**Acceptance**: CLAUDE.md includes a "Spec Workflow" section that points to `.specify/specs/`, `.specify/backlog/prompts/`, and BACKLOG.md.

### P2: Contributor refreshes agent context
**As a contributor** who has switched to a feature branch or pulled new specs, I want to know how to refresh CLAUDE.md with that feature's plan, so Claude Code has up-to-date context.

**Acceptance**: CLAUDE.md documents the command `./.specify/scripts/bash/update-agent-context.sh claude` and when to run it (branch switch, after pull).

### P3: Contributor follows fail-fix
**As a contributor** implementing a feature, I want CLAUDE.md to remind me to run `npm run build` and `npm run check` before moving on, so I don't commit broken code.

**Acceptance**: CLAUDE.md includes a "Fail-Fix Workflow" section with the verification commands.

### P4: Contributor uses backlog prompts
**As a contributor** picking up a backlog item, I want to know that backlog prompts in `.specify/backlog/prompts/` contain ready-to-use prompts that reference the spec, so I can paste them into Claude Code.

**Acceptance**: CLAUDE.md explains backlog prompts and points to BACKLOG.md for the objective stack.

## Functional Requirements

- **FR1**: CLAUDE.md Manual Additions block includes: Spec Workflow (structure, paths), Agent Context Refresh (command, when to run), Fail-Fix Workflow (build, check), Backlog Prompts (location, usage).
- **FR2**: Commands section in CLAUDE.md lists: `npm run build`, `npm run check`, `npm run db:sync` (when schema changes), `./.specify/scripts/bash/update-agent-context.sh claude`.
- **FR3**: Key docs referenced: README.md, ARCHITECTURE.md, FOUNDATIONS.md, docs/DEVELOPER_ONBOARDING.md, docs/ENV_AND_VERCEL.md.
- **FR4**: Backlog prompt created at `.specify/backlog/prompts/claude-code-workflow-integration.md` for contributors setting up or maintaining Claude Code integration.
- **FR5**: BACKLOG.md includes an entry for this spec (Claude Code Workflow Integration).

## Non-Functional Requirements

- Manual Additions content must not be overwritten by update-agent-context.sh (the script preserves content between `<!-- MANUAL ADDITIONS START -->` and `<!-- MANUAL ADDITIONS END -->`).
- Content should be concise; contributors can follow links for detail.

## Out of Scope

- Changing update-agent-context.sh behavior.
- Supporting other agents (Gemini, Copilot) in this spec — they have their own agent files.
- Cursor-specific rules (those stay in .cursor/rules).

## Verification

- Open bars-engine in Cursor with Claude Code extension.
- Read CLAUDE.md — it clearly explains spec workflow, agent refresh, fail-fix, and backlog prompts.
- Run `./.specify/scripts/bash/update-agent-context.sh claude` — Manual Additions block is preserved.
- Use backlog prompt when onboarding a new contributor to Claude Code.

## References

- update-agent-context.sh: [.specify/scripts/bash/update-agent-context.sh](../../scripts/bash/update-agent-context.sh)
- Fail-Fix Workflow: [.cursor/rules/fail-fix-workflow.mdc](../../../.cursor/rules/fail-fix-workflow.mdc)
- Developer Onboarding: [docs/DEVELOPER_ONBOARDING.md](../../../docs/DEVELOPER_ONBOARDING.md)
- Env Seed Scripts (similar contributor-facing spec): [.specify/specs/env-seed-scripts-onboarding/spec.md](../env-seed-scripts-onboarding/spec.md)
