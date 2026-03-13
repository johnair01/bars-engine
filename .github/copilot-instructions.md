# GitHub Copilot Instructions — BARs Engine

## What This Project Is

BARs Engine is a narrative-driven quest system built on **Integral Theory** (AQAL). It powers choose-your-own-adventure experiences where players complete quests, metabolize emotional energy into Vibeulons (inspiration currency), and evolve through four moves: Wake Up, Clean Up, Grow Up, Show Up.

The app is also a vehicle for **creative composting** — metabolizing the creator's past creative voice (transcripts, prose, recordings) into new narrative artifacts. This is not extraction; it is transmutation, grounded in Integral Theory's developmental ontology.

## Moral Center

Integral Theory is the ontological foundation. When in doubt about any design or implementation choice, check it against:

- **Four Quadrants**: I (intent/clarity), We (shared understanding), It (behavior/tests), Its (systems/architecture)
- **Developmental Stages**: Purple/Red (works) → Blue (reliable) → Orange (optimized) → Green (empathetic) → Yellow+ (evolves)

## Core Principles

1. **Emotional energy is fuel, not judgment.** The system metabolizes emotional energy into creative output. Friction is raw material, not failure.

2. **Composting, not necromancy.** Past creative work is compostable material. Using it to generate new artifacts is legitimate when it serves development, not exploitation.

3. **Dual-track: AI + non-AI.** Features must degrade gracefully. The quest grammar, gamification, and emotional alchemy work with or without language models. The non-AI version is first-class, not a fallback.

4. **The game creates the game.** Process artifacts should be in-game artifacts. Documentation and verification should be legible within the game world.

5. **Generative dependencies.** Solve items that eliminate the need for other items. Compost obsolete paths rather than maintaining them.

6. **Speed is honest.** No shortcuts past blockers — they are raw material. Clean Up → Grow Up → Show Up.

## Voices and Characters

The project contains distinct narrative **voices** derived from archived creative work. These are characters (e.g., *Giacomo* as a villain NPC), not impersonations. Preserve their tonal register when generating narrative content.

## Community Context

The Portland community has strong reservations about AI. Public-facing language, documentation, and design choices should respect this. The non-AI path is always available and always complete.

## Tech Stack

- **Framework**: Next.js 14+ (App Router), TypeScript
- **Database**: PostgreSQL via Prisma ORM
- **Styling**: Tailwind CSS
- **AI**: AI SDK (Vercel), optional — features degrade without it
- **Key concepts**: BAR (kernel/quest seed), Vibeulon (currency), Nation/Archetype (character identity), Emotional Alchemy (5 elements, 15 canonical moves), Kotter stages (social adoption)

## Code Patterns

- **Spec-first**: Features with persistence, UI, or external surface should reference or create a spec (`.specify/specs/`)
- **API-first**: Define data shape and route/action signature before building UI
- **Server Actions** for internal flows; **Route Handlers** for external consumers
- **Fail-fix workflow**: Run `npm run build` and `npm run check` before moving on. Fix failures before proceeding.
- After modifying `prisma/schema.prisma`: run `npm run db:sync`

## Key Documentation

- [FOUNDATIONS.md](../FOUNDATIONS.md) — Ontology, the five dimensions, emotional alchemy, Yellow Brick Road
- [ARCHITECTURE.md](../ARCHITECTURE.md) — Schema mapping, core objects, governance, economy
- [CLAUDE.md](../CLAUDE.md) — Agent development guidelines and ethos
- [docs/DEVELOPER_ONBOARDING.md](../docs/DEVELOPER_ONBOARDING.md) — Setup and verification
