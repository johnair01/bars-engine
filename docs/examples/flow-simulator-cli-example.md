# Flow Simulator CLI Example

## Running Bruised Banana Onboarding Fixtures

```bash
# Simulate one flow
bars simulate fixtures/onboarding/bruised-banana/campaign_intro.json

# Simulate all Bruised Banana onboarding fixtures
bars simulate fixtures/onboarding/bruised-banana/*

# Verbose output (traversal log)
bars simulate fixtures/onboarding/bruised-banana/campaign_intro.json --verbose

# JSON output for CI
bars simulate fixtures/onboarding/bruised-banana/campaign_intro.json --json
```

## CLI Pass Output (Verbose)

```
Simulating flow: bb_campaign_intro_v0
  [1] intro_1 (introduction) -> prompt_1
  [2] prompt_1 (prompt) -> action_1
  [3] action_1 (action) [choose] -> completion_1
  [4] completion_1 (completion) [terminal]
Events: orientation_viewed, prompt_viewed, choice_selected, quest_completed
Result: PASS
```

## CLI Fail Output (Verbose)

```
Simulating flow: bb_identity_selection_broken
  [1] intro_1 (introduction) -> prompt_1
  [2] prompt_1 (prompt) -> bar_validation_1
ERROR: BAR_validation_before_creation — bar_validation_1 reached before bar_created
Result: FAIL
```

## JSON Output Example

```json
{
  "status": "pass",
  "flow_id": "bb_campaign_intro_v0",
  "visited_nodes": ["intro_1", "prompt_1", "action_1", "completion_1"],
  "events_emitted": ["orientation_viewed", "prompt_viewed", "choice_selected", "quest_completed"],
  "state_changes": [],
  "warnings": [],
  "errors": [],
  "completion_reached": true
}
```

## Error Reporting Example

```json
{
  "status": "fail",
  "flow_id": "bb_intended_impact_bar_v0",
  "visited_nodes": ["intro_1", "prompt_1", "bar_capture_1", "bar_validation_1"],
  "events_emitted": ["orientation_viewed", "prompt_viewed", "bar_created"],
  "state_changes": [{"bar_count": 0, "bar_count": 1}],
  "warnings": [],
  "errors": [
    "required_capability_missing: action create_BAR requires [create] but actor has [observe]",
    "invalid_transition: next_node_id bar_validation_1 references node with missing BAR_exists condition"
  ],
  "completion_reached": false
}
```

## Actor Context Example

```bash
bars simulate fixtures/onboarding/bruised-banana/identity_selection.json --actor human_participant
```

With `human_participant` capabilities: `["observe", "choose", "create", "continue"]`.
