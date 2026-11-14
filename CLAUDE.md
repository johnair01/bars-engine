# bars-engine Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-08

## Questions for Wendell go to the Council Board

Every question whose answer changes what gets built goes through the reach test and onto the Council Board,
https://bars-engine.vercel.app/board/council, never into chat, in every session and for any worker a session starts.
Full rule and steps: the council repo's `AGENTS.md` (`wendell-britt/six-faces-council`). A chat reply says what changed,
names the new board rows with the link, and ends without a question. Put this rule in the prompt of any worker that
might ask him anything.

## Test locally before you push: there are no Vercel previews

Since 2026-11-04 Vercel builds production only (merges to `main`); a branch gets no preview. Every session starts,
tests and shows its change locally. Full procedure: [`docs/LOCAL_FIRST_TESTING.md`](docs/LOCAL_FIRST_TESTING.md).

- Start: `scripts/local/dev.sh dev` (local Postgres, a database for this workspace, `next dev` on a free port; prints
  the URL). Sign in as `admin@admin.local` / `password`, or player id `test-admin`. Stop: `scripts/local/dev.sh stop`.
- Before pushing: `scripts/local/check.sh --build`. It replaces the Vercel preview as the build check;
  name the command and its result in the pull request.
- Show Wendell: a cloud session's `localhost` is the container, which he cannot open. Take pictures with
  `AS=test-admin OUT=/mnt/project-files/looks/<name> scripts/local/dev.sh shot /page ...`, read them yourself, then
  attach them or carry them into a look row. On his Mac (Remote Control) give him the `http://localhost:<port>` URL.
- Never point local runs at production. A dev server refuses a non-local `DATABASE_URL` and a local build skips
  `prisma migrate deploy` on one; `BARS_ALLOW_REMOTE_DB=1` is for a deliberate, named exception only. Do not run
  `vercel env pull` to get a database, and do not create hosted preview deployments as routine testing.
- A change that only Vercel can show (middleware, crons, Blob, Vercel-only env) says "needs hosted check" in its pull
  request; the options are in the guide, section 7.

## Ship once a day: do not merge your own pull request

Wendell, 2026-11-04 (council board `lf-daily-ship`, answer A). Every merge to `main` is a production build, so threads
no longer self-merge in bars-engine. When `scripts/local/check.sh --build` is green and no look gates the pull request
(`board/answered.py --pr N` in the council repo), mark it ready for review and add the `ship-next` label, then stop. One
shipping session a day merges every `ship-next` pull request in one batch (`docs/LOCAL_FIRST_TESTING.md` section 7).
Only an urgent fix (production down, payment or sign-in broken) merges straight to `main` by hand, and its description
says why. Council pull requests are unchanged.

## Hand off before the context passes 150,000 tokens

A PostToolUse hook adds the handoff order once the session rereads 150,000 tokens a call. Finish the step, record the
work in the repo and on the board, send the coordinator the handoff, drop PR watches and resolve (council #272).

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

## Spec work

Spec kits (`.specify/specs/`), the backlog, the agent-context refresh and Ouroboros (`ooo`) are in the skill
`.claude/skills/spec-workflow/SKILL.md`; load it when the work touches a spec.

## Fail-Fix Workflow

Before moving on, verify (on the local database, docs/LOCAL_FIRST_TESTING.md):

- `scripts/local/check.sh --build` — `npm run check` (lint + type-check), vitest, and the full `npm run build`

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

Ouroboros (`ooo`): `.claude/skills/spec-workflow/SKILL.md`.
