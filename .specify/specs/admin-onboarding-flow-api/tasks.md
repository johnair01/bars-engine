# Tasks: Admin Onboarding Flow API

## Phase 1: API Route

- [x] Create `src/app/api/admin/onboarding/flow/route.ts`
- [x] Implement GET handler with campaign query param validation
- [x] Read twee file and call translateTweeToFlow
- [x] Return FlowOutput JSON; 400 for unknown campaign; 500 on error

## Phase 2: Client Component

- [x] Create `src/app/admin/onboarding/OnboardingFlowTemplate.tsx` (client component)
- [x] Fetch flow API on mount; handle loading and error states
- [x] Build ordered node list from start_node_id + actions
- [x] Render timeline UI (numbered steps, node id, type, truncated copy)
- [x] Add OnboardingFlowTemplate to admin onboarding page above Primary Orientation Path

## Phase 3: Verification Quest

- [x] Add cert-admin-onboarding-flow-api-v1 to seed-cyoa-certification-quests.ts
- [x] Create Twine passages (START, STEP_1, STEP_2, STEP_3, END_SUCCESS, FEEDBACK)
- [x] Create TwineStory and CustomBar for verification quest

## Verification

- [x] npm run build passes
- [x] npm run check passes
- [x] Visit /admin/onboarding — template section visible
- [x] curl API returns valid FlowOutput
