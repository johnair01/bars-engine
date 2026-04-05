# Archetype Agent Example

## Example Agent Configuration

```json
{
  "actor_id": "agent-devoted-guardian-001",
  "actor_type": "agent",
  "agent_kind": "archetype_agent",
  "archetype": "devoted-guardian",
  "display_name": "Devoted Guardian",
  "campaign_ids": ["bruised-banana"],
  "capability_tags": ["support", "nurture", "follow_up"],
  "visibility": "campaign_visible",
  "status": "active"
}
```

---

## Example Rule Evaluation

**Signal**: Player has not completed or updated quest in 5 days.

**Rule**:
```
IF player has stalled on quest for N days (N >= 5)
THEN Devoted Guardian agent proposes support or clean-up quest
```

**Output**:
```json
{
  "action_type": "create_quest_suggestion",
  "target_type": "quest",
  "target_id": "quest-stuck-xyz",
  "payload": {
    "move_type": "clean_up",
    "title": "Check in on your energy",
    "description": "A brief reflection before continuing.",
    "rationale": "Quest has been inactive for 5 days; Devoted Guardian suggests clean-up."
  }
}
```

---

## Example BAR Evaluation

**BAR**: High-charge charge_capture BAR, no linked quest.

**Rule**:
```
IF high-charge BAR exists AND no linked quest exists
THEN Danger Walker agent proposes wake-up quest
```

**evaluateAgentsForBar(barId)** returns:
```json
{
  "agents": [
    {
      "agent_id": "agent-danger-walker-001",
      "archetype": "danger-walker",
      "proposed_action_type": "create_quest_suggestion",
      "rationale": "Unresolved charge; exploration suggested"
    }
  ]
}
```

---

## Example Campaign Evaluation

**Campaign**: No visible momentum for 7 days.

**Rule**:
```
IF campaign has no visible momentum for N days (N >= 5)
THEN Decisive Storm agent proposes activation event or direct-action quest
```

**evaluateAgentsForCampaign(campaignId)** returns:
```json
{
  "agents": [
    {
      "agent_id": "agent-decisive-storm-001",
      "archetype": "decisive-storm",
      "proposed_action_type": "suggest_event_creation",
      "rationale": "Campaign stagnant; activation proposed"
    }
  ]
}
```

---

## Example Visibility

When Truth Seer creates a pattern summary BAR:

```
Truth Seer surfaced a pattern from recent BARs
```

User sees the agent name and archetype, making the action legible.
