# bars-engine Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-08

## Active Technologies
- TypeScript, Next.js 14+ + Prisma, Tailwind CSS, AI SDK (main)
- PostgreSQL (Prisma ORM) (main)

- (main)

## Project Structure

```text
src/
tests/
```

## Commands

# Add commands for 

## Code Style

: Follow standard conventions

## Recent Changes
- main: Added TypeScript, Next.js 14+ + Prisma, Tailwind CSS, AI SDK
- main: Added TypeScript, Next.js 14+ + Prisma, Tailwind CSS, AI SDK

- main: Added

<!-- MANUAL ADDITIONS START -->

## Spec Workflow

- **Specs**: `.specify/specs/<feature>/` — each feature has spec.md, plan.md, tasks.md
- **Backlog prompts**: `.specify/backlog/prompts/` — paste into Claude Code for spec-driven work
- **Objective stack**: [.specify/backlog/BACKLOG.md](.specify/backlog/BACKLOG.md)

## Agent Context Refresh

Run when switching branches or after pulling new specs:

```bash
./.specify/scripts/bash/update-agent-context.sh claude
```

- On a feature branch: uses that spec's plan.md
- On main: uses specs/main/plan.md

## Fail-Fix Workflow

Before moving on, verify:

- `npm run build` — full Next.js build
- `npm run check` — lint + type-check

After modifying `prisma/schema.prisma`:

- `npm run db:sync` — push schema, regenerate Prisma Client

See [.cursor/rules/fail-fix-workflow.mdc](.cursor/rules/fail-fix-workflow.mdc).

## Key Docs

- [README.md](README.md), [ARCHITECTURE.md](ARCHITECTURE.md), [FOUNDATIONS.md](FOUNDATIONS.md)
- [docs/DEVELOPER_ONBOARDING.md](docs/DEVELOPER_ONBOARDING.md), [docs/ENV_AND_VERCEL.md](docs/ENV_AND_VERCEL.md)

<!-- MANUAL ADDITIONS END -->
