# Spec: OpenAI API Key — Secure and Accessible

## Purpose

Fix the "Incorrect API key provided" error that blocks AI features (Book analysis "Trigger Analysis", I Ching quest generation, Story Clock, etc.). Ensure the API key is both **secure** (never in code) and **accessible** (correctly loaded in all execution contexts).

## Root cause

AI features use `@ai-sdk/openai`, which reads `OPENAI_API_KEY` from `process.env`. The error occurs when:

1. **Key missing** — `.env.local` or Vercel env vars not set
2. **Key wrong** — Expired, rotated, typo, or truncated
3. **Key not loaded** — Wrong env file, or Vercel env not set for the deployment environment (Production/Preview/Development)
4. **Context mismatch** — Scripts vs server actions may load env differently

## User story

**As a developer or deployer**, I want the app to clearly indicate when the OpenAI API key is missing or invalid, so I can fix configuration without cryptic API errors.

**As a player**, I want AI features (Cast I Ching → Generate Quest, Book analysis) to work when the key is correctly configured, or to see a clear "AI features unavailable" message when not.

## Functional requirements

- **FR1**: `OPENAI_API_KEY` MUST be stored only in environment variables (`.env.local`, `.env`, or Vercel dashboard). Never in code or committed files.
- **FR2**: AI features MUST use a centralized provider that validates the key before use and returns a user-friendly error when missing.
- **FR3**: Preflight (`npm run smoke`) MUST optionally check for `OPENAI_API_KEY` presence (like `DATABASE_URL`).
- **FR4**: Documentation MUST describe local setup, Vercel setup, and troubleshooting for "Incorrect API key" errors.

## Solution approach

1. **Centralized provider** — Create `src/lib/openai.ts` that uses `createOpenAI({ apiKey })` with explicit env read. Throw a clear error if key is missing before any API call.
2. **Preflight** — Add `OPENAI_API_KEY` to optional checks in `scripts/preflight-env.ts` (warn if missing; don't fail).
3. **Docs** — Update `docs/ENV_AND_VERCEL.md` and `docs/VERCEL_ENV_SETUP.md` with troubleshooting.
4. **Migration** — Replace `import { openai } from '@ai-sdk/openai'` with `import { getOpenAI } from '@/lib/openai'` in all AI-using actions.

## Out of scope

- Key rotation automation
- Multiple provider support (e.g. Anthropic)
- Client-side AI (all AI runs server-side)

## Reference

- [@ai-sdk/openai createOpenAI](https://sdk.vercel.ai/providers/ai-sdk-providers/openai)
- Affected: [src/actions/book-analyze.ts](../../src/actions/book-analyze.ts), [src/actions/generate-quest.ts](../../src/actions/generate-quest.ts), any other AI-using server actions
- [docs/ENV_AND_VERCEL.md](../../docs/ENV_AND_VERCEL.md), [docs/VERCEL_ENV_SETUP.md](../../docs/VERCEL_ENV_SETUP.md)
