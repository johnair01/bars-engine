# Spec: Admin Agent Forge (3-2-1 Shadow Process)

## Purpose

Implement a private Admin-only Agent Forge system that integrates the full 3-2-1 shadow process, friction-gated vibeulon minting, cooldown governance, and agent creation/patching. Admins experiencing stuckness do the 3-2-1 process (an Emotional First Aid Kit move), mint a vibeulon when friction delta exceeds threshold, and optionally route that energy to create a new agent or update an existing agent's context. Agents can acquire vibeulons by being infused through this process.

**Governance**: Admin-only. Non-admin users receive 403.

## Conceptual Model (Game Language)

- **WHO**: Admin (role === ADMIN); emergent part (3rd → 2nd → 1st person)
- **WHAT**: Forge session (3-2-1 stages); AgentSpec (new agent); AgentPatch (update existing)
- **WHERE**: Admin tool; agent context layers (archetype, nation, campaign, meta-agent, global policy)
- **Energy**: Vibeulons minted from friction delta; routed to agent creation or patch
- **Personal throughput**: Clean Up (3-2-1 is an EFAK move)

## User Stories

### P1: Forge eligibility gate
**As an admin**, I want the Forge to be gated by distortion intensity and cooldown, so I don't overuse it and only enter when genuinely stuck.

**Acceptance**: `distortion_intensity >= DISTORTION_THRESHOLD` (default 5) AND `current_time >= last_forge_timestamp + cooldown_period`. Cooldown scales by DeftnessScore: 0–3 → 7 days, 4–6 → 5 days, 7–10 → 3 days. Return clear error states if blocked.

### P2: 3-2-1 state machine
**As an admin**, I want the Forge to follow the 3-2-1 shadow process stages in order, so I complete the protocol correctly.

**Acceptance**: ForgeStage = THIRD_PERSON | SECOND_PERSON | FIRST_PERSON | FRICTION_REASSESS | ROUTING | COMPLETE. Persist stage server-side. Stages are sequential.

### P3: Stage 3 — Third person
**As an admin**, I want to describe the part in third person, so I externalize it.

**Acceptance**: Prompt "Describe the part in the third person." Optional follow-ups: when does it show up? what does it do? Persist part_description, trigger_context, observed_pattern.

### P4: Stage 2 — Second person (6 unpacking questions)
**As an admin**, I want to address the part with the 6 unpacking questions, so I unpack its experience.

**Acceptance**: Questions addressed to the part: (1) What experience are you trying to create? (2) How will you feel when you get it? (3) What is life like right now? (4) How does it feel to live here? (5) What would have to be true for someone to feel this thought? (6) What reservations do you have about your creation? Persist desired_experience, desired_satisfaction (SatisfactionApexEnum), current_game_state, current_dissatisfaction (DissatisfactionEnum), underlying_belief, sabotage_belief (SelfSabotageEnum).

### P5: Stage 1 — First person
**As an admin**, I want to speak as the part in first person and identify an aligned step, so I reclaim intent and move forward.

**Acceptance**: Prompt "Now speak as the part in first person. Begin with 'I…'" Persist first_person_voice, reclaimed_intent. 7th question: "What's one aligned step you can take to overcome these reservations?" Constraints: executable within 72 hours, must reduce avoidance. Persist aligned_step. Value extraction: `extractValues(aligned_step, reclaimed_intent) → { minted_values[], minted_constraints[] }` (deterministic, no LLM).

### P6: Friction tracking and mint gate
**As an admin**, I want vibeulons minted only when friction actually drops, so minting reflects real liberation.

**Acceptance**: At session start: friction_start (0–10). After Stage 1: friction_end (0–10). `friction_delta = friction_start - friction_end`. Mint condition: `friction_delta > 2` → vibeulon_minted = true; else false. No mint without measurable delta.

### P7: Agent output branch
**As an admin**, I want to create a new agent or update an existing one with the liberated energy, so the emergent part's needs become agent context.

**Acceptance**: Admin selects NEW_AGENT or APPEND_EXISTING. NEW_AGENT: create AgentSpec with name, nation_orientation (desired_satisfaction), distortion_signature (current_dissatisfaction), core_values, constraints, belief_context, sabotage_signature. APPEND_EXISTING: create AgentPatch with agent_id, add_values, add_constraints, optional update_distortion_signature.

