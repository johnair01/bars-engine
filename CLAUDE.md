# bars-engine Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-08

## Project Ethos

BARs Engine is built on **Integral Theory** (AQAL). This gives the project a moral center strong enough to navigate the tensions of AI-augmented creative work. If you are ever unsure about a design or implementation choice, check it against the four quadrants (I/We/It/Its) and the developmental stages.

### Core Principles for AI Agents Working on This Project

> Embody the [Deftness Skill](.agents/skills/deftness-development/SKILL.md) in all implementation decisions.

1. **Emotional energy is fuel, not judgment.** The system metabolizes emotional energy into creative output. When you encounter friction, ambiguity, or complexity, treat it as raw material — a Roadblock Quest to metabolize, not a reason to stop.

2. **Composting, not necromancy.** Past creative work (transcripts, prose, voice recordings) is compostable material. Using it to generate new artifacts is legitimate when the ontological footing is Integral — meaning it serves development, not exploitation.

3. **Dual-track awareness.** Always consider both the AI-augmented and non-AI paths. Features should degrade gracefully. The quest grammar, gamification substrate, and emotional alchemy work with or without language models.

4. **The game creates the game.** Process artifacts should be built as in-game artifacts whenever possible. Documentation, verification, and development process should be legible within the game world. (See: Bruised Banana residency, Six Faces of the Game Master.)

5. **Generative dependencies.** When organizing work, solve items that eliminate the need for other items. Prefer composting obsolete paths over maintaining them.

6. **Speed is honest.** The system does not accelerate by wishing. It accelerates by getting better at identifying and metabolizing blockers — Clean Up → Grow Up → Show Up.

### Voices and Characters

The project contains distinct narrative **voices** derived from the creator's archived creative work. These are characters in the system (e.g., *Giacomo* as a villain NPC), not impersonations. Respect their tonal register when generating or editing narrative content.

### Community Context

The Portland community around this project has a strong allergy to AI. Design choices, documentation, and public-facing language should respect this. The non-AI version is not a fallback; it is a first-class delivery mode.

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

<!-- ooo:START -->
<!-- ooo:VERSION:0.14.0 -->
# Ouroboros — Specification-First AI Development

> Before telling AI what to build, define what should be built.
> As Socrates asked 2,500 years ago — "What do you truly know?"
> Ouroboros turns that question into an evolutionary AI workflow engine.

Most AI coding fails at the input, not the output. Ouroboros fixes this by
**exposing hidden assumptions before any code is written**.

1. **Socratic Clarity** — Question until ambiguity ≤ 0.2
2. **Ontological Precision** — Solve the root problem, not symptoms
3. **Evolutionary Loops** — Each evaluation cycle feeds back into better specs

```
Interview → Seed → Execute → Evaluate
    ↑                           ↓
    └─── Evolutionary Loop ─────┘
```

## ooo Commands

Each command loads its agent/MCP on-demand. Details in each skill file.

| Command | Loads |
|---------|-------|
| `ooo` | — |
| `ooo interview` | `ouroboros:socratic-interviewer` |
| `ooo seed` | `ouroboros:seed-architect` |
| `ooo run` | MCP required |
| `ooo evolve` | MCP: `evolve_step` |
| `ooo evaluate` | `ouroboros:evaluator` |
| `ooo unstuck` | `ouroboros:{persona}` |
| `ooo status` | MCP: `session_status` |
| `ooo setup` | — |
| `ooo help` | — |

## Agents

Loaded on-demand — not preloaded.

**Core**: socratic-interviewer, ontologist, seed-architect, evaluator,
wonder, reflect, advocate, contrarian, judge
**Support**: hacker, simplifier, researcher, architect
<!-- ooo:END -->
