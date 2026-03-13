# Spec: Sage Brief v2 — Deft Daily Operational Context

**ID**: GH
**Architect title**: The Sage's Awakening
**Move type**: wake_up → clean_up
**Emotional alchemy**: fear → neutrality (the gap between beautiful and useful)

---

## Problem

`npm run sage:brief` produces beautiful prose but not deft operational guidance. Three root causes:

1. **Stale context**: The Sage repeated "fix Production Database Divergence" after it was resolved in the same session. The script feeds open backlog items but not what was recently completed or resolved.

2. **Raw markdown as context**: Backlog items are passed as `| Priority | ID | Feature Name |...` table rows. The Sage cannot reason well from this format — it produces generic summaries rather than precise next-move recommendations.

3. **Non-canonical move names**: The Sage output included `step_through`, which is not a WAVE move. The prompt does not constrain to the canonical set: `wake_up / clean_up / grow_up / show_up`.

4. **No structured output contract**: The Sage returns freeform prose. A brief should have scannable sections: what to do next, why, and what to watch out for.

---

## Goals

- Feed the Sage **structured, pre-processed context** (not raw markdown)
- Include **recently completed items** so the Sage doesn't re-recommend finished work
- Include **in-flight signals**: build status, schema migration state, branch divergence
- **Constrain move names** in the system prompt to the canonical WAVE set
- Add a `--format brief` flag for a 5-line terse output (default: full)
- Output should be deft: max 3 "do next" bullets, 1 watch-out, 1 hexagram note

---

## Non-Goals

- Not a full project management dashboard
- Not replacing manual thought — augmenting it
- Does not require a DB connection (read-only: git + files)

---

## Context Sources (priority order)

| Source | What it provides | How to get it |
|--------|-----------------|---------------|
| Git log (48h) | Recent completions, in-flight work | `git log --oneline --since="48h"` |
| Backlog items.json | Structured open items (if seeded) | `.specify/backlog/items.json` |
| BACKLOG.md | Open items (fallback) | Parse `[ ] Ready` rows |
| Build probe | Is the build passing? | Check `.next/BUILD_ID` freshness or type-check exit code |
| Schema migration state | Is db:sync needed? | `git diff --name-only HEAD prisma/` |
| Branch divergence | Commits ahead of main | `git rev-list origin/main..HEAD --count` |

---

## Structured Prompt Contract

The prompt sent to the Sage should be JSON-structured, not markdown prose:

```
Current date: {date}
Branch: {branch} ({N} commits ahead of main)
Build status: {passing|failing|unknown}
Schema dirty: {yes|no}

Recently completed (last 48h):
- {commit message}
- ...

Open backlog (top {N}):
- [{id}] {name} ({category}) — deps: {deps}
- ...

Question: What is the highest-leverage next move?
Constrain your discerned_move to one of: wake_up, clean_up, grow_up, show_up.
Format your response as:
## Do Next (1–3 bullets)
## Why
## Watch Out
## Hexagram Note (if relevant)
```

---

## Output Format

### Full (default)
```
════════════════════════════════════════════════════
  SAGE BRIEF  |  🧹 clean_up  |  Hexagram 48
════════════════════════════════════════════════════

## Do Next
- Run npm run db:sync — agentMetadata migration pending
- Push branch to main via EO checklist

## Why
PD and DK resolved. Build blocked by schema drift, not code.

## Watch Out
DL (Campaign Map) has deps on CY and DG — don't start until those land.

## Hexagram 48 — The Well
Structural infrastructure sustains everything above it. Clear the well before drawing water.
────────────────────────────────────────────────────
[tokens: 4200]
```

### Brief (`--format brief`)
```
🧹 clean_up | db:sync → push to main | Watch: DL deps on CY,DG
```

---

## Acceptance Criteria

1. `npm run sage:brief` no longer recommends already-completed backlog items
2. Discerned move is always one of `wake_up / clean_up / grow_up / show_up`
3. Output has `## Do Next`, `## Why`, `## Watch Out` sections
4. `--format brief` prints one line
5. Passing build probe when `.next/BUILD_ID` exists
6. `npm run check` passes
