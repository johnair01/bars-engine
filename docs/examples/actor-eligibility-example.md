# Actor Eligibility — Example Workflows

## Example 1: Human Actor to Quest (Fundraiser)

### Input

**Actor**:
- nation: Virelune (wood, growth, connection)
- archetype: Joyful Connector
- campaign_ids: ["bruised-banana"]
- completed_quest_ids: ["q1", "q2"]
- capability_tags: ["can_host_event", "can_steward_fundraiser"]

**Quest**:
- title: "Host small fundraiser gathering"
- type: quest
- allyshipDomain: GATHERING_RESOURCES
- nation: Virelune (preferred)
- campaignRef: bruised-banana

### Output

```json
{
  "actor_id": "player_abc",
  "quest_id": "quest_xyz",
  "hard_eligible": true,
  "stewardship_eligible": true,
  "eligible_roles": ["responsible", "accountable"],
  "match_score": 0.92,
  "match_reasons": [
    "nation_match",
    "archetype_relational_fit",
    "has_steward_fundraiser_capability",
    "campaign_membership",
    "domain_alignment"
  ]
}
```

**Interpretation**: Actor is allowed to see and take the quest. High fit: nation growth/social, archetype relational activation, explicit capability.

---

## Example 2: Strategy Help BAR

### Input

**BAR**:
- type: help_request
- help_type: strategy (from inputs JSON)
- campaignRef: bruised-banana

**Eligible actors** (from getEligibleResponders):
- Argyra actors (clarity, structure)
- consult-capable agents
- Truth Seer archetypes (revelation, clarity)

### Output (one responder)

```json
{
  "actor_id": "player_def",
  "actor_type": "player",
  "match_score": 0.85,
  "match_reasons": [
    "nation_argyra_clarity_fit",
    "has_consult_strategy_capability"
  ],
  "suggested_response": "consult"
}
```

---

## Example 3: Friendcraft Quest

### Input

**Quest**:
- title: "Organize top 5 friendships into meaningful rhythm"
- allyshipDomain: SKILLFUL_ORGANIZING
- preferred_archetypes: ["Devoted Guardian", "Subtle Influence"]
- preferred_capabilities: ["can_support_friendcraft", "can_offer_accountability"]

**Eligible actor**:
- archetype: Devoted Guardian
- capability_tags: ["can_support_friendcraft", "can_hold_reflection_space"]

### Output

```json
{
  "actor_id": "player_ghi",
  "quest_id": "quest_friendcraft",
  "hard_eligible": true,
  "stewardship_eligible": false,
  "eligible_roles": ["accountable", "consulted"],
  "match_score": 0.78,
  "match_reasons": [
    "archetype_match",
    "has_support_friendcraft_capability",
    "domain_organizing_fit"
  ]
}
```

**Interpretation**: Strong fit for join/consult; stewardship not primary (quest may already have steward or actor prefers support role).

---

## Example 4: Witness-Capable Actor for Public Reflection BAR

### Input

**BAR**:
- type: reflection (or appreciation, public)
- visibility: public
- status: open

**Eligible actors**: Those with can_witness, or archetypes suited to informed role (Still Point, Truth Seer).

### Output (one responder)

```json
{
  "actor_id": "player_jkl",
  "actor_type": "player",
  "match_score": 0.72,
  "match_reasons": [
    "has_witness_capability",
    "archetype_still_point_grounding"
  ],
  "suggested_response": "witness"
}
```

---

## Example 5: Agent Matching (Librarian for Help Request)

### Input

**BAR**:
- type: help_request
- help_type: information
- parentId: quest_doc (doc quest)

**Agent profile**:
- type: LibrarianAgent
- capabilities: ["can_consult", "can_provide_information"]
- domain_specialization: ["docs", "library"]

### Output

```json
{
  "actor_id": "agent_librarian_1",
  "actor_type": "agent",
  "match_score": 0.88,
  "match_reasons": [
    "agent_librarian_info_fit",
    "domain_doc_quest_alignment"
  ],
  "suggested_response": "consult"
}
```
