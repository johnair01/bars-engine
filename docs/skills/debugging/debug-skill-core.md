# Debug Skill — Bars Engine

> A structured, repeatable debugging system that captures knowledge and compounds over time.

---

## When to Use

- UI freeze, spinner stuck, blank screen
- API call returns unexpected result or hangs
- Auth/session issues (cookie missing, redirect loop)
- Data integrity problems (missing foreign keys, null fields)
- Post-deploy regressions
- Any bug that takes more than 5 minutes to understand

## Required Inputs

| Input | Source | Example |
|---|---|---|
| **Bug report** | User, logs, or observation | "Wizard freezes at step 2" |
| **Environment** | Branch, commit, local vs deployed | `main@e86a90f`, Vercel prod |
| **Repro steps** | Exact clicks/actions to trigger | Login → Create character → Step 2 |
| **Current behavior** | What actually happens | Infinite spinner |
| **Expected behavior** | What should happen | Archetype data loads |

## Expected Outputs

1. **Root cause** — One sentence explaining why the bug exists
2. **Fix** — Minimal code change with file paths
3. **Verification** — Proof the fix works (build pass, UI check, test)
4. **Bug card** — Entry in `bug-ledger.md`
5. **Regression guard** — Entry in `regression-checklist.md`

---

## Debugging Loops (8-Loop Structure)

Each session runs up to 8 timeboxed loops. Stop early if fixed.

### Loop 1: Observe (5 min)
- Read the bug report
- Reproduce the issue locally if possible
- Note exact error messages, console output, network tab

### Loop 2: Map the Flow (5 min)
- Trace the code path from trigger to failure
- Identify which files, functions, and data are involved
- Draw the chain: `User Action → Component → Action/API → DB`

### Loop 3: Hypothesize (3 min)
- List top 3 likely causes ranked by probability
- Format: `[HIGH/MED/LOW] hypothesis — evidence for/against`

### Loop 4: Instrument (5 min)
- Add targeted `console.log` or error boundaries
- Check: is the function called? What args? What does it return?
- Check: does the DB query return expected data?

### Loop 5: Isolate (5 min)
- Narrow to the single line/condition causing failure
- Confirm by modifying only that line and re-testing

### Loop 6: Fix (5 min)
- Apply the minimal surgical fix
- Do NOT refactor adjacent code
- Keep the diff small and reviewable

### Loop 7: Verify (5 min)
- `next build` passes
- UI behavior is correct
- Edge cases tested (missing data, expired session, etc.)

### Loop 8: Document (3 min)
- Add bug card to `bug-ledger.md`
- Update `known-failure-modes.md` if new pattern
- Update `regression-checklist.md`
- Commit with descriptive message

---

## Definition of Done

- [ ] Root cause identified and documented
- [ ] Fix applied (minimal diff)
- [ ] Build passes (`next build` exit 0)
- [ ] Behavior verified (UI or automated test)
- [ ] Bug card added to ledger
- [ ] Regression guard added if applicable
- [ ] Deployed (if production bug)

## Verification Requirements

| Check | Method |
|---|---|
| Build | `npx next build` — exit code 0 |
| Behavior | Browser test or screenshot |
| Data | DB query confirms expected state |
| Edge cases | Missing data, expired auth, concurrent requests |

## Deployment Sanity Checks

1. `git diff --stat` — review changed files
2. `npx next build` — confirm no build errors
3. `git push origin main` — triggers Vercel deploy
4. Check [bars-engine.vercel.app](https://bars-engine.vercel.app/) within 2 minutes
5. Reproduce the original bug — confirm it's gone
6. Test one adjacent feature — confirm no regression

## Logging & Instrumentation Guidelines

```typescript
// Pattern: prefix logs with [ComponentName] for easy filtering
console.log('[QuestDetailModal] Archetype fetch result:', res)
console.error('[QuestDetailModal] Archetype fetch failed:', res.error)

// Pattern: always log the full error object
catch (error) {
    console.error('[FunctionName] Failed:', error)
    return { success: false, error: String(error) }
}

// Pattern: guard clauses with explicit returns
if (!player || !player.playbook) {
    console.warn('[getArchetypeHandbookData] No playbook found for player')
    return { success: false, error: 'No archetype found' }
}
```

**Rules:**
- Never swallow errors silently — always log or surface them
- Use `success: false` in every error return (not just `{ error: '...' }`)
- Prefix logs with `[ComponentOrFunctionName]` for grep-ability
- Remove debug logs before merging (or gate behind `process.env.DEBUG`)

---

## Related Files

- [Session Template](./session-template.md) — Use for each debugging session
- [Bug Ledger](./bug-ledger.md) — Append-only log of resolved bugs
- [Known Failure Modes](./known-failure-modes.md) — Pattern library
- [Regression Checklist](./regression-checklist.md) — Guards against repeat bugs
- [Agent Prompt](../../scripts/debug-session-prompt.md) — For AI-guided sessions
