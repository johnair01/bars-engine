# Quest Generation — User Prompt Template

Use this template when requesting a quest flow from the LLM.

---

## Template

```
Generate a quest flow using the defined schema. Return JSON only. No commentary.

Campaign: {campaign_id}

Quest theme: {theme}

Onboarding: {onboarding}

Actor capabilities: {capabilities}

Target outcome: {target_outcome}

Constraints: {constraints}
```

---

## Placeholders

| Placeholder | Example | Description |
|-------------|---------|-------------|
| campaign_id | bruised_banana_residency | Campaign context |
| theme | Nation selection for new players | Quest theme or purpose |
| onboarding | true | If true, apply onboarding constraints (max 6 nodes, max 1 branch) |
| capabilities | observe, create, continue | Actor permissions |
| target_outcome | Player chooses nation and reaches completion | Desired end state |
| constraints | Linear flow; no BAR validation | Additional constraints |

---

## Example

```
Generate a quest flow using the defined schema. Return JSON only. No commentary.

Campaign: bruised_banana_residency

Quest theme: Minimal orientation — introduce the Conclave and have the player choose a lens (understanding, connecting, or acting).

Onboarding: true

Actor capabilities: observe, create, continue

Target outcome: Player reaches completion after one choice.

Constraints: Linear flow. No BAR creation. 4 nodes. Copy under 30 words per node.
```

---

## Expected Response

The LLM returns valid JSON matching the output schema. The response is then:

1. Parsed (JSON.parse)
2. Structurally validated (schema + grammar)
3. Simulated (flow simulator)
4. Approved or rejected

If rejected, the errors are reported. Do not retry with the same prompt without addressing the validation failures.
