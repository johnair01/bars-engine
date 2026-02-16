# Generate Bug Card Template

> Quick-reference for creating a new bug card entry. Copy the template below, fill it in, and append to `docs/skills/debugging/bug-ledger.md`.

---

## Instructions

1. Determine the next bug ID by checking the last entry in `bug-ledger.md`
2. Copy the template below
3. Fill in every field
4. Append to the bottom of `bug-ledger.md` (above the HTML comment template)
5. Update `known-failure-modes.md` if this bug represents a new pattern
6. Add regression guard to `regression-checklist.md`

## Template

```markdown
---

## BUG-NNN: [Short descriptive title]

| Field | Value |
|---|---|
| **Date** | YYYY-MM-DD |
| **Severity** | 🔴 Critical / 🟡 Major / 🟢 Minor |
| **Component** | `src/path/to/file.ts` |
| **Branch** | `main` @ `commit_hash` |
| **Environment** | Local / Vercel Preview / Production |

### Symptoms
- Symptom 1
- Symptom 2

### Root Cause
One clear sentence explaining WHY this bug exists.

### Detection Signals
- Signal that would help detect this bug faster next time
- Signal 2

### Fix
Description of what was changed and why.

### Files Changed
- `src/path/to/file.ts` — what changed

### Verification
- `next build` — ✅ Pass
- UI behavior — ✅ Fixed
- Edge cases — ✅ Tested

### Regression Guard
- What regression check was added to prevent recurrence

### Category
One or more from: `UI State` | `Async` | `Auth/Session` | `API Contract` | `Data Integrity` | `Deployment`
```

## Self-Improvement Checklist

After adding the bug card, ask:

- [ ] Is there a new failure mode to add to `known-failure-modes.md`?
- [ ] Is there a new check to add to `regression-checklist.md`?
- [ ] Does an existing failure mode need a new example?
- [ ] What detection signal would have caught this in Loop 1 instead of Loop 5?

This is what makes the system compound. Every bug resolved makes the next bug faster to resolve.
