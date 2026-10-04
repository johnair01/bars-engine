# Spec: Strand Process — Integrate or Deprecate

## Purpose

Decide, goal by goal, what the strand effort should keep, fold into the current workflow, or retire. The decision starts from what strand was meant to give the project ([issue #21](https://github.com/johnair01/bars-engine/issues/21)), what it delivers today, and what the current workflow (worktrees, spec kit, backlog, six-faces council, CI checks) already covers.

**Problem**: Issue #21 promised five capabilities. The MVP that shipped on 2026-03-26 is a 768-line YAML record keeper (`cli/bars-strand/bars_strand.py`) that delivers none of them, and `CLAUDE.md` still tells every session to suggest it. Retiring it wholesale could also discard a goal that is still unmet, so each goal gets its own call.

**Practice**: Deftness Development — spec kit first. Decision plus cleanup; no API surface.

## Corrections to the first draft of this audit

The first version of this spec judged strand by activity and got three things wrong:

- It said the CLI was "not installed". The CLI runs as `uv run python cli/bars-strand/bars_strand.py`, so a PATH check proved nothing.
- It counted `.strands/*.yaml` as a separate thing. Those files are the CLI's own records (name, status, fork-space, linked issues).
- It called strand consults "in daily use". The newest consult file is from 2026-06-24. The August commits touching strand files are council ledger backfills.

## Strand's goals vs. what covers them today

Goals come from issue #21. "Delivered" describes the shipped CLI. "Covered by" describes the current workflow.

| # | Goal in issue #21 | Delivered by the CLI? | Covered today by | Gap |
|---|-------------------|-----------------------|------------------|-----|
| 1 | **Safety boundaries**: isolate risky work so agents cannot touch production state | Stores a `fork_space.allowed_paths` list; nothing reads or enforces it (no hook, no check; verified by grep). | A git worktree per session (this session is one; the machine lists 76 sessions), permission modes, PR review | **Scope.** A worktree isolates the copy. It does not stop a session from editing shared files such as `BACKLOG.md` or `schema.prisma`. This is the one goal worth keeping. |
| 2 | **Silent failures visible**: contract validation, health checks | No | `npm run check` and `build` (fail-fix workflow), sprout's `map:check`, CI, the spec kit's Verification Quest | Little. Validation exists per surface. Agent-output contracts (did the subagent do what the brief said) have no home. |
| 3 | **Token and cost budgets** | No | Session-level limits in the harness; `compute-guardrails` skill; `ai-deftness-token-strategy` spec | Little for sessions. Paid-service spend has no gate (addressed per feature, e.g. `--yes` in world-from-image). |
| 4 | **Resumable state**: recover from interruption | No | Resumable sessions, worktrees, scheduled routines | None found. |
| 5 | **Multi-agent coordination** | No (explicitly deferred in the issue) | The Agent tool, workflows, the six-faces council | None found. |

Two further capabilities the CLI advertises, **status tracking** and **GitHub issue linking**, are a status string and a stored URL. Status lives in `tasks.md` and `BACKLOG.md`; issues link through branches and PRs.

## Consults: what they produced

Strand consults (about 14 `scripts/strand-consult-*.ts`, run through the backend with an OpenAI key) are a different thing from the CLI. Findings from reading 21 consult files in 14 spec folders:

- **Clear value where a consult answered a named open question.** `mobility-quest-superpower-campaign/spec.md:63` has a "Six Faces ruling" row ("unit-typed, never weighted") that shaped the data model; `flow-simulator-cli` has whole sections marked "(from STRAND_CONSULT)".
- **Platitudes where the brief was generic.** `charge-321-flow-interruption` produced advice that its `plan.md` still lists as "to be refined".
- **Without the key** the backend falls back to deterministic output, which `docs/AGENT_WORKFLOWS.md` calls shallow.
- **The six-faces skill covers the same ground** (same six faces, run as a Claude session, no backend or OpenAI dependency) and adds scorecards, dissent checks and a rule that the Sage never decides. The council's home moved to `wendell-britt/six-faces-council` on 2026-10-02, and its ledger already records the strand consults as predecessor passes.

What worked in consults is the habit of turning a ruling into a Design Decisions row in the spec. That habit survives without the backend.

## Other things named "strand"

| Thing | Verdict needed |
|-------|----------------|
| `backend/app/strand/runner.py` (`run_strand`): an investigation pipeline (shaman, sage, architect) that creates a BAR and writes an audit trail | A product feature, in the spirit of "the game creates the game". Issue #22 (runtime strand execution, open) tracks its future. Not part of this decision; review separately. |
| `CustomBar.strandMetadata` (`prisma/schema.prisma:389`) | Used in `src/actions/alchemy-engine.ts` as general BAR provenance. Keep. Renaming is a migration with its own spec. |

## Design Decisions

| Topic | Decision |
|-------|----------|
| Who decides | Wendell. This spec sets out the evidence and a recommendation; the ruling goes in `plan.md` with a date. |
| Unit of decision | Each goal in the table above, because the CLI as a whole fails and goal 1 may still be worth building. |
| Deletions | None before the ruling, and all in one commit so they can be reverted. |
| `CLAUDE.md` | Edited only after the ruling. Sessions follow the current text until then. |

## Options

| Option | What changes |
|--------|--------------|
| **A. Integrate** | Fold the useful parts into the spec kit. Add an optional `scope:` field (allowed paths, files this work must not touch) to `spec.md` front matter and a PreToolUse hook that warns or blocks on out-of-scope edits. Retire the CLI. Goal 1 gets a real implementation. |
| **B. Deprecate** | Retire the CLI, its docs, skill and `CLAUDE.md` nudge. Goals 2 to 5 stay with current workflow. Goal 1 is dropped. |
| **C. Keep** | Leave the CLI and the nudge. |
| **Consults** (separate call under any option) | Retire the backend-run consult scripts in favor of the six-faces skill. Keep the existing consult files as history. Calling the convention of a "Six Faces ruling" row in the spec a keeper is a second, independent call. |

**Superseded 2026-10-03 by the ruling in plan.md: option B, with goal 1 deferred.** Original recommendation: A in a small form, with the consult call as stated. Goal 1 is the unmet one, and parallel sessions make it relevant: with dozens of sessions working in one repo, shared files are where collisions happen. A hook that reads a `scope:` field turns the idea strand stored but never enforced into something that works. The CLI itself is redundant on the other four goals and retires either way. Before building the hook, run the check under Open Questions, so the hook answers a collision problem that exists.

## Open Questions

| Question | How to answer |
|----------|---------------|
| Do parallel sessions collide on shared files today? | Answered 2026-10-03: no visible collisions in 60 days of history (details in plan.md). Goal 1 deferred. |
| Did Wendell use the CLI personally, and for what? | Answered: the backend consult path was never used. |
| Should the backend consult path keep any role? | Answered: no. Retire it. |

## User Stories

### P1: Sessions start from the spec kit

**As the author**, I want new sessions to begin work from the spec kit.

**Acceptance**: after the ruling, `CLAUDE.md` and `.cursorrules` agree with it. A fresh session starts work with no strand prompt.

### P2: Scope that holds (option A only)

**As the author**, I want a session working on one spec to be warned when it edits files outside that spec's scope.

**Acceptance**: a `scope:` field in `spec.md` front matter, a hook that reads it, and a test where an out-of-scope edit raises the warning.

## Functional Requirements

### Phase 1: Decide

- **FR1**: Run the collision check from Open Questions and record the count.
- **FR2**: Wendell rules per goal and on the consult call; record it in `plan.md`.

### Phase 2: Execute

- **FR3**: Retire the CLI: `docs/BARS_STRAND_GUIDE.md`, root `BARS_STRAND_*.md` files, `.bars-strand.yml` and its example, `tests/test_bars_strand_cli.py`, `cli/bars-strand/`, `.claude/plugins/bars-strand/`, the `bars-strand-management` skill. Copy anything worth keeping from `strand-results/` and `.strands/` into spec folders first.
- **FR4**: Remove the "BARS Strand System" section from `CLAUDE.md`; update `.cursorrules`.
- **FR5**: Update `docs/STRAND_TO_SPEC_KIT.md` and `docs/AGENT_WORKFLOWS.md` to the ruling on consults.
- **FR6** (A): define `scope:` front matter, add the hook, document it in the spec-kit skill.
- **FR7**: Add a comment at `prisma/schema.prisma:389` noting the legacy name. No migration.

## Non-Functional Requirements

- `npm run build` and `npm run check` pass after the cleanup.
- The consult scripts keep resolving until the ruling on them is executed.

## Persisted data & Prisma

None. A later rename of `strandMetadata` needs its own migration spec.

## Verification Quest

Repo-maintenance item with no player-facing flow. Verification: a fresh session in the repo begins work with no strand prompt; under option A, the P2 test passes.

## Dependencies

- None blocking. Related: [world-from-image](../world-from-image/spec.md).

## References

- [Issue #21](https://github.com/johnair01/bars-engine/issues/21) (goals) and [issue #22](https://github.com/johnair01/bars-engine/issues/22) (runtime, open)
- `cli/bars-strand/bars_strand.py`, `.bars-strand.yml`, `.strands/`, `strand-results/`
- `CLAUDE.md` (BARS Strand System section), `.cursorrules`
- `docs/BARS_STRAND_GUIDE.md`, `docs/STRAND_TO_SPEC_KIT.md`, `docs/AGENT_WORKFLOWS.md`
- `backend/app/strand/runner.py`, `scripts/strand-consult-*.ts`
- `.claude/skills/six-faces/SKILL.md`, `council/README.md`
