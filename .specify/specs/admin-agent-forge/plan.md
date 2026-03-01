# Plan: Admin Agent Forge (3-2-1 Shadow Process)

## Summary

Implement Admin-only Agent Forge: 3-2-1 shadow process with friction-gated vibeulon minting, cooldown governance, and agent creation/patching. Private emotional data stays admin-only; public agent deltas only.

## Implementation Phases

### Phase 1: Schema and Types

**1.1 Prisma schema**

- Add `ForgeSession` model: adminId, stage, part_description, trigger_context, observed_pattern, desired_experience, desired_satisfaction, current_game_state, current_dissatisfaction, underlying_belief, sabotage_belief, first_person_voice, reclaimed_intent, aligned_step, friction_start, friction_end, friction_delta, vibeulon_minted, last_forge_timestamp (on Player or separate table), createdAt, completedAt
- Add `AgentSpec` model: name, nation_orientation, distortion_signature, core_values (JSON), constraints (JSON), belief_context, sabotage_signature, createdFromForgeSessionId
- Add `AgentPatch` model: agent_id, add_values (JSON), add_constraints (JSON), update_distortion_signature, createdFromForgeSessionId
- Add `ForgeRouting` or embed in ForgeSession: target_type, target_id, allocation_weight
- Add `Player.lastForgeTimestamp` or `AdminForgeState` for cooldown
- Add `DeftnessScore` on Player or derive from playbook/sessions (or use default cooldown if not present)

**1.2 Type definitions**

- ForgeStage enum
- SatisfactionApexEnum, DissatisfactionEnum, SelfSabotageEnum, RoutingTargetEnum
- ForgeSessionPrivate vs AgentDeltaPublic types

### Phase 2: Eligibility and Cooldown

**2.1 Eligibility gate**

- `checkForgeEligibility(adminId)`: distortion_intensity >= 5 (or from intake), cooldown expired
- `getCooldownPeriod(deftnessScore)`: 0–3 → 7d, 4–6 → 5d, 7–10 → 3d
- Return clear error states: BLOCKED_COOLDOWN, BLOCKED_LOW_DISTORTION

**2.2 API route**

- `POST /api/admin/forge/check-eligibility` — returns eligible | blocked + reason

### Phase 3: State Machine and Stages

**3.1 Forge session API**

- `POST /api/admin/forge/start` — create session, set stage THIRD_PERSON
- `PATCH /api/admin/forge/[id]` — advance stage, persist stage-specific data
- `POST /api/admin/forge/[id]/complete` — set COMPLETE, trigger cooldown, route vibeulon

**3.2 Stage handlers**

- THIRD_PERSON: persist part_description, trigger_context, observed_pattern
- SECOND_PERSON: persist 6-question answers, map to enums
- FIRST_PERSON: persist first_person_voice, reclaimed_intent, aligned_step; run extractValues
- FRICTION_REASSESS: persist friction_end, compute delta, set vibeulon_minted
- ROUTING: require routing if minted; persist RoutingObject
- COMPLETE: finalize, set lastForgeTimestamp

### Phase 4: Value Extraction

**4.1 extractValues function**

- `extractValues(aligned_step: string, reclaimed_intent: string) → { minted_values: string[], minted_constraints: string[] }`
- Deterministic (regex/keyword or rule-based); no LLM

### Phase 5: Agent Output

**5.1 NEW_AGENT branch**

- Create AgentSpec from session data
- Link vibeulon to new agent (if AgentSpec has vibeulon field or separate AgentVibeulon table)

**5.2 APPEND_EXISTING branch**

- Create AgentPatch
- Apply patch to target agent context
- Infuse vibeulon into agent

### Phase 6: Public/Private Separation

**6.1 Data access layer**

- ForgeSessionPrivate: full data, admin-only
- AgentDeltaPublic: agent_id, delta_type, affected_layers, vibeulon_minted, timestamp
- Never return private fields in public APIs

### Phase 7: Admin UI

**7.1 Forge UI scaffold**

- `/admin/forge` — eligibility check, start session
- Multi-step form: Stage 3 → Stage 2 (6 questions) → Stage 1 (first person + 7th question) → Friction reassess → Routing → Complete
- Agent Wizard: NEW_AGENT vs APPEND_EXISTING; routing target picker

## File Impact Summary

| Action | File |
|--------|------|
| Edit | `prisma/schema.prisma` |
| Create | `src/lib/forge-types.ts` |
| Create | `src/lib/forge-extract-values.ts` |
| Create | `src/actions/forge.ts` |
| Create | `src/app/api/admin/forge/check-eligibility/route.ts` |
| Create | `src/app/api/admin/forge/start/route.ts` |
| Create | `src/app/api/admin/forge/[id]/route.ts` |
| Create | `src/app/api/admin/forge/[id]/complete/route.ts` |
| Create | `src/app/admin/forge/page.tsx` |
| Create | `src/components/admin/ForgeWizard.tsx` (or similar) |

## Success Criteria

- Forge cannot start before cooldown expires
- Forge cannot mint without Δ > 2
- 3-2-1 stages required and sequential
- 6 questions only in Stage 2; 7th in Stage 1
- All minted vibeulons routed
- Private emotional data never leaks
