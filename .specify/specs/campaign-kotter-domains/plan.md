# Plan: Campaign Kotter Structure + Domain × Kotter Matrix

## Summary

Phase 1: Add `kotterStage` to Instance; admin sets/advances stage; Market filters by instance stage; Event shows stage; lore gets Domain × Kotter matrix. Phase 2: Campaign model for multiple campaigns per instance; new player encounter with campaign context.

## Phase 1: Instance-Level Kotter

### 1. Schema
- **File**: `prisma/schema.prisma`
- Add `kotterStage Int @default(1)` to Instance model
- Run `npm run db:sync` (per workspace rules)

### 2. Admin: Instance Kotter Stage
- **File**: `src/actions/instance.ts`
  - Add `kotterStage` to `upsertInstance` (read from formData, persist)
  - Parse `kotterStage` as Int 1–8; validate range
- **File**: `src/app/admin/instances/page.tsx`
  - Add Kotter stage dropdown (1–8 with stage names from KOTTER_STAGES) to create/update form
  - For edit: pass existing instance's kotterStage to form; show current stage
  - Use hidden input or form field `name="kotterStage"`

### 3. Market: Filter by Instance Stage
- **File**: `src/actions/market.ts`
  - Import `getActiveInstance`
  - After fetching publicQuests: if active instance exists, filter to `q.kotterStage === instance.kotterStage`
  - Apply after globalState.isPaused check; before nation/playbook/domain filters
  - When no active instance: keep current behavior (all quests or paused → stage 1)
- **File**: `src/app/bars/available/page.tsx`
  - When instance-stage filtering is active: show "Campaign: Stage N" badge or adjust stage pill to reflect instance (optional: allow admin override)

### 4. Event Page: Show Stage
- **File**: `src/app/event/page.tsx`
  - Import KOTTER_STAGES from `@/lib/kotter`
  - When instance has kotterStage: display "Stage N: {name}" (e.g. "Stage 2: Coalition")
  - Optional: add domain-specific prompt from matrix (e.g. for GATHERING_RESOURCES stage 2: "Who will contribute?")

### 5. Lore: Domain × Kotter Matrix
- **File**: `.agent/context/kotter-by-domain.md` (new)
  - Create lore doc with full Domain × Kotter matrix
  - Include relationship notes (RAISE_AWARENESS subordinate, DIRECT_ACTION = playing)
- **File**: `FOUNDATIONS.md` or `ARCHITECTURE.md`
  - Add brief reference to Domain × Kotter (or link to kotter-by-domain.md)

### 6. Thresholds Doc (Admin Guidance)
- **File**: `.specify/specs/campaign-kotter-domains/THRESHOLDS.md` (new)
  - Table: Stage | Donation % | Backlog items | Notes
  - Placeholder values; admin fills in for Bruised Banana

## Phase 2: Campaign Model + New Player Encounter

### 7. Campaign Model (Schema)
- **File**: `prisma/schema.prisma`
- Add Campaign model: instanceId, slug, name, allyshipDomain, kotterStage
- Instance has many Campaigns
- Run `npm run db:sync`

### 8. Admin: Campaign CRUD
- **File**: `src/actions/campaign.ts` (new) — createCampaign, updateCampaign, listCampaignsByInstance
- **File**: `src/app/admin/instances/[id]/campaigns/page.tsx` (new) or extend instances page — list campaigns, add/edit campaign form
- **File**: `src/app/admin/instances/page.tsx` — link to campaigns for each instance

### 9. Market: Filter by Campaign
- **File**: `src/actions/market.ts`
  - When Campaign model exists: get active instance's campaigns; filter quests by campaign (allyshipDomain + kotterStage)
  - Fallback: when no campaigns, use instance.kotterStage (Phase 1 behavior)
  - AppConfig may need `activeCampaignId` or we show all campaigns for active instance

### 10. New Player Encounter
- **File**: `src/app/bars/available/page.tsx` or `src/app/event/page.tsx`
  - Add "Campaign context" block: "Bruised Banana Fundraiser (Gathering Resources) — Stage 2: Coalition"
  - Show when active instance/campaign exists
  - Brief copy; link to /event for details

## Verification (Phase 1)

1. Add kotterStage to Instance; run `npm run db:sync`
2. Admin → Instances: set kotterStage on create/update; save persists
3. Market: with active instance at stage 2, only stage-2 quests appear (combined with other filters)
4. Event page: shows "Stage N: {name}"
5. `.agent/context/kotter-by-domain.md` exists with matrix
6. THRESHOLDS.md exists

## Verification (Phase 2)

1. Campaign model exists; admin can CRUD campaigns
2. Market filters by campaign when campaigns exist
3. Campaign context visible on Market or Event for new players

## File Impact Summary

| File | Phase 1 | Phase 2 |
|------|---------|---------|
| prisma/schema.prisma | +kotterStage on Instance | +Campaign model |
| src/actions/instance.ts | +kotterStage in upsert | - |
| src/app/admin/instances/page.tsx | +stage dropdown | +campaigns link |
| src/actions/market.ts | +instance stage filter | +campaign filter |
| src/app/event/page.tsx | +stage display | +campaign context |
| src/app/bars/available/page.tsx | optional badge | +campaign context |
| .agent/context/kotter-by-domain.md | new | - |
| .specify/specs/.../THRESHOLDS.md | new | - |
| src/actions/campaign.ts | - | new |
| src/app/admin/.../campaigns/ | - | new |

## Reference

- Spec: [.specify/specs/campaign-kotter-domains/spec.md](spec.md)
- Kotter lib: [src/lib/kotter.ts](../../src/lib/kotter.ts)
- Instance actions: [src/actions/instance.ts](../../src/actions/instance.ts)
