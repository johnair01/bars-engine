# Tasks: Dashboard-First Orientation Flow

## Phase 1 — Configurable Redirect

- [x] Add `postSignupRedirect String?` to AppConfig in prisma/schema.prisma
- [x] Run `npm run db:sync`
- [x] Create or extend getAppConfig: add `getPostSignupRedirect(): Promise<'conclave' | 'dashboard'>` — read AppConfig, default `'dashboard'`
- [x] In createCampaignPlayer: after assignOrientationThreads, call getPostSignupRedirect
  - If `'dashboard'`: fetch current orientation progress; redirect to `/?focusQuest={questId}` when current quest exists, else `/`
  - If `'conclave'`: redirect to `/conclave/onboarding` (current behavior)
- [x] In createGuidedPlayer (conclave.ts): same redirect logic
- [x] Ensure CampaignAuthForm uses `state.redirectTo` from action
- [x] Seed or set default postSignupRedirect = 'dashboard' for singleton AppConfig (default in getPostSignupRedirect when null)
- [x] Run `npm run build` and `npm run check` — fail-fix

## Phase 2 — Verification Quest

- [x] Add cert-dashboard-orientation-flow-v1 to seed-cyoa-certification-quests.ts (or create seed script)
- [x] Steps: Sign up via campaign CYOA → confirm dashboard redirect → confirm orientation quests → complete first quest → confirm ritual complete
- [ ] Run seed script, verify quest appears

## Phase 3 — Documentation

- [ ] Add deprecation note to conclave/onboarding page or spec
- [ ] Update DEVELOPER_ONBOARDING.md or relevant docs with postSignupRedirect config
