# Spec: OpenGSD Workflow Migration

## Purpose

Adopt **OpenGSD** ("Git. Ship. Done.") as the standard AI-assisted development
workflow for bars-engine, and incrementally migrate the project's bespoke
agent-orchestration stack (Ouroboros, Spec-Kit tooling, BARS Strand System) onto
it — composting the in-house infrastructure as GSD equivalents take over.

**Problem**: bars-engine maintains a sophisticated but **sole-maintained** stack
of spec-driven / context-engineering / work-isolation tooling. The functionality
is largely *replicated* by OpenGSD, which is more mature and backed by an active
developer community. Sole-maintaining bespoke developer infrastructure is a
standing tax; an externally maintained ecosystem lowers long-term cost — and
GSD Browser adds a capability (automated visual verification) we do not have.

**Practice**: Deftness Development — compost obsolete paths over maintaining them
(generative dependencies); incremental, non-breaking migration; deterministic
verification before cutover.

## Decision

**Adopt OpenGSD; migrate the bespoke stack onto it incrementally.** This is a
ratified direction (owner decision, 2026-06-12), recorded here for legibility.

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Adopt vs. keep bespoke | **Adopt OpenGSD** | Functionality replicated, but GSD is more mature and community-maintained; ends sole-maintainership of bespoke infra. |
| GSD Pi (spec-driven agent) | **Replace** Ouroboros + Spec-Kit tooling over time | Same model (milestones/slices/tasks, context engineering, long autonomous runs) with upstream maintenance. |
| BARS Strand System | **Map onto** GSD Pi git-worktree isolation | GSD isolates work in worktrees natively; Strands' fork-space boundaries map directly. |
| GSD Browser | **Add (net-new)** | No current automated visual verification; directly serves `UI_COVENANT` (element=color, altitude=border, stage=density) for MTGOA + Next.js UI. |
| Migration style | **Incremental, compost-as-you-go** | Do not break in-flight specs; retire bespoke paths only as GSD equivalents are proven. |
| Community optics | **Preserve dual-track / non-AI legibility** | Portland AI-allergy: GSD adoption must not degrade the first-class non-AI delivery mode or make process illegible. |

## Conceptual Model (what maps to what)

| bars-engine (today) | OpenGSD (target) | Migration note |
|---------------------|------------------|----------------|
| Ouroboros `ooo` (interview→seed→execute→evaluate) | GSD Pi (plan→implement→verify→ship) | Meta-prompting + evolutionary loop ≈ GSD Pi autonomous sessions. |
| Spec-Kit `.specify/specs/*` (spec/plan/tasks) | GSD Pi milestones / slices / tasks in `.gsd/` | Translate existing kits; keep `.specify/` until parity proven. |
| `.agent/context/*`, BACKLOG | GSD Pi context engineering (`.gsd/`) | Context state + validation evidence. |
| BARS Strand System (fork-space, work isolation) | GSD Pi git worktrees | Strand boundaries → worktree branches. |
| *(none)* | **GSD Browser** | New: screenshots, accessibility tree, visual diffing, test generation. |

## Environment Spike — Findings (2026-06-12)

A feasibility smoke-test of GSD Browser in the web/remote sandbox:

- ✅ `@opengsd/gsd-browser@0.1.29` installs from npm (registry reachable).
- ✅ CLI runs (`gsd-browser --version` / `--help`); rich CDP command set
  (navigate, click, type, screenshot, accessibility-tree, visual diff, etc.).
- ❌ **Daemon fails to start — no Chromium binary present** in the sandbox
  (`daemon exited during startup`). CDP requires a Chrome/Chromium install.

**Implication**: Any environment that runs GSD Browser (local dev, CI, web
sessions) must **provision a headless Chromium** (e.g. a setup-hook /
`session-start-hook`, or a CI step). This is the gating prerequisite for the
verification track.

## User Stories

### P1: Maintainer ends bespoke-stack tax
**As the project maintainer**, I want spec-driven work to run on a
community-maintained engine, so I stop sole-maintaining Ouroboros/Strand
internals and inherit upstream improvements.
**Acceptance**: One real feature is delivered end-to-end through GSD Pi
(plan→ship) without falling back to the bespoke `ooo` commands.

### P2: UI work gains automated visual verification
**As a developer doing UI work**, I want screenshot + visual-diff checks against
`UI_COVENANT` encodings, so card aesthetics are verified without manual review.
**Acceptance**: GSD Browser captures a baseline of the MTGOA Level-1 Priya screen
and flags a visual diff on an intentional color/border change.

### P3: No regression to in-flight work or non-AI mode
**As a contributor**, I want existing `.specify/` specs and the non-AI delivery
path to keep working during migration, so nothing breaks mid-cutover.
**Acceptance**: Existing specs remain buildable; non-AI flows unaffected; bespoke
paths retired only after GSD parity is demonstrated.

## Functional Requirements

### Phase 0: Decision & feasibility (this spec)
- **FR0.1**: Record the adopt-and-migrate decision (this document).
- **FR0.2**: Spike GSD Browser install/run in the sandbox; document the Chromium
  prerequisite. *(done — see Findings)*

### Phase 1: GSD Browser (net-new, lowest risk, highest additive value)
- **FR1.1**: Provision headless Chromium for dev/CI/web sessions (setup hook).
- **FR1.2**: Add a `verify:ui` path that boots the MTGOA app and captures a
  baseline screenshot + accessibility tree of the Level-1 Priya screen.
- **FR1.3**: Wire visual-diff into the verification loop for `UI_COVENANT` work.

### Phase 2: GSD Pi pilot (parallel to bespoke; no removal yet)
- **FR2.1**: `npx @opengsd/gsd-pi@latest` setup; choose LLM provider (default to
  the latest Claude per project guidance).
- **FR2.2**: Translate **one** existing `.specify/` kit into GSD Pi
  milestones/slices/tasks and deliver it through GSD.
- **FR2.3**: Compare context-fidelity and autonomy vs. Ouroboros on that pilot.

### Phase 3: Cutover & compost (only after parity)
- **FR3.1**: Map BARS Strand fork-space boundaries to GSD worktrees.
- **FR3.2**: Migrate backlog/context (`.specify/`, `.agent/context/`) into `.gsd/`.
- **FR3.3**: Compost retired bespoke commands; update CLAUDE.md + docs to point at GSD.

## Non-Functional Requirements

- **Non-breaking**: in-flight specs and current deploys unaffected during migration.
- **Dual-track**: non-AI delivery mode remains first-class and legible.
- **Reversibility**: each phase independently revertable; no big-bang cutover.
- **Lock-in awareness**: GSD is young (v0.1.x); keep `.specify/` archived until
  Phase 3 parity is proven, so rollback stays cheap.
- **Secrets/cost**: GSD Pi LLM provider keys documented in `docs/ENV_AND_VERCEL.md`;
  model override + caching honored.

## Open Questions

- Provider/runtime: which LLM does GSD Pi drive, and does it honor the project's
  "latest Claude" default and cost controls?
- CI surface: provision Chromium in CI now, or gate GSD Browser to local/web only?
- Optics: how do we frame GSD adoption for the AI-allergic Portland community —
  is the migration itself an in-game artifact ("the game creates the game")?
