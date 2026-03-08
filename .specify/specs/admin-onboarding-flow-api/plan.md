# Plan: Admin Onboarding Flow API

## Summary

API-first implementation: create the flow API route, then a client component that consumes it and displays the Bruised Banana template structure on the admin onboarding page. Add verification quest.

## Phase 1: API Route

### 1.1 Create route handler

**File**: `src/app/api/admin/onboarding/flow/route.ts` (new)

- Import `translateTweeToFlow` from `@/lib/twee-to-flow`
- Import `readFile` from `fs/promises` and `path` from `path`
- Implement `GET` handler:
  - Read `campaign` from `searchParams`; if missing or not `bruised-banana`, return `NextResponse.json({ error: 'Unknown campaign' }, { status: 400 })`
  - Read twee file: `path.join(process.cwd(), 'content/twine/onboarding/bruised-banana-onboarding-draft.twee')`
  - Call `translateTweeToFlow(tweeSource, { flowId: 'bruised-banana-onboarding-v1', campaignId: 'bruised_banana_residency' })`
  - Return `NextResponse.json(flow)`
- Handle file read errors (return 500 with message)

## Phase 2: Client Component

### 2.1 OnboardingFlowTemplate component

**File**: `src/app/admin/onboarding/OnboardingFlowTemplate.tsx` (new)

- `"use client"`
- `useState` for flow data, loading, error
- `useEffect` to fetch `GET /api/admin/onboarding/flow?campaign=bruised-banana` on mount
- Build ordered node list: start from `flow.start_node_id`, follow `actions[0].next_node_id` until null or cycle. Fallback: use `flow.nodes` array order.
- Render section with:
  - Heading: "Template Structure (Bruised Banana)"
  - Subtext: "Reflects the onboarding draft. DB-driven threads below."
  - Timeline: vertical line, numbered steps, each node shows `id`, `type` badge, truncated `copy` (line-clamp-1), first action label if any
- Loading: skeleton or "Loading template..."
- Error: "Failed to load template structure"

### 2.2 Integrate into admin page

**File**: `src/app/admin/onboarding/page.tsx`

- Import `OnboardingFlowTemplate`
- Add new section above "Primary Orientation Path":
  ```tsx
  <section className="space-y-6">
    <h2>Template Structure (Bruised Banana)</h2>
    <OnboardingFlowTemplate />
  </section>
  ```
- Preserve existing layout and styling (BookOpen icon, spacing)

## Phase 3: Verification Quest

### 3.1 Add cert-admin-onboarding-flow-api-v1

**File**: `scripts/seed-cyoa-certification-quests.ts`

- Add `cert-admin-onboarding-flow-api-v1` to `CERT_QUEST_IDS`
- Add Twine passages:
  - START: Intro — verify admin onboarding flow API
  - STEP_1: Visit [Admin → Onboarding](/admin/onboarding)
  - STEP_2: Confirm "Template Structure (Bruised Banana)" section visible with nodes (Arrival, The Work, etc.)
  - STEP_3: Confirm API returns JSON: open `/api/admin/onboarding/flow?campaign=bruised-banana` or use curl
  - END_SUCCESS: Complete to receive reward
  - FEEDBACK: Report issue
- Create TwineStory (slug: `cert-admin-onboarding-flow-api-v1`)
- Create CustomBar (id: `cert-admin-onboarding-flow-api-v1`, type: onboarding, isSystem: true, visibility: public, reward: 1)

## File Summary

| Action | Path |
|--------|------|
| Create | `src/app/api/admin/onboarding/flow/route.ts` |
| Create | `src/app/admin/onboarding/OnboardingFlowTemplate.tsx` |
| Modify | `src/app/admin/onboarding/page.tsx` |
| Modify | `scripts/seed-cyoa-certification-quests.ts` |

## Verification

- `npm run build` and `npm run check` pass
- Visit `/admin/onboarding` — see template section
- `curl http://localhost:3000/api/admin/onboarding/flow?campaign=bruised-banana` returns valid FlowOutput
- Run `npm run seed:cert:cyoa` (or equivalent) to add verification quest
