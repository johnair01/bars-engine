# bars-engine Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-08

## Questions for Wendell go to the Council Board

Every question whose answer changes what gets built goes through the six faces' reach test and onto the Council
Board, https://bars-engine.vercel.app/board/council, never into chat. This holds in every session, mid-build,
and for any worker a session starts.

- Run the reach test first (`reach_test` in `council/faces.yaml`; the skill is `.claude/skills/six-faces/`). A
  question the record can answer becomes a position that stands unless he flips it.
- Board rows are written in the council's home repo, `wendell-britt/six-faces-council`, as rows posted with
  `board/post_rows.py` that the board-pull Action lands on main. Its `CLAUDE.md` holds the full rule.
- A chat reply says what changed and names the new board rows with the link. It ends without a question.
- A worker sees only its prompt and this file. Put this rule in the prompt of any worker that might ask him
  anything.

## Hand off before the context passes 150,000 tokens

A PostToolUse hook (`.claude/settings.json`, `council/tools/context_size.py --hook`, a copy of the council's) adds the
handoff order to every tool result once the session rereads 150,000 tokens a call. Finish the step, record the work in
the repo and on the board, send the coordinator the handoff, drop PR watches and resolve. Why: council #272.

Wendell, 2026-10-04: *"If you need rulings from me this should've gone to the council?"*

## UI Work — Read First

**Before any UI work:** Read [`UI_COVENANT.md`](UI_COVENANT.md) at the start of every session.

Session-start prompt for AI UI work:
> "Read `UI_COVENANT.md` before writing any UI code. Apply the three-channel encoding system (element=color, altitude=border, stage=density). Use CSS classes from `src/styles/cultivation-cards.css` for all game aesthetic. Use Tailwind only for layout. Reference `src/lib/ui/card-tokens.ts` for all color values."

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

## Stack

TypeScript, Next.js 14+, Prisma (PostgreSQL), Tailwind CSS, AI SDK. Source in `src/`, tests in `tests/`.

## Spec Workflow

- **Specs**: `.specify/specs/<feature>/` — each feature has spec.md, plan.md, tasks.md
- **Backlog prompts**: `.specify/backlog/prompts/` — paste into Claude Code for spec-driven work
- **Objective stack**: [.specify/backlog/BACKLOG.md](.specify/backlog/BACKLOG.md)

### Creating or expanding spec kits (read first)

Before authoring new feature specs, **read** [.agents/skills/spec-kit-translator/SKILL.md](.agents/skills/spec-kit-translator/SKILL.md) and scaffold from [.specify/spec-template.md](.specify/spec-template.md). The three-file folder alone is not enough: include Purpose/Practice where applicable, design decisions, conceptual model (WHO/WHAT/WHERE when relevant), data/API contracts before UI-heavy work, and a **Verification Quest** for user-facing changes (see skill § Verification Quests). After editing `BACKLOG.md`, run `npm run backlog:seed` per the skill. Rule reference: [.cursor/rules/spec-kit-plans.mdc](.cursor/rules/spec-kit-plans.mdc).

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

- `npx prisma migrate dev --name describe_change` — create migration; then `migrate deploy`; then `npm run db:record-schema-hash`
- `npm run db:generate` — regenerate Prisma Client (`db:sync` also generates; neither runs `db push` — see docs/PRISMA_MIGRATE_STRATEGY.md)

See [.cursor/rules/fail-fix-workflow.mdc](.cursor/rules/fail-fix-workflow.mdc).

## Key Docs

- [README.md](README.md), [ARCHITECTURE.md](ARCHITECTURE.md), [FOUNDATIONS.md](FOUNDATIONS.md)
- [docs/DEVELOPER_ONBOARDING.md](docs/DEVELOPER_ONBOARDING.md), [docs/ENV_AND_VERCEL.md](docs/ENV_AND_VERCEL.md)
- [docs/PRISMA_MIGRATE_STRATEGY.md](docs/PRISMA_MIGRATE_STRATEGY.md) — **`db push` forbidden**; `migrate deploy`, baselining, squash
- [docs/DB_STRATEGY.md](docs/DB_STRATEGY.md) — migrations-only workflow

<!-- MANUAL ADDITIONS END -->

<!-- ooo:START -->
<!-- ooo:VERSION:0.14.0 -->

## Ouroboros

Specification-first `ooo` commands and agents: [docs/OUROBOROS.md](docs/OUROBOROS.md) (moved out of this file 2026-10-30 so every session that attaches this repo opens smaller).