### P8: Vibeulon routing (required if minted)
**As an admin**, I want to route minted vibeulons to a target, so energy flows to the right place.

**Acceptance**: If vibeulon_minted, admin must select RoutingTargetEnum: ARCHETYPE | NATION | CAMPAIGN | META_AGENT | GLOBAL_POLICY. Persist RoutingObject (target_type, target_id, allocation_weight). Session cannot complete without routing when minted.

### P9: Public vs private data separation
**As an admin**, I want my emotional data kept private, so only agent deltas are visible.

**Acceptance**: Private (ForgeSessionPrivate): full transcript, friction values, beliefs, distortion, sabotage, all intermediate data. Public (AgentDeltaPublic): agent_id, delta_type, affected_layers, vibeulon_minted, timestamp. Never expose transcript or belief data.

### P10: Cooldown trigger
**As an admin**, I want cooldown to start on session completion, so I don't re-enter too soon.

**Acceptance**: On session completion: `last_forge_timestamp = now()`. Cooldown begins immediately. Cooldown is NOT tied to aligned step completion.

### P11: Admin Forge UI
**As an admin**, I want a Forge UI at `/admin/forge` that gates by eligibility and guides me through the 3-2-1 stages, so I can complete the process without leaving the admin tool.

**Acceptance**: Eligibility check on load; if blocked, show reason (cooldown or low distortion). If eligible, show Start Forge with optional friction slider. Multi-step wizard: THIRD_PERSON → SECOND_PERSON → FIRST_PERSON → FRICTION_REASSESS → ROUTING → Complete. Each stage persists via PATCH; ROUTING submit triggers complete. Forge link in admin nav.

## Enums (Reference)

**SatisfactionApexEnum**: BLISS, TRIUMPH, POIGNANCE, PEACE, EXCITEMENT

**DissatisfactionEnum**: MANIA, SARCASM, FRUSTRATION, HATRED, DEPRESSION, DESPAIR, APATHY, BOREDOM, ANXIETY, HYPER_CRITICISM

**SelfSabotageEnum**: NOT_GOOD_ENOUGH, NOT_CAPABLE, INSIGNIFICANT, NOT_WORTHY, DONT_BELONG, NOT_READY

**RoutingTargetEnum**: ARCHETYPE, NATION, CAMPAIGN, META_AGENT, GLOBAL_POLICY

## Functional Requirements

- **FR1**: Only users with role === ADMIN may access. Non-admin → 403.
- **FR2**: Forge cannot start before cooldown expires.
- **FR3**: Forge cannot mint without friction_delta > 2.
- **FR4**: 3-2-1 stages are required and sequential.
- **FR5**: 6 questions only in Stage 2; 7th question only in Stage 1.
- **FR6**: All minted vibeulons must be routed before session completion.
- **FR7**: Private emotional data never leaks publicly.
- **FR8**: AgentSpec and AgentPatch models exist (create if not present).
- **FR9**: DeftnessScore exists or is derivable for cooldown scaling.

## Optional: Diminishing returns

If same `current_dissatisfaction` appears in consecutive sessions: `vibeulon_amount *= 0.75`. Configurable.

## Schema Notes

Existing: EmotionalFirstAidSession, EmotionalFirstAidTool, Role (admin), Player. May need to create: ForgeSession, AgentSpec, AgentPatch, DeftnessScore (or derive from Player/Playbook).

## Reference

- Conceptual model: [.specify/memory/conceptual-model.md](../../.specify/memory/conceptual-model.md) (Admin 3-2-1 Shadow Process & Agent Forge)
- Emotional First Aid: [src/actions/emotional-first-aid.ts](../../src/actions/emotional-first-aid.ts)
- Kotter: [src/lib/kotter.ts](../../src/lib/kotter.ts)

## Reevaluation (GM Consult)

Run `npm run strand:consult:forge` to invoke the Game Master agents (Architect, Regent, Shaman, Sage) for a reevaluation of this spec against the current system. Output: [GM_CONSULT_REEVALUATION.md](./GM_CONSULT_REEVALUATION.md).
