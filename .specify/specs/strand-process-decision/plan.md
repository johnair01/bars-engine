# Plan: Strand Process — Integrate or Deprecate

Implement per [spec.md](spec.md).

## Order

1. Run the collision check (spec.md, Open Questions). Wendell reads the goals table and rules per goal, plus the consult call.
2. Record the ruling here under **Ruling**, with the date.
3. Execute Phase 2 for the chosen option, in one commit.
4. Update the backlog row to Done.

## Ruling

**2026-10-03, Wendell:** never used the backend consult path; Claude and Claude Code have closed that gap and need.

| Call | Ruling |
|------|--------|
| Backend-run consult scripts (`strand:consult*`, `backend/app/strand` consult flow) | Retire. Six-faces skill is the path. Existing consult files stay as history. |
| Strand CLI and `CLAUDE.md` nudge | Retire (option B). Goals 2 to 5 are covered by current workflow. |
| Goal 1, scope enforcement (`scope:` front matter + hook) | Deferred. Collision check found no signal (see below). Revisit if a collision shows up. |
| `run_strand` pipeline, `strandMetadata` | Out of scope; unchanged. |

Wendell's words covered the consult path directly. The CLI and scope calls are my reading of "closed that gap and need"; correct them if that reading is wrong.

**Collision check (60 days to 2026-10-03):** `BACKLOG.md` had 0 commits, `prisma/schema.prisma` 7, `package.json` 10. No commit message records a conflict fix; three merges of `origin/main` into a branch are routine. Git history only shows conflicts that left a trace, so this is a weak signal.

## Changelog

| Date | Change |
|------|--------|
| 2026-10-03 | Spec kit created from an activity audit. Recommendation recorded as B. |
| 2026-10-03 | Ruling recorded (B). Executed: CLI, docs, config, test, plugin, skill, build-run files and consult scripts removed; `.strands/*.yaml` moved to `STRAND_RECORD.yaml` in each spec folder; `CLAUDE.md` section removed. Kept: backend strand pipeline, `docs/STRAND_TROUBLESHOOTING.md` (backend API), `compost:strand-consults`, `strand-results/` (master-of-friendship records), `.cursorrules` and `game-master-agents.mdc` (backend sage_consult and strand_run remain). |
| 2026-10-03 | T11 confirmed in a fresh cloud session on this branch: no strand offer at feature start; all file checks matched. Status Done. |
| 2026-10-03 | Rewritten after review: judged by issue #21's goals vs current workflow, consult value read from 21 files. Recommendation changed to a small A (scope field + hook), pending the collision check. |

## File impact (retire the CLI; same under A and B)

```
delete   docs/BARS_STRAND_GUIDE.md and BARS_STRAND_*.md at repo root
delete   .bars-strand.yml, .bars-strand.yml.example
delete   tests/test_bars_strand_cli.py
delete   .agents/skills/bars-strand-management/, cli/bars-strand/, .claude/plugins/bars-strand/
move     .strands/*.yaml -> .specify/specs/<spec>/STRAND_RECORD.yaml
archive  strand-results/  (copy anything worth keeping into spec folders first)
edit     CLAUDE.md  (remove "BARS Strand System" section)
edit     .cursorrules, docs/STRAND_TO_SPEC_KIT.md, docs/AGENT_WORKFLOWS.md
comment  prisma/schema.prisma:389 (legacy name; no migration)
delete   scripts/strand-consult-*.ts, scripts/strand-invitation-gap-analysis.ts, their npm scripts
keep     scripts/compost-strand-consults.ts, backend/app/strand/, docs/STRAND_TROUBLESHOOTING.md
```

Before deleting, grep each path for inbound references (`grep -rn "<name>" --exclude-dir=node_modules`).
