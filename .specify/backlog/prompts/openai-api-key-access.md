# Spec Kit Prompt: OpenAI API Key — Secure and Accessible

## Role

Fix "Incorrect API key provided" errors for AI features (Book analysis, Cast I Ching quest generation). Ensure the API key is secure (env only) and accessible (correctly loaded).

## Objective

Implement per [.specify/specs/openai-api-key-access/spec.md](../specs/openai-api-key-access/spec.md). Root cause: OPENAI_API_KEY may be missing, wrong, or not loaded in the execution context.

## Requirements

- **Centralized provider**: Create src/lib/openai.ts with getOpenAI() that validates key before use
- **Migration**: Replace openai() with getOpenAI()() in all AI-using actions
- **Preflight**: Add OPENAI_API_KEY to optional smoke check
- **Docs**: Update ENV_AND_VERCEL.md and VERCEL_ENV_SETUP.md with troubleshooting
- **Verification**: Missing key → clear error; valid key → AI features work

## Deliverables

- [ ] src/lib/openai.ts
- [ ] Migrated book-analyze.ts, generate-quest.ts, any others
- [ ] Preflight update
- [ ] Doc updates
- [ ] Test: missing key and valid key scenarios

## Reference

- Spec: [.specify/specs/openai-api-key-access/spec.md](../specs/openai-api-key-access/spec.md)
- Plan: [.specify/specs/openai-api-key-access/plan.md](../specs/openai-api-key-access/plan.md)
