# Tasks: OpenAI API Key — Secure and Accessible

- [x] Create src/lib/openai.ts with getOpenAI() and key validation
- [x] Migrate src/actions/book-analyze.ts to use getOpenAI()
- [x] Migrate src/actions/generate-quest.ts to use getOpenAI()
- [x] Search for and migrate any other openai() usages
- [x] Add OPENAI_API_KEY to preflight optional checks
- [x] Update docs/ENV_AND_VERCEL.md and docs/VERCEL_ENV_SETUP.md
- [ ] Test: with key missing, verify clear error; with key set, verify AI features work
