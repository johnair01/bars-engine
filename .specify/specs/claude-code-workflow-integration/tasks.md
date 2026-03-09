# Tasks: Claude Code Workflow Integration

## Phase 1: CLAUDE.md Manual Additions

- [ ] Add Spec Workflow section (specs path, backlog prompts, BACKLOG.md)
- [ ] Add Agent Context Refresh section (command, when to run)
- [ ] Add Fail-Fix Workflow section (build, check, db:sync)
- [ ] Add Key Docs section (README, ARCHITECTURE, FOUNDATIONS, DEVELOPER_ONBOARDING, ENV_AND_VERCEL)
- [ ] Add Commands list (build, check, db:sync, update-agent-context)

## Phase 2: Backlog Prompt

- [ ] Create `.specify/backlog/prompts/claude-code-workflow-integration.md`
- [ ] Prompt references spec and checklist for contributors

## Phase 3: BACKLOG.md

- [ ] Add Claude Code Workflow Integration entry to BACKLOG.md

## Verification

- [ ] Run `./.specify/scripts/bash/update-agent-context.sh claude` — Manual Additions preserved
- [ ] CLAUDE.md is readable and actionable for a new contributor
