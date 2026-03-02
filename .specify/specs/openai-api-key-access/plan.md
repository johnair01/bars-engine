# Plan: OpenAI API Key — Secure and Accessible

## Summary

Create a centralized OpenAI provider that validates `OPENAI_API_KEY` before use, add preflight check, update docs, and migrate all AI-using code.

## Implementation

### 1. Create `src/lib/openai.ts`

```ts
import { createOpenAI } from '@ai-sdk/openai'

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY
  if (!key || key.trim() === '') {
    throw new Error(
      'OPENAI_API_KEY is not set. Add it to .env.local (local) or Vercel Environment Variables (deploy). See docs/ENV_AND_VERCEL.md'
    )
  }
  return key
}

export function getOpenAI() {
  return createOpenAI({ apiKey: getApiKey() })
}
```

Usage: `getOpenAI()('gpt-4o')` instead of `openai('gpt-4o')`.

### 2. Migrate AI-using actions

| File | Change |
|------|--------|
| src/actions/book-analyze.ts | `getOpenAI()('gpt-4o')` |
| src/actions/generate-quest.ts | `getOpenAI()('gpt-4o')` |
| (grep for other `openai(` usages) | Same pattern |

### 3. Update preflight

In `scripts/preflight-env.ts`, add `OPENAI_API_KEY` to optional checks (warn if missing; app may run in limited mode).

### 4. Update docs

- `docs/ENV_AND_VERCEL.md` — Add OPENAI_API_KEY to "What to set", link to troubleshooting
- `docs/VERCEL_ENV_SETUP.md` — Add "Incorrect API key" troubleshooting: verify key in dashboard, check environment (Prod/Preview/Dev), redeploy, verify key format (starts with sk-)

## File impacts

| Action | Path |
|--------|------|
| Create | src/lib/openai.ts |
| Modify | src/actions/book-analyze.ts |
| Modify | src/actions/generate-quest.ts |
| Modify | scripts/preflight-env.ts |
| Modify | docs/ENV_AND_VERCEL.md |
| Modify | docs/VERCEL_ENV_SETUP.md |

## Verification

1. With key missing: AI action returns clear error (not "Incorrect API key")
2. With key set: Book analysis, I Ching quest gen work
3. `npm run smoke` warns if OPENAI_API_KEY missing
