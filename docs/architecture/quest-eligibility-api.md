# Quest Eligibility API — Service Contracts v0

## Overview

The eligibility engine exposes service boundaries that can be implemented as Next.js server actions or HTTP endpoints. Dashboard, agents, admin tools, and future mobile flows consume the same eligibility engine. Matching logic lives in the service layer.

---

## Service Boundaries

### 1. Get Eligible Quests for Actor

**Contract**: `getEligibleQuests(actorId: string, filters?: EligibleQuestsFilters) => Promise<EligibleQuestsResult>`

**Filters**:
```ts
interface EligibleQuestsFilters {
  campaignRef?: string
  allyshipDomain?: string | string[]
  roleType?: 'responsible' | 'accountable' | 'consulted' | 'informed'
  onboardingState?: 'pre_first_quest' | 'post_first_quest' | 'engaged'
  includeRecommendations?: boolean  // default true
  limit?: number
  offset?: number
}
```

**Response**:
```ts
interface EligibleQuestsResult {
  success: true
  visible: Array<{
    quest: CustomBar
    eligibility: EligibilityResult
  }>
  recommended?: Array<{
    quest: CustomBar
    eligibility: EligibilityResult
  }>
}
```

**HTTP**: `GET /api/actors/:id/eligible-quests?campaign=&domain=&role=&limit=`

---

### 2. Get Recommended Quests for Actor

**Contract**: `getRecommendedQuests(actorId: string, filters?: RecommendedQuestsFilters) => Promise<RecommendedQuestsResult>`

Returns top-ranked recommended quests. Subset of eligible; high match_score.

**Filters**:
```ts
interface RecommendedQuestsFilters {
  campaignRef?: string
  allyshipDomain?: string
  limit?: number  // default 5
}
```

**Response**:
```ts
interface RecommendedQuestsResult {
  success: true
  quests: Array<{
    quest: CustomBar
    match_score: number
    match_reasons: string[]
    eligible_roles: string[]
  }>
}
```

**HTTP**: `GET /api/actors/:id/recommended-quests?campaign=&limit=`

---

### 3. Get Eligible Actors for Quest

**Contract**: `getEligibleActors(questId: string, filters?: EligibleActorsFilters) => Promise<EligibleActorsResult>`

**Filters**:
```ts
interface EligibleActorsFilters {
  roleFilter?: ('responsible' | 'accountable' | 'consulted' | 'informed')[]
  includeAgents?: boolean
  limit?: number
  offset?: number
}
```

**Response**:
```ts
interface EligibleActorsResult {
  success: true
  actors: Array<{
    actor_id: string
    actor_type: 'player' | 'agent'
    eligibility: EligibilityResult
  }>
  open_roles: {
    responsible: boolean
    accountable: boolean
    consulted: boolean
    informed: boolean
  }
}
```

**HTTP**: `GET /api/quests/:id/eligible-actors?role=&includeAgents=`

---

### 4. Get Eligible Responders for BAR

**Contract**: `getEligibleResponders(barId: string, filters?: EligibleRespondersFilters) => Promise<EligibleRespondersResult>`

**Filters**:
```ts
interface EligibleRespondersFilters {
  responseType?: 'join' | 'take_quest' | 'consult' | 'witness'
  limit?: number
}
```

**Response**:
```ts
interface EligibleRespondersResult {
  success: true
  responders: Array<{
    actor_id: string
    actor_type: 'player' | 'agent'
    match_score: number
    match_reasons: string[]
    suggested_response: 'join' | 'take_quest' | 'consult' | 'witness'
  }>
}
```

**Examples**:
- help_request BAR → consult-capable actors, Argyra, Truth Seer
- quest_invitation BAR → join/accountability candidates, stewardship-eligible
- appreciation BAR (public) → witness-capable actors

**HTTP**: `GET /api/bars/:id/eligible-responders?responseType=`

---

### 5. Evaluate Actor–Quest Pair

**Contract**: `evaluateEligibility(actorId: string, questId: string) => Promise<EvaluateEligibilityResult>`

Explicit evaluation for a single actor/quest pair.

**Request**: No body; actor and quest in path or query.

**Response**:
```ts
interface EvaluateEligibilityResult {
  success: true
  actor_id: string
  quest_id: string
  hard_eligible: boolean
  stewardship_eligible: boolean
  eligible_roles: string[]
  match_score: number
  match_reasons: string[]
  blocking_reasons?: string[]  // when not hard_eligible
}
```

**HTTP**: `POST /api/eligibility/evaluate` with body:
```json
{
  "actor_id": "string",
  "quest_id": "string"
}
```

---

### 6. Get Actor Capabilities

**Contract**: `getActorCapabilities(actorId: string) => Promise<ActorCapabilityResult>`

**Response**:
```ts
interface ActorCapabilityResult {
  success: true
  actor_id: string
  actor_type: 'player' | 'agent'
  capabilities: ActorCapability[]
}
```

**HTTP**: `GET /api/actors/:id/capabilities`

---

### 7. Get Quest Requirements

**Contract**: `getQuestRequirements(questId: string) => Promise<QuestRequirementsResult>`

**Response**:
```ts
interface QuestRequirementsResult {
  success: true
  quest_id: string
  requirements: QuestRequirement
}
```

**HTTP**: `GET /api/quests/:id/requirements`

---

## Dashboard Integration

The dashboard consumes:

1. **getRecommendedQuests(actorId)** — "Quests for you"
2. **getEligibleQuests(actorId, { roleType: 'accountable' })** — "Ways you can help"
3. **getBarFeed** (existing) + **getEligibleResponders** — "BARs you may want to witness"
4. **getRecommendedQuests(actorId, { allyshipDomain })** — "Friendcraft opportunities"

Dashboard shows a few high-signal items. Eligibility engine drives surfacing; UI does not re-compute matching.

---

## Implementation Notes

- Prefer server actions in `src/actions/eligibility.ts` or `src/features/eligibility/` for Next.js consistency
- API routes in `src/app/api/` can wrap the same service functions
- All services accept `actorId`; resolve Player vs Agent by lookup
- Match scoring: deterministic, rule-based, 0–1 range
- Match reasons: enum or fixed set for inspectability
