# Plan: OpenGSD Workflow Migration

## Strategy

Incremental, lowest-risk-first, compost-as-you-go. Add the **net-new** capability
(GSD Browser) before touching anything that works; pilot **GSD Pi** in parallel
with the bespoke stack; cut over and compost only after parity is demonstrated.
No big-bang. Each phase is independently revertable.

## Sequencing rationale

1. **GSD Browser first** — purely additive (we have no visual verification today),
   so it can land with zero risk to existing flows and immediately serves
   `UI_COVENANT` work on both the MTGOA app and the Next.js app.
2. **GSD Pi pilot second** — runs alongside Ouroboros/Spec-Kit; proves
   context-fidelity and autonomy on one real kit before any removal.
3. **Cutover + compost last** — Strands→worktrees, `.specify/`→`.gsd/`, retire
   bespoke commands, update docs.

## Architecture / file impacts

| Area | Change | Phase |
|------|--------|-------|
| Setup hook (`.claude/` session-start / CI) | Provision headless Chromium for GSD Browser | 1 |
| `package.json` | `verify:ui` script (boot app + gsd-browser capture); optionally vendor gsd-browser | 1 |
| `mtgoa-game/` | Baseline screenshots + a11y tree for Level-1 Priya | 1 |
| Repo root | `.gsd/` directory (GSD Pi state) appears once Pi is initialized | 2 |
| `.specify/specs/*` | One kit translated to GSD Pi; rest untouched until Phase 3 | 2→3 |
| BARS Strand skills | Map fork-space boundaries to GSD worktrees | 3 |
| `.agent/context/*`, `BACKLOG.md` | Migrate into `.gsd/` context | 3 |
| `CLAUDE.md`, `docs/` | Re-point workflow guidance from `ooo`/Strands to GSD | 3 |

## Prerequisites / risks

- **Chromium provisioning** is the gating dependency for Phase 1 (spike confirmed
  the sandbox has no browser; CDP daemon won't start without one).
- **GSD Pi is local-first + LLM-driven** — confirm provider, the "latest Claude"
  default, and cost controls before piloting (Phase 2).
- **Young dependency (v0.1.x)** — keep `.specify/` archived (not deleted) through
  Phase 3 so rollback is cheap.
- **Community optics** — preserve dual-track/non-AI legibility; consider framing
  the migration as an in-game artifact.

## Verification

- Phase 1: GSD Browser captures an MTGOA baseline and flags a visual diff on an
  intentional color/border change.
- Phase 2: one feature delivered end-to-end via GSD Pi without bespoke fallback.
- Phase 3: existing specs still build; non-AI flows unaffected; docs point at GSD.

> Not a persistence/UI feature change — no Prisma migration and no Twine
> Verification Quest required (those apply to user-facing product features).
