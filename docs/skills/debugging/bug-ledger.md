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

## BUG-002: Agent Analysis Loop — Token Limit Exceeded

| Field | Value |
|---|---|
| **Date** | 2026-02-16 |
| **Severity** | 🟡 Medium |
| **Component** | Agent process (meta — not app code) |
| **Branch** | `main` |
| **Environment** | Local (IDE agent) |

### Symptoms
- Agent response took >30s with no visible tool calls
- System returned: `generation exceeded max tokens limit`
- User had to cancel and switch models to recover

### Root Cause
Audio input ("use the skill to fix the intention display") triggered excessive internal deliberation. The agent tried to resolve all ambiguity — which skill file to read, which quest ID stores the intention, where to place the UI, whether to follow the debug skill protocol — in a single thinking block. This created a circular planning loop that repeated "I'll execute" thousands of times without ever calling a tool.

### Detection Signals
- No tool calls in the response
- Token limit error from system
- Agent output contains repetitive phrases

### Fix
1. Documented as **Known Failure Mode #7** in `known-failure-modes.md`
2. User switched model to break the loop
3. No code fix possible — this is a model behavior issue

### Files Changed
- `docs/skills/debugging/known-failure-modes.md` — Added failure mode #7
- `docs/skills/debugging/bug-ledger.md` — This entry

### Verification
- Agent recovered after model switch and continued work
- Documentation committed

### Regression Guard
- If agent appears stuck (>30s, no tool calls), cancel immediately
- Rephrase ambiguous audio requests as text
- Avoid compound requests that combine "use skill X" + "fix feature Y" in one message

### Category
`Agent Analysis Loop` (Meta)

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
