# Regression Checklist — Bars Engine

> Run through this checklist before deploying any fix. Each item was added because a real bug was missed. This list grows after every debugging session.

---

## API Contract Checks

- [ ] **Every server action error return includes `success: false`**
  Not just `{ error: '...' }` — callers check `res.success`, so omitting it causes silent failures.
  _Added: BUG-001_

- [ ] **Discriminated union return types are consistent**
  If a function returns `{ success: true, data }` on success, it must return `{ success: false, error }` on failure. No mixed shapes.
  _Added: BUG-001_

## UI State Checks

- [ ] **Every loading state has a matching error state**
  If you show a spinner while waiting for data, you must also handle the case where the data fetch fails. No orphaned spinners.
  _Added: BUG-001_

- [ ] **Async `.then()` callbacks handle both success and failure**
  Check that every `.then(res => ...)` has logic for the error case, not just the happy path.
  _Added: BUG-001_

## Data Integrity Checks

- [ ] **Multi-step creation flows must be atomic or recoverable**
  If a record is created in step 1 and finalized in step 3, ensure there's a way to detect and recover from abandonment at step 2.
  _Added: BUG-001_

- [ ] **Guard clauses before dependent data access**
  Before accessing `player.playbook.name`, verify `player.playbook` is not null. Add early returns with error messages.
  _Added: BUG-001_

## Auth / Session Checks

- [ ] **`getCurrentPlayer()` return is null-checked**
  This function returns `null` if the cookie is missing or the player doesn't exist. Every caller must handle null.

- [ ] **`DEV_PLAYER_ID` is not required in production**
  Dev-only env vars must have fallback paths in production code.

## Logging Checks

- [ ] **Error paths include `console.error` with context**
  Every catch block or error return should log `[FunctionName] message`, not just silently return.
  _Added: BUG-001_

- [ ] **No silently swallowed errors**
  Search for empty `catch {}` blocks. Every error must be logged or surfaced.

## Deployment Checks

- [ ] **`next build` passes before pushing**
  Never push without a successful build locally.

- [ ] **`git diff --stat` reviewed before commit**
  Sanity check the files changed. No unexpected modifications.

- [ ] **Post-deploy smoke test**
  After deploying, manually verify: login, dashboard loads, one quest opens.

---

## How This List Grows

After every debugging session:
1. Identify what check would have caught this bug earlier
2. Add it here with the bug ID reference
3. Keep items actionable — each should be a yes/no check
