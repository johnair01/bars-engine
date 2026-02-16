# Bug Ledger — Bars Engine

> Append-only log of resolved bugs. Each entry is a structured bug card. Add new entries at the top.

---

## BUG-001: Character Creation Wizard Freeze at "Synchronizing Identity..."

| Field | Value |
|---|---|
| **Date** | 2026-02-16 |
| **Severity** | 🔴 Critical |
| **Component** | `QuestDetailModal.tsx` / `quest-engine.ts` |
| **Branch** | `main` @ `e86a90f` |
| **Environment** | Production (Vercel) |

### Symptoms
- Returning user → Character creation → Step 2 "Meet your archetype"
- UI shows "Synchronizing Identity..." spinner forever
- No error in console, no network failure — silent hang

### Root Cause
`getArchetypeHandbookData()` returns `{ error: 'No archetype found' }` when player has no `playbookId`. This response **lacks** a `success` field. The UI code only checks `if (res.success)`, so `archetypeData` stays `null` and the spinner runs forever.

**Why the player has no playbookId:** `createGuidedPlayer()` creates accounts without `nationId`/`playbookId` — these are set later in `finalizeOnboarding()`. If the user abandons onboarding before finalization, their player record is incomplete.

### Detection Signals
- Infinite spinner with no console errors
- `player.playbookId` is `null` in DB
- `getArchetypeHandbookData()` returns object without `success` field

### Fix
1. **Diagnostic (QuestDetailModal.tsx):** Added `archetypeError` state. On failed fetch, set error state and render a warning message instead of spinner. Added console logging.
2. **Re-entry (page.tsx, guided-onboarding.ts, QuestThread.tsx):** Added dashboard banner for players with incomplete setup. Added `resetOnboarding()` server action. Added setup hint on orientation thread.

### Files Changed
- `src/components/QuestDetailModal.tsx` — error state + UI
- `src/app/page.tsx` — incomplete setup banner
- `src/actions/guided-onboarding.ts` — `resetOnboarding()` action
- `src/app/conclave/guided/page.tsx` — `?reset=true` param handling
- `src/components/QuestThread.tsx` — setup hint on orientation threads

### Verification
- `next build` passed
- Deployed to Vercel (`35b3c18`)
- User confirmed fix works

### Regression Guard
- Error returns must always include `success: false` (not just `{ error: '...' }`)
- UI that depends on async data must handle the error path, not just the success path
- Players created via guided onboarding must be checked for complete setup

### Category
`UI State` + `API Contract Mismatch` + `Data Integrity`

---

<!-- 
## BUG-NNN: Title

| Field | Value |
|---|---|
| **Date** | YYYY-MM-DD |
| **Severity** | 🔴/🟡/🟢 |
| **Component** | file(s) |
| **Branch** | `main` @ `hash` |
| **Environment** | Local/Vercel |

### Symptoms
- ...

### Root Cause
...

### Detection Signals
- ...

### Fix
...

### Files Changed
- ...

### Verification
- ...

### Regression Guard
- ...

### Category
...
-->
