# Prompt: Admin Agent Forge (3-2-1 Shadow Process)

**Use this prompt when implementing the Admin-only Agent Forge system that integrates the 3-2-1 shadow process, friction-gated vibeulon minting, cooldown governance, and agent creation/patching.**

## Context

Admins experiencing stuckness do the 3-2-1 shadow process (an Emotional First Aid Kit move). They mint a vibeulon when friction delta exceeds threshold, and optionally route that energy to create a new agent or update an existing agent's context. Agents can acquire vibeulons by being infused through this process. Private emotional data stays admin-only; only agent deltas are public.

**Assumes**: TypeScript backend, existing Emotional First Aid intensity scale (stuckBefore/stuckAfter), existing role system with Admin flag. AgentSpec and AgentPatch models may need to be created.

## Prompt text

> Implement the Admin Agent Forge per [.specify/specs/admin-agent-forge/spec.md](../specs/admin-agent-forge/spec.md). Admin-only (role === ADMIN; 403 otherwise). Eligibility gate: distortion_intensity >= 5 AND cooldown expired (cooldown scales by DeftnessScore: 0–3 → 7d, 4–6 → 5d, 7–10 → 3d). State machine: THIRD_PERSON → SECOND_PERSON (6 unpacking questions) → FIRST_PERSON (first person voice + 7th question) → FRICTION_REASSESS → ROUTING → COMPLETE. Friction gate: mint only if friction_delta > 2. Agent output: NEW_AGENT (AgentSpec) or APPEND_EXISTING (AgentPatch). Vibeulon routing required when minted (ARCHETYPE | NATION | CAMPAIGN | META_AGENT | GLOBAL_POLICY). Public/private separation: full transcript and beliefs never exposed; only AgentDeltaPublic (agent_id, delta_type, vibeulon_minted, timestamp). Cooldown triggers on session completion. Implement: Prisma schema (ForgeSession, AgentSpec, AgentPatch), API routes, state machine logic, extractValues (deterministic), cooldown calculation, admin UI scaffold. Use game language: Energy (vibeulons), Clean Up (3-2-1 EFAK move).

## Checklist

- [ ] Schema: ForgeSession, AgentSpec, AgentPatch; Player.lastForgeTimestamp or AdminForgeState
- [ ] Eligibility: checkForgeEligibility, getCooldownPeriod
- [ ] API: /api/admin/forge/check-eligibility, start, [id], [id]/complete
- [ ] State machine: 6 stages, sequential, persist
- [ ] extractValues(aligned_step, reclaimed_intent) — deterministic
- [ ] Agent output: NEW_AGENT, APPEND_EXISTING
- [ ] Vibeulon routing when minted
- [ ] Public/private separation
- [ ] Admin UI: /admin/forge, ForgeWizard

## Reference

- Spec: [.specify/specs/admin-agent-forge/spec.md](../specs/admin-agent-forge/spec.md)
- Plan: [.specify/specs/admin-agent-forge/plan.md](../specs/admin-agent-forge/plan.md)
- Tasks: [.specify/specs/admin-agent-forge/tasks.md](../specs/admin-agent-forge/tasks.md)
- Conceptual model: [.specify/memory/conceptual-model.md](../memory/conceptual-model.md) (Admin 3-2-1 Shadow Process & Agent Forge)
- Emotional First Aid: [src/actions/emotional-first-aid.ts](../../src/actions/emotional-first-aid.ts)
