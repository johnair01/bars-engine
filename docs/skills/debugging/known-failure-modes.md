# Known Failure Modes — Bars Engine

> Pattern library of recurring bug categories. Each mode includes symptoms, diagnostic steps, and typical fixes. Updated after every debugging session.

---

## 1. UI State Issues

Bugs where the UI renders incorrectly or gets stuck due to state management problems.

### Symptoms
- Infinite spinner / loading state never resolves
- Component renders stale data after action
- Conditional render shows wrong branch (e.g., error not shown)
- UI flickers or shows intermediate state

### Diagnostic Steps
1. Check the state variable controlling the UI (e.g., `archetypeData`, `isLoading`)
2. Trace the code that sets the state — is it called on every code path?
3. Check if error paths set state or only success paths
4. Look for missing `useEffect` dependencies or stale closures
5. Check `useTransition` — is `isPending` being used correctly?

### Typical Fixes
- Add error state alongside loading state
- Ensure every async callback sets state on both success AND failure
- Add timeout fallbacks for critical loading states
- Use `finally` blocks to clear loading states

### Example (BUG-001)
```
getArchetypeHandbookData().then(res => {
    if (res.success) setArchetypeData(res.playbook)
    // ❌ No else — archetypeData stays null forever
})
```

---

## 2. Async / Promise Issues

Bugs caused by unhandled promises, race conditions, or missing awaits.

### Symptoms
- Function returns before async work completes
- Data is undefined when it should be populated
- Intermittent failures (race conditions)
- "Cannot read property of undefined" errors

### Diagnostic Steps
1. Check if `await` is missing on an async call
2. Check if `.then()` has error handling (`.catch()` or second arg)
3. Check for race conditions — can the component unmount before the promise resolves?
4. Check if parallel requests have ordering dependencies

### Typical Fixes
- Add `await` where missing
- Add `.catch()` or try/catch around every async call
- Use AbortController for component unmount cleanup
- Serialize requests that have ordering dependencies

---

## 3. Auth / Session Issues

Bugs related to authentication, cookies, or player identity.

### Symptoms
- Redirect loop (login → home → login)
- "Identity corrupted" or "Player not found" errors
- Different behavior logged in vs logged out
- `DEV_PLAYER_ID` works locally but breaks in prod

### Diagnostic Steps
1. Check `bars_player_id` cookie — is it set? Is it valid?
2. Check `getCurrentPlayer()` return value — is it null?
3. Check if `DEV_PLAYER_ID` env var is set in the right environment
4. Check cookie expiry and `httpOnly` / `secure` flags
5. Check middleware or layout redirects

### Typical Fixes
- Ensure cookie is set with correct path and expiry
- Add null checks after `getCurrentPlayer()`
- Guard against missing `DEV_PLAYER_ID` in production
- Add explicit redirect on expired session

---

## 4. API Contract Mismatches

Bugs where the caller and callee disagree on the shape of data.

### Symptoms
- Code checks `res.success` but response has `res.error` without `success` field
- Type errors at runtime despite TypeScript passing
- UI receives unexpected data shape from server action

### Diagnostic Steps
1. Check the server action's return type on ALL code paths (success, error, edge cases)
2. Check what the calling component expects (which fields it reads)
3. Look for `as any` or `@ts-ignore` suppressions that hide mismatches
4. Check Zod schemas if used — are they matching actual data?

### Typical Fixes
- Standardize return types: always include `success: boolean`
- Use discriminated unions: `{ success: true, data: T } | { success: false, error: string }`
- Remove `as any` casts and fix the underlying type
- Add runtime validation on the client side

### Example (BUG-001)
```typescript
// ❌ BAD: error path missing success field
return { error: 'No archetype found' }

// ✅ GOOD: consistent contract
return { success: false, error: 'No archetype found' }
```

---

## 5. Database / Data Integrity Issues

Bugs caused by missing data, broken foreign keys, or incomplete records.

### Symptoms
- `null` values where data is expected
- Prisma query returns null for a record that "should" exist
- Foreign key constraint violations
- Partial records (some fields set, others not)

### Diagnostic Steps
1. Query the DB directly: `SELECT * FROM table WHERE id = '...'`
2. Check if the creation flow sets all required fields
3. Check if there's a multi-step creation process with gaps (e.g., create then finalize)
4. Check cascade deletes — is related data being cleaned up?

### Typical Fixes
- Add NOT NULL constraints where data is required
- Use DB transactions for multi-step creates
- Add migration to backfill missing data
- Add validation before dependent operations (check player has playbook before loading archetype)

### Example (BUG-001)
`createGuidedPlayer()` creates a Player without `nationId`/`playbookId`. `finalizeOnboarding()` sets them later. If the user drops off between steps, the record is permanently incomplete.

---

## 6. Deployment / Environment Mismatches

Bugs that only appear in specific environments.

### Symptoms
- Works locally, breaks on Vercel
- Works on preview, breaks on production
- Environment variable not found
- Different behavior between `npm run dev` and `next build`

### Diagnostic Steps
1. Check environment variables: Vercel Dashboard → Settings → Environment Variables
2. Check if the code uses `process.env.NODE_ENV` conditionally
3. Check if there's a build-time vs runtime difference
4. Check if Prisma client was regenerated after schema changes (`npx prisma generate`)
5. Check if the deploy used the correct branch/commit

### Typical Fixes
- Ensure all required env vars are set in Vercel
- Run `npx prisma generate` before build
- Use `NEXT_PUBLIC_` prefix for client-side env vars
- Add health check endpoint (`/api/health`) to verify deployment state

---

## 7. Agent Analysis Loops (Meta)

Bugs in the AI agent process itself — getting stuck in infinite planning without acting.

### Symptoms
- Agent output hits token limit without producing tool calls
- Repeated "I'll execute" or similar phrases in thinking
- Long response times with no visible progress
- System returns: `generation exceeded max tokens limit`

### Root Causes
- **Over-analysis:** Too many decision branches evaluated before acting (e.g., "should I read file A or B or C?")
- **Circular reasoning:** Repeated confirmation of the same conclusion without committing to action
- **Perfectionism trap:** Trying to plan every detail before making the first tool call
- **Audio transcript ambiguity:** Unclear user input triggers excessive interpretation loops

### Diagnostic Steps
1. Check if the agent produced any tool calls at all (if not, it looped in analysis)
2. Check if the user request involved ambiguous or multi-part instructions
3. Check if audio input was involved (transcription ambiguity amplifies loops)

### Mitigation
- **For the user:** If agent appears stuck (>30s with no tool call), cancel and rephrase the request more concisely
- **For the agent prompt:** Structure as "read first, plan second, act third" — never iterate on planning without a tool call in between
- **Model selection:** Some models are more prone to this; switching models can break the loop

### Example (BUG-002)
User sent audio request: "use the skill to fix the intention display."
Agent entered a loop trying to simultaneously: read the skill file, plan the feature, determine quest IDs, decide on UI placement, and verify data flow — all in a single thinking block. Hit 16K token limit with zero tool calls.

---

## How to Use This File

1. When you encounter a new bug, scan this list for matching symptoms
2. If a match is found, follow the diagnostic steps — they'll save you loops
3. If you find a new failure mode, add it here after resolving the bug
4. Update existing modes with new examples when relevant
