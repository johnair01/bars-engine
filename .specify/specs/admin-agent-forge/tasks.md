# Tasks: Admin Agent Forge (3-2-1 Shadow Process)

## Phase 1: Schema and Types

- [ ] Add ForgeSession model to prisma/schema.prisma
- [ ] Add AgentSpec model (or document as future)
- [ ] Add AgentPatch model (or document as future)
- [ ] Add Player.lastForgeTimestamp or AdminForgeState for cooldown
- [ ] Add DeftnessScore or default cooldown logic
- [ ] Create src/lib/forge-types.ts (enums, ForgeStage, types)
- [ ] Run db:sync

## Phase 2: Eligibility and Cooldown

- [ ] Implement checkForgeEligibility(adminId)
- [ ] Implement getCooldownPeriod(deftnessScore)
- [ ] Create POST /api/admin/forge/check-eligibility

## Phase 3: State Machine and Stages

- [ ] Create POST /api/admin/forge/start
- [ ] Create PATCH /api/admin/forge/[id] (advance stage, persist data)
- [ ] Create POST /api/admin/forge/[id]/complete
- [ ] Implement stage handlers for THIRD_PERSON, SECOND_PERSON, FIRST_PERSON, FRICTION_REASSESS, ROUTING, COMPLETE

## Phase 4: Value Extraction

- [ ] Implement extractValues(aligned_step, reclaimed_intent) — deterministic

## Phase 5: Agent Output

- [ ] Implement NEW_AGENT branch (create AgentSpec)
- [ ] Implement APPEND_EXISTING branch (create AgentPatch)
- [ ] Vibeulon routing and infusion into agent

## Phase 6: Public/Private Separation

- [ ] Ensure ForgeSessionPrivate never exposed
- [ ] AgentDeltaPublic only for public-facing APIs

## Phase 7: Admin UI

- [ ] Create /admin/forge page
- [ ] Create ForgeWizard or multi-step form component
- [ ] Eligibility gate UI
- [ ] Agent Wizard (NEW_AGENT vs APPEND_EXISTING, routing)

## Verification

- [ ] Admin can start Forge only when eligible
- [ ] Cooldown blocks re-entry
- [ ] Mint only when friction_delta > 2
- [ ] 3-2-1 stages sequential
- [ ] Routing required when minted
- [ ] Private data not exposed
