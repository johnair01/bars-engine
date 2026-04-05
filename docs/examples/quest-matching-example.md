# Quest Matching — Example Workflows

## Example 1: Quest with Open Stewardship Slot

### Scenario

Quest has no Responsible (no take_quest response). Engine surfaces actors who are stewardship-eligible and high match.

### Query

`getEligibleActors(questId: "quest_123", { roleFilter: ["responsible"] })`

### Quest

- title: "Run weekly check-in for campaign volunteers"
- moveType: showUp
- allyshipDomain: SKILLFUL_ORGANIZING
- campaignRef: bruised-banana
- preferred_nations: ["Meridia", "Virelune"]
- preferred_archetypes: ["Devoted Guardian", "Joyful Connector"]

### Response

```json
{
  "success": true,
  "actors": [
    {
      "actor_id": "player_a",
      "actor_type": "player",
      "eligibility": {
        "hard_eligible": true,
        "stewardship_eligible": true,
        "eligible_roles": ["responsible"],
        "match_score": 0.89,
        "match_reasons": ["nation_meridia_stewardship", "archetype_devoted_guardian", "role_slot_open"]
      }
    },
    {
      "actor_id": "player_b",
      "actor_type": "player",
      "eligibility": {
        "hard_eligible": true,
        "stewardship_eligible": true,
        "eligible_roles": ["responsible"],
        "match_score": 0.76,
        "match_reasons": ["archetype_joyful_connector", "domain_organizing", "role_slot_open"]
      }
    }
  ],
  "open_roles": {
    "responsible": true,
    "accountable": true,
    "consulted": true,
    "informed": true
  }
}
```

---

## Example 2: Dashboard "Quests for You"

### Scenario

Player logs in. Dashboard calls `getRecommendedQuests(playerId)`.

### Query

`getRecommendedQuests(actorId: "player_xyz", { campaignRef: "bruised-banana", limit: 5 })`

### Player

- nation: Pyrakanth
- archetype: Bold Heart
- campaignDomainPreference: ["DIRECT_ACTION"]
- hasCompletedFirstQuest: true

### Response

```json
{
  "success": true,
  "quests": [
    {
      "quest": { "id": "q1", "title": "Lead courage experiment at next meetup", "moveType": "showUp", "allyshipDomain": "DIRECT_ACTION" },
      "match_score": 0.91,
      "match_reasons": ["nation_pyrakanth_courage", "archetype_bold_heart_initiation", "domain_preference_match"],
      "eligible_roles": ["responsible", "accountable"]
    },
    {
      "quest": { "id": "q2", "title": "Organize 3-person action pod", "moveType": "growUp", "allyshipDomain": "DIRECT_ACTION" },
      "match_score": 0.84,
      "match_reasons": ["domain_preference_match", "archetype_initiation_fit", "progression_engaged"],
      "eligible_roles": ["responsible", "accountable"]
    }
  ]
}
```

---

## Example 3: Hard Eligibility Blocked

### Scenario

Actor lacks campaign membership. Hard eligible = false.

### Query

`evaluateEligibility(actorId: "player_out", questId: "quest_campaign_only")`

### Quest

- campaignRef: bruised-banana
- required_campaign_membership: bruised-banana

### Actor

- campaign_ids: [] (not in bruised-banana)

### Response

```json
{
  "success": true,
  "actor_id": "player_out",
  "quest_id": "quest_campaign_only",
  "hard_eligible": false,
  "stewardship_eligible": false,
  "eligible_roles": [],
  "match_score": 0,
  "match_reasons": [],
  "blocking_reasons": ["campaign_membership_required"]
}
```

---

## Example 4: Role Availability Affects Recommendation

### Scenario

Quest has Responsible and Accountable filled. Engine recommends Consulted and Informed candidates.

### Query

`getEligibleActors(questId: "quest_full_steward", { roleFilter: ["consulted", "informed"] })`

### Response

```json
{
  "success": true,
  "actors": [
    {
      "actor_id": "player_consult",
      "eligibility": {
        "eligible_roles": ["consulted"],
        "match_score": 0.82,
        "match_reasons": ["has_consult_capability", "role_slot_consulted_open", "nation_argyra_clarity"]
      }
    }
  ],
  "open_roles": {
    "responsible": false,
    "accountable": false,
    "consulted": true,
    "informed": true
  }
}
```

---

## Example 5: BAR-Specific Matching (Quest Invitation)

### Scenario

quest_invitation BAR seeks join/accountability. Engine returns actors who are good candidates to respond with join.

### Query

`getEligibleResponders(barId: "bar_invite_1", { responseType: "join" })`

### BAR

- type: quest_invitation
- parentId: quest_456 (linked quest)
- campaignRef: bruised-banana

### Response

```json
{
  "success": true,
  "responders": [
    {
      "actor_id": "player_join1",
      "match_score": 0.86,
      "match_reasons": ["nation_quest_match", "has_accountability_capability", "campaign_member"],
      "suggested_response": "join"
    }
  ]
}
```
