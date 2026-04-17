# Headless-First Workflow Spec

> Status: `active`
> Started: 2026-04-17
> Parent: Retrospective — 6-Face Review (2026-04-17)

## Problem

Two failure modes keep repeating:

1. **Request limit death spiral** — Browser automation loops (>10 steps) hit the 50 concurrent call limit and the session dies mid-flow. OBT verification becomes impossible.

2. **Chat-as-memory drift** — No persistent session log. Decisions get lost, state gets confused, the same ground gets covered twice.

## Principles

### 1. Headless First

For every verification goal, start at the lowest layer that can answer the question:

```
DB read        ← try first
Server action  ← next
API route      ← third
Browser        ← only when UI rendering is the point
```

**Default path for OBT verification:**
1. Write a headless script (`scripts/test-OBT-*.ts`) that hits the DB directly
2. If that can't answer the question (e.g., "does the modal render correctly?"), use browser
3. For browser work: use `agent-browser` (CLI, unauthenticated) before Zo browser tools

### 2. Session Boundary

Every working session starts by opening a session note:

```
scripts/sessions/YYYY-MM-DD.md
```

Contents:
```
## Session: [date] — [one-line goal]

## State at close
- What was built
- What was not
- What needs flagging

## Next move
```

### 3. Browser Automation Discipline

When browser automation is necessary:

| Step | Action |
|---|---|
| 1 | Open page |
| 2 | Take snapshot → inspect |
| 3 | Plan all clicks/fills for that state |
| 4 | Execute in ONE command using `&&` |
| 5 | Verify result |
| 6 | STOP if >10 calls have been used — report state, then continue |

**Checkpoint rule:** After 10 browser tool calls, pause and tell the user where we are before continuing.

### 4. Bounded Delivery Units

Every session should end with one of:
- A merged PR
- A committed branch with open PR
- A filed issue
- A written spec

No "we worked on it but nothing shipped."

## Scripts

### Existing (headless)

| Script | What it does |
|---|---|
| `bun run smoke:db` | Fast DB connectivity check — no browser, no server |
| `bun run scripts/test-OBT-charge-flow.ts` | Headless charge capture OBT |
| `bun run scripts/test-OBT-offer-bar.ts` | Headless offer BAR OBT |
| `bun run scripts/cli/create-account.ts <name>` | Create test account with password |
| `bun run scripts/cli/create-invite.ts <token>` | Create invite token |
| `bun run scripts/cli/set-cap.ts <name> <n>` | Set draft cap for player |

### New scripts to add

- [ ] `scripts/test-OBT-claim-flow.ts` — claim a charge bar (remaining OBT step)
- [ ] `scripts/test-OBT-full.ts` — run all OBT steps in sequence, report pass/fail
- [ ] `scripts/sessions/` — session log directory (create on every session start)

## Flagging Protocol

When something is blocked by infrastructure (not code):

1. **Flag immediately** via SMS to Wendell
2. **File an issue** in the repo with label `infrastructure`
3. **Note it** in the session log

Do not keep grinding on something that needs outside action.

## Root Cause — Request Limit

The 50 concurrent request limit is a Zo session guard. Browser automation loops exceed it because each browser interaction (open, snapshot, click, fill) is a separate tool call.

**Mitigation (available today):** Headless-first workflow above.

**Fix (requires Zo team):** Higher limit for Zo Pro users, or session-level batch mode for agentic loops.

Issue filed: `bars-engine#68`

## Status

- [x] Headless OBT scripts (charge capture + offer bar)
- [x] smoke:db CLI
- [x] Browser automation rule created
- [ ] Session logging (scripts/sessions/)
- [ ] Full OBT sequence headless script
- [ ] Request limit infrastructure fix
