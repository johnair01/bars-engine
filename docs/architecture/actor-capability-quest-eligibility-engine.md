# Actor Capability + Quest Eligibility Engine v0

## Overview

The Actor Capability + Quest Eligibility Engine is the matching and surfacing layer of Bars-engine. It determines which quests an actor is eligible to see, which quests they are well-suited to take, which agents can support a quest, which nation/archetype overlays are relevant, and which interaction BARs are relevant to a given actor.

**Core rule**: Matching and ranking logic lives in the service layer. The UI renders the engine's outputs; it does not invent ad hoc matching.

---

## Part 1: Core Concepts

### 1.1 Actor Capability

What an actor is able, allowed, or well-positioned to do. Capabilities derive from role, nation, archetype (playbook), unlocked moves, prior quest completions, BAR response history, explicit permissions, and agent profile (for simulated actors).

### 1.2 Quest Requirement

What a quest requires for stewardship, participation, support, consultation, or witnessing. Requirements may be hard (must satisfy) or soft (preferred). Sources: nation, archetype, moveType, allyshipDomain, campaignRef, role openings, prior quests.

### 1.3 Eligibility / Suitability

The relationship between actor capabilities and quest requirements.

- **Hard eligibility**: Actor is allowed to see or take the quest. Binary.
- **Soft suitability**: Actor is a strong fit based on nation, archetype, capabilities, and current state. Supports ranking, not just yes/no.

---

## Part 2: Actor Capability Model

### Capability Object Schema

```ts
interface ActorCapability {
  capability_id: string
  capability_type: 'role' | 'move' | 'support' | 'quest_action' | 'domain'
  source: 'nation' | 'archetype' | 'quest_history' | 'permission' | 'agent_profile'
  strength?: number | 'high' | 'medium' | 'low'
}
```

### Actor Capability Response

```ts
interface ActorCapabilityResponse {
  actor_id: string
  actor_type: 'player' | 'agent'
  capabilities: ActorCapability[]
}
```

### Capability Categories (v0)

| Capability | Description |
|------------|--------------|
| can_steward_fundraiser | Can take stewardship of fundraiser quests |
| can_witness | Can respond with witness intent |
| can_consult_strategy | Can provide consult for strategy help |
| can_support_friendcraft | Can support friendcraft-domain quests |
| can_hold_reflection_space | Can host reflection BARs |
| can_host_event | Can steward event coordination |
| can_offer_accountability | Can join as Accountable |
| can_perform_courage_experiment | Can take courage/action quests |

Capabilities are derived from nation, playbook, unlocked NationMoves, BarResponse history, and agent profile. Keep v0 simple and extensible.

---

## Part 3: Actor Profile Inputs

### Actor Profile Schema

```ts
interface ActorProfileInput {
  actor_id: string
  actor_type: 'player' | 'agent'
  nation?: string           // Nation.id or nation slug
  archetype?: string         // Playbook.id or playbook slug
  campaign_ids?: string[]     // campaignRef values
  active_roles?: string[]    // RACI roles from BarResponse
  completed_quest_ids?: string[]
  capability_tags?: string[]
  unlocked_move_ids?: string[]
  campaign_domain_preference?: string[]  // allyshipDomain filter
  availability?: 'available' | 'limited' | 'unavailable'  // optional in v0
}
```

### Data Sources (Bars-engine)

| Input | Schema Source |
|-------|---------------|
| nation | Player.nationId → Nation |
| archetype | Player.playbookId → Playbook |
| campaign_ids | InstanceMembership, CustomBar.campaignRef |
| active_roles | BarResponse.responseType → RACI |
| completed_quest_ids | PlayerQuest, QuestMoveLog |
| unlocked_move_ids | PlayerNationMoveUnlock |
| campaign_domain_preference | Player.campaignDomainPreference (JSON) |

---

## Part 4: Quest Requirement Model

### Quest Requirement Schema

```ts
interface QuestRequirement {
  quest_id: string
  required_capabilities?: string[]
  preferred_capabilities?: string[]
  required_campaign_membership?: string
  preferred_nations?: string[]
  preferred_archetypes?: string[]
  required_roles_open?: ('responsible' | 'accountable' | 'consulted' | 'informed')[]
  required_prior_quests?: string[]
  allyship_domain?: string
  move_type?: string
}
```

### Schema Mapping (CustomBar)

| Requirement | CustomBar Field |
|-------------|-----------------|
| preferred_nations | allowedNations (JSON or comma-separated) |
| preferred_archetypes | allowedTrigrams, archetype |
| allyship_domain | allyshipDomain |
| move_type | moveType |
| campaign | campaignRef |

### Examples

- Micro fundraiser quest: prefer Devoted Guardian (Meridia), Joyful Connector (Virelune), Bold Heart (Pyrakanth)
- Strategy help BAR: prefer Argyra actors, consult-capable agents, Truth Seer archetypes
- Witnessing/support quest: prefer actors with can_witness

---

## Part 5: Eligibility Types

### 1. Hard Eligibility

Actor is allowed to see or take the quest.

- Campaign access (campaignRef matches actor membership)
- Permission scope (visibility, claimedBy)
- Prerequisite completed (required_prior_quests)
- Role slot available (no take_quest yet → Responsible open)

### 2. Stewardship Eligibility

Actor is a valid candidate to take_quest and become Responsible.

- Hard eligibility satisfied
- Quest has no steward (Responsible slot open)
- Actor has can_steward_* or equivalent capability

### 3. Suitability / Relevance

Actor is not only eligible but a strong fit. Supports ranking.

- Nation match score
- Archetype match score
- Capability overlap
- Domain alignment
- Progression stage fit

---

## Part 6: Matching Dimensions

