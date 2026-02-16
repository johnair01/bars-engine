# Debug Session Template

> Copy this template for each debugging session. Fill in as you go.

---

## Session Info

| Field | Value |
|---|---|
| **Date** | YYYY-MM-DD |
| **Bug ID** | BUG-NNN |
| **Branch** | `main` @ `commit_hash` |
| **Reporter** | name or "self" |
| **Severity** | 🔴 Critical / 🟡 Major / 🟢 Minor |
| **Environment** | Local / Vercel Preview / Production |

## Bug Description

**What happens:** (one sentence)

**What should happen:** (one sentence)

## Repro Steps

1. Step
2. Step
3. Step
4. → Bug occurs

## Environment State

```
Branch:     main
Commit:     abc1234
Node:       v20.x
DB:         connected / error
Env vars:   DATABASE_URL ✓ | OPENAI_API_KEY ✓ | DEV_PLAYER_ID ✓
```

## Evidence

### Console Output
```
(paste errors here)
```

### Network Tab
```
(paste failed requests here)
```

### DB State
```sql
-- relevant query
SELECT * FROM Player WHERE id = '...'
```

## Flow Trace

```
User Action → Component → Server Action → DB Query → Response → UI Update
Example: Click "Step 2" → QuestDetailModal → getArchetypeHandbookData() → getCurrentPlayer() → { error } → ❌ spinner stuck
```

## Hypotheses

| # | Likelihood | Hypothesis | Evidence |
|---|---|---|---|
| 1 | HIGH | ... | ... |
| 2 | MED | ... | ... |
| 3 | LOW | ... | ... |

## Root Cause

**One sentence:** ...

**Code location:** `src/path/to/file.ts:LINE`

**Why it happened:** ...

## Fix Applied

**Files changed:**
- `src/path/to/file.ts` — description of change

**Diff summary:**
```diff
- old code
+ new code
```

## Verification

| Check | Result |
|---|---|
| `next build` | ✅ Pass / ❌ Fail |
| UI behavior | ✅ Fixed / ❌ Still broken |
| Edge cases | ✅ Tested / ⚠️ Skipped |
| Deployed | ✅ Live / ⏳ Pending |

## Regression Guard

**Added to checklist:**
- [ ] Description of what to check going forward

## Time Spent

| Phase | Minutes |
|---|---|
| Observe | |
| Map | |
| Hypothesize | |
| Instrument | |
| Isolate | |
| Fix | |
| Verify | |
| Document | |
| **Total** | |
