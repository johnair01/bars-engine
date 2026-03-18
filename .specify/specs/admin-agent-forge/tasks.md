# Tasks: Admin Agent Forge (3-2-1 Shadow Process)

## Phase 1: Schema and Types

- [x] Add ForgeSession model to prisma/schema.prisma
- [x] Add AgentSpec model (or document as future)
- [x] Add AgentPatch model (or document as future)
- [x] Add Player.lastForgeTimestamp or AdminForgeState for cooldown
- [x] Add DeftnessScore or default cooldown logic
- [x] Create src/lib/forge-types.ts (enums, ForgeStage, types)
- [x] Run db:sync

## Phase 2: Eligibility and Cooldown

- [x] Implement checkForgeEligibility(adminId)
- [x] Implement getCooldownPeriod(deftnessScore)
- [x] Create POST /api/admin/forge/check-eligibility

## Phase 3: State Machine and Stages

- [x] Create POST /api/admin/forge/start
- [x] Create PATCH /api/admin/forge/[id] (advance stage, persist data)
- [x] Create POST /api/admin/forge/[id]/complete
- [x] Implement stage handlers for THIRD_PERSON, SECOND_PERSON, FIRST_PERSON, FRICTION_REASSESS, ROUTING, COMPLETE

## Phase 4: Value Extraction

- [x] Implement extractValues(aligned_step, reclaimed_intent) — deterministic

## Phase 5: Agent Output

- [x] Implement NEW_AGENT branch (create AgentSpec)
- [ ] Implement APPEND_EXISTING branch (create AgentPatch)
- [x] Vibeulon routing and infusion into agent

## Phase 6: Public/Private Separation

- [x] Ensure ForgeSessionPrivate never exposed
- [x] AgentDeltaPublic only for public-facing APIs

## Phase 7: Admin UI

- [x] Create /admin/forge page
- [x] Create ForgeWizard or multi-step form component
- [x] Eligibility gate UI
- [x] Stage panels: THIRD_PERSON, SECOND_PERSON, FIRST_PERSON, FRICTION_REASSESS, ROUTING
- [x] Add Forge link to AdminNav

## Verification

- [ ] Admin can start Forge only when eligible
- [ ] Cooldown blocks re-entry
- [ ] Mint only when friction_delta > 2
- [ ] 3-2-1 stages sequential
- [ ] Routing required when minted
- [ ] Private data not exposed