| Dimension | Description | Signal Source |
|-----------|--------------|---------------|
| Nation Match | Emotional pathway alignment | CustomBar.nation, allowedNations; Player.nationId; Nation.element |
| Archetype Match | Agency style alignment | CustomBar.archetype, allowedTrigrams; Player.playbookId |
| Capability Match | Support/stewardship/consult capability | Derived capabilities |
| Role Availability Match | Open RACI slots | BarResponse → threadRoles |
| Context Match | Campaign, allyship domain, impact track | campaignRef, allyshipDomain, campaignDomainPreference |
| Progression Match | Onboarding/engagement stage | hasCompletedFirstQuest, onboardingComplete |

Nation and archetype are matching signals, not strict gates unless configured per quest.

---

## Part 7: Eligibility Output Model

### Output Schema

```ts
interface EligibilityResult {
  actor_id: string
  quest_id: string
  hard_eligible: boolean
  stewardship_eligible: boolean
  eligible_roles: ('responsible' | 'accountable' | 'consulted' | 'informed')[]
  match_score: number  // 0–1
  match_reasons: string[]
}
```

### Match Reasons (Inspectable)

Examples: `nation_match`, `archetype_match`, `has_consult_capability`, `role_slot_open`, `domain_alignment`, `progression_fit`.

The engine must explain why something matched. Avoid black-box scoring.

---

## Part 8: Visibility vs Recommendation

| Concept | Definition |
|---------|------------|
| **Visibility** | Actor is allowed to see the quest or BAR. May be many items. |
| **Recommendation** | Actor should see it prominently because it is a strong fit. Few high-signal items. |

An actor may see many quests but only be recommended a few. Dashboard surfaces recommendations, not every visible item.

---

## Part 9: Role-Aware Eligibility

RACI roles derive from BarResponse (take_quest → Responsible, join → Accountable, consult → Consulted, witness → Informed).

- If no one has take_quest: surface strong Responsible candidates
- If steward exists but lacks accountability: recommend join
- If help_request seeks information: surface consult-capable actors
- If reflection BAR is public: surface witness-capable actors

The engine considers open relational roles, not just quest content.

---

## Part 10: Agent Matching

Agent profiles include: nation, archetype, role preferences, support capabilities, move style emphasis, domain specialization.

| Agent Type | Suited For |
|------------|------------|
| ResearchAgent | consult |
| WitnessAgent | informed |
| StewardAgent | take_quest (low-risk quests) |
| LibrarianAgent | information-rich quests, help_request |

Agent matching uses the same engine as human matching. Agent profile maps to ActorProfileInput.

---

## Part 11: Nation + Archetype Integration

### Nation Fit (Emotional)

| Nation | Fit |
|--------|-----|
| Argyra | Clarity, investigation |
| Pyrakanth | Courage, action |
| Lamenth | Emotional repair, reflection |
| Meridia | Stewardship, balance |
| Virelune | Growth, creative, social |

### Archetype Fit (Agency)

| Archetype | Fit |
|-----------|-----|
| Bold Heart | Initiation |
| Danger Walker | Controlled risk |
| Truth Seer | Clarity, revelation |
| Still Point | Grounding, boundary |
| Subtle Influence | Gradual shaping |
| Devoted Guardian | Support, stability |
| Decisive Storm | Breakthrough, disruption |
| Joyful Connector | Relational activation |

Use as matching signals, not strict gates unless configured.

---

## Part 12: Friendcraft and Allyship Domains

Domains: onboarding, impact/fundraising, allyship, friendcraft, transformation/personal.

Allyship domains (WHERE): `GATHERING_RESOURCES`, `DIRECT_ACTION`, `RAISE_AWARENESS`, `SKILLFUL_ORGANIZING`.

Actor capability and relevance vary by domain. Examples:

- Strong for Friendcraft organizing, weak for Allyship strategy
- Excellent at witnessing, not event stewardship
- Ideal for direct action, weak for cleanup

Engine supports domain-aware matching via `allyshipDomain` and `campaignDomainPreference`.

---

## Part 13: Integration with Existing Systems

| System | Integration |
|--------|-------------|
| Actor model | Player, nationId, playbookId, campaignDomainPreference |
| Nation profiles | Nation, NationMove, transformation-move-registry compatible_nations |
| Archetype overlays | Playbook, ARCHETYPE_KEYS, transformation-move-registry compatible_archetypes |
| Transformation move registry | Move categories, lock types, quest templates |
| Quest stewardship / RACI | BarResponse, getBarRoles, threadRoles |
| BAR interaction layer | CustomBar types, listBars, getBarFeed |

---

## Part 14: Implementation Structure

Proposed paths (adapt to project structure):

```
src/features/eligibility/
  api/           # HTTP handlers or server action entry points
  services/      # Matching logic, scoring, filters
  types/         # Schemas, interfaces
  __tests__/     # Unit tests
```

---

## Part 15: Testing Requirements

Tests must verify:

- Hard eligibility filters work (campaign, permission, prerequisite)
- Match scoring is deterministic and inspectable
- Nation and archetype signals affect ranking
- Role openings affect recommendations (open Responsible vs filled)
- Domain tags (allyshipDomain, campaignDomainPreference) affect relevance
- Agent matching works through same engine as human matching
- Dashboard queries return sensible high-signal results
- evaluateEligibility returns blocking_reasons when hard_eligible is false

---

## Part 16: Constraints (v0)

- API-first
- Distinguish visibility from recommendation
- Support human and agent actors
- Nation/archetype/domain matching
- Explainable (match_reasons)
- Role-aware matching

Do not build: opaque ML ranking, front-end-only matching, complex social graphs.

Favor: rule-based scoring, explicit reasons, deterministic matching, composable filters, inspectable outputs.
