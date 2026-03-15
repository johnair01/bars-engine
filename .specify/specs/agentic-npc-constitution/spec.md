# Spec: Agentic NPC Constitution System v0
### Governed by the Regent Game Master Agent

Status: Draft
Priority: 1.10
ID: ANC

---

## Purpose

Give important NPCs stable identity, bounded memory, constrained initiative, and relational continuity — without granting them sovereignty. All NPC constitutions are governed by the Regent Game Master Agent.

## Core Constraints

1. NPCs are scene-serving beings. They exist for player growth, campaign coherence, and emotional alchemy vectors.
2. Constitutions precede behavior. No NPC acts without a valid constitution.
3. The Regent is the constitutional authority. Creation, activation, mutation, and enforcement all route through the Regent.
4. Deterministic world laws cannot be overridden by NPC constitutions (vibeulon rules, scene DSL, privacy, campaign phase rules).
5. NPC initiative is always the lowest priority (below canonical world laws, campaign coherence, player growth, EA alignment, NPC constitutional integrity).

## NPC Tiers

| Tier | Profile | Memory | Reflection |
|------|---------|--------|------------|
| 1 — Static | Fixed scene role | None | None |
| 2 — Relational | Relationship memory, constrained actions | Relationship | Minimal |
| 3 — Reflective | Bounded offstage reflection, quest-seed suggestions | Persistent | Regent-reviewed |
| 4 — High-Order | Sages, librarians, tricksters, daemons, game masters | Full | Full, Regent-reviewed |

## Constitution Schema (Core Fields)

```json
{
  "npc_id": "string",
  "name": "string",
  "archetypal_role": "string",
  "constitution_version": "string",
  "identity": { "core_nature", "voice_style", "worldview", "mask_type" },
  "values": { "protects": [], "longs_for": [], "refuses": [] },
  "function": { "primary_scene_role", "quest_affinities": [], "bar_affinities": [] },
  "limits": {
    "can_initiate_scene_types": [],
    "cannot_do": [],
    "requires_regent_approval_for": []
  },
  "memory_policy": { "memory_scope": "scene|campaign|relationship", "retention_rules": [] },
  "reflection_policy": { "background_reflection_allowed": bool, "max_reflection_outputs": 2 },
  "governance": { "governed_by": "regent_game_master", "constitutional_status": "draft|active|suspended|archived" }
}
```

## DB Models Required

- `npc_constitutions` — stable identity + governance
- `npc_constitution_versions` — audit trail
- `npc_memories` — relational continuity (scope: scene|campaign|relationship)
- `npc_reflections` — bounded offstage reflection (status: pending|approved|rejected)
- `npc_actions` — verb-bounded scene actions
- `npc_relationship_states` — trust/tension per player per NPC

## NPC Action Verbs (Allowed)

`reveal_lore` · `ask_question` · `challenge_player` · `affirm_player` · `offer_quest_seed` · `reflect_bar` · `redirect_scene` · `deepen_scene` · `handoff_to_other_npc`

Each action is validated against: NPC constitution + campaign phase + scene grammar + EA legality + Regent oversight rules.

## Acceptance Criteria

1. NPCs can be created with constitutions (Tier 1–4).
2. Every active constitution is governed by the Regent.
3. NPCs can store bounded memory.
4. Tier 3/4 NPCs can generate bounded reflections requiring Regent review.
5. NPC actions validate against constitution + world laws.
6. NPCs cannot self-amend their constitutions.

## Non-Goals

No NPC self-modifying code, unconstrained goal formation, constitutional independence, full society simulation, or NPC-to-NPC autonomous agency.

## Dependencies

- Emotional Alchemy Scene Library (AES) — scene vector targeting
- NPC Agent Game Loop Simulation (DD) — existing pickQuestForAgent base
- Daemons System (DC-3) — Tier 4 NPC pattern already established
