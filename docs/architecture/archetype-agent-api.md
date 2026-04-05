# Archetype Agent API — Service Contracts v0

## Overview

Archetype agents participate in Bars-engine through service-layer contracts. Implementation may use Server Actions or HTTP endpoints. Agent behavior is not trapped in the UI.

**Reference**: [archetype-agent-ecology.md](archetype-agent-ecology.md)

---

## Agent Management

### 1. List Agents

**Contract**: `listAgents(filters?: ListAgentsFilters) => Promise<{ success: true; agents: AgentActor[] } | { error: string }>`

**Filters**:
```ts
interface ListAgentsFilters {
  status?: 'active' | 'paused' | 'archived'
  archetype?: string
  campaignId?: string
}
```

**Behavior**: Returns active agents. Filter by status, archetype, campaign membership.

**Route**: Server Action `listAgents` or `GET /api/agents`

---

### 2. Get Agent

**Contract**: `getAgent(id: string) => Promise<{ success: true; agent: AgentActor } | { error: string }>`

**Behavior**: Returns agent metadata by id.

**Route**: Server Action `getAgent` or `GET /api/agents/:id`

---

### 3. List Agent Actions

**Contract**: `listAgentActions(agentId: string, filters?: ListActionsFilters) => Promise<{ success: true; actions: AgentAction[] } | { error: string }>`

**Filters**:
```ts
interface ListActionsFilters {
  limit?: number
  since?: Date
  actionType?: string
}
```

**Behavior**: Returns recent actions by agent. Supports audit and inspectability.

**Route**: Server Action `listAgentActions` or `GET /api/agents/:id/actions`

---

### 4. Pause Agent

**Contract**: `pauseAgent(agentId: string) => Promise<{ success: true } | { error: string }>`

**Behavior**: Sets agent status to `paused`. Agent does not evaluate or act while paused.

**Route**: Server Action `pauseAgent` or `POST /api/agents/:id/pause`

---

### 5. Resume Agent

**Contract**: `resumeAgent(agentId: string) => Promise<{ success: true } | { error: string }>`

**Behavior**: Sets agent status to `active`.

**Route**: Server Action `resumeAgent` or `POST /api/agents/:id/resume`

---

## Evaluation Triggers

### 6. Run Archetype Agent Evaluation Cycle

**Contract**: `runArchetypeAgentEvaluation(input: RunEvaluationInput) => Promise<{ success: true; actions: AgentAction[] } | { error: string }>`

**Input**:
```ts
interface RunEvaluationInput {
  agent_id: string
  campaign_id?: string
}
```

**Behavior**: Triggers evaluation cycle for specified agent. Agent observes signals, applies rules, emits bounded actions. Returns actions produced (suggestions, not necessarily executed).

**Route**: Server Action `runArchetypeAgentEvaluation` or `POST /api/agents/archetype/run`

---

### 7. Evaluate BAR

**Contract**: `evaluateAgentsForBar(barId: string) => Promise<{ success: true; agents: AgentMatch[] } | { error: string }>`

**Response**:
```ts
interface AgentMatch {
  agent_id: string
  archetype: string
  proposed_action_type: string
  rationale?: string
}
```

**Behavior**: Returns which agents should respond to the BAR based on BAR type, charge level, archetype motion rules.

**Route**: Server Action `evaluateAgentsForBar` or `POST /api/agents/evaluate-bar`

---

### 8. Evaluate Campaign

**Contract**: `evaluateAgentsForCampaign(campaignId: string) => Promise<{ success: true; agents: AgentMatch[] } | { error: string }>`

**Behavior**: Returns which agents should act on campaign state (inactivity, milestones, stagnation).

**Route**: Server Action `evaluateAgentsForCampaign` or `POST /api/agents/evaluate-campaign`

---

### 9. Evaluate Quest

**Contract**: `evaluateAgentsForQuest(questId: string) => Promise<{ success: true; agents: AgentMatch[] } | { error: string }>`

**Behavior**: Returns which agents should act on quest state (dormant, stuck, role vacancy).

**Route**: Server Action `evaluateAgentsForQuest` or `POST /api/agents/evaluate-quest`

---

## Data Types

### AgentActor

```ts
interface AgentActor {
  actor_id: string
  actor_type: 'agent'
  agent_kind: 'archetype_agent'
  archetype: string  // bold-heart | danger-walker | truth-seer | still-point | subtle-influence | devoted-guardian | decisive-storm | joyful-connector
  display_name: string
  campaign_ids: string[]
  capability_tags: string[]
  visibility: 'system' | 'campaign_visible' | 'public'
  status: 'active' | 'paused' | 'archived'
}
```

### AgentAction

```ts
interface AgentAction {
  id: string
  agent_id: string
  action_type: string  // create_quest_suggestion | create_bar_suggestion | create_appreciation_bar | respond_to_bar | etc.
  target_type?: string  // bar | quest | campaign | event
  target_id?: string
  payload?: Record<string, unknown>
  status: 'proposed' | 'executed' | 'rejected'
  created_at: Date
}
```

---

## Route vs Action Decision

| Surface | Use |
|---------|-----|
| Dashboard, admin UI, React forms | Server Action |
| Webhooks, external cron, CLI | Route Handler (`/api/agents/*`) |

---

## Throttling and Limits

| Limit | v0 Value |
|-------|----------|
| Actions per agent per hour | 10 |
| Actions per evaluation cycle | 3 |
| BAR responses per agent per day | 20 |
| Quest suggestions per agent per day | 5 |

---

## References

- [archetype-agent-ecology.md](archetype-agent-ecology.md)
- [actor-model.md](actor-model.md)
- [event-campaign-api.md](event-campaign-api.md)
