# BAR → Quest Generation Engine v0

## Purpose

Convert BARs into structured, reviewable quest opportunities. Player intention, inspiration, and field signals become actionable quests inside the campaign. The engine makes inspiration legible enough to become coordinated action.

---

## Part 1: BAR Eligibility Model

### Required BAR Inputs (CustomBar)

| Field | Purpose |
|-------|---------|
| bar_id | CustomBar id |
| creatorId | player_id |
| campaignRef | campaign_id |
| title | BAR title |
| description | content |
| allyshipDomain | intended_impact_domain (GATHERING_RESOURCES, DIRECT_ACTION, RAISE_AWARENESS, SKILLFUL_ORGANIZING) |
| type | vibe, insight, story |
| status | active, archived, etc. |

### Eligibility Requirements

- `status` = active
- `title` and `description` present
- `allyshipDomain` present (or derivable from context)
- BAR not already converted to quest (unless repeat allowed)
- Campaign phase allows new quest intake

---

## Part 2: BAR Interpretation Layer

Derives from BAR:

- quest intent
- relevant domain
- likely quest type
- emotional context tags
- potential scope
- urgency / timing signal
- review confidence

### Output Shape

```ts
interface BarInterpretation {
  bar_id: string
  quest_generation_candidate: boolean
  domain: string
  quest_type: 'resource' | 'coordination' | 'awareness' | 'action' | 'reflection'
  source_context_tags: string[]
  desired_outcome_tags: string[]
  suggested_title: string
  suggested_prompt: string
  confidence_score: number
  review_notes: string[]
}
```

---

## Part 3: Pipeline Stages

| Stage | Action |
|-------|--------|
| 1. Intake | Receive BAR creation event or explicit request |
| 2. Eligibility | Validate BAR meets requirements |
| 3. Interpretation | Convert BAR to quest-generation proposal |
| 4. Emotional Alchemy | Call canonical grammar service |
| 5. Proposal Construction | Build structured quest proposal |
| 6. Admin Review | Approve / reject / defer / edit |
| 7. Publication | Publish to campaign, optionally Twine IR |

---

## Part 4: Quest Proposal Schema

```ts
interface QuestProposal {
  proposal_id: string
  bar_id: string
  campaign_id: string
  player_id: string
  title: string
  description: string
  domain: string
  quest_type: string
  completion_conditions: string[]
  emitted_events: string[]
  emotional_alchemy: {
    status: 'resolved' | 'unresolved'
    move_id: string | null
    move_name: string | null
    prompt: string | null
    completion_reflection: string | null
  }
  review_status: 'pending' | 'approved' | 'rejected' | 'deferred'
  confidence_score: number
  created_at: string
}
```

---

## Part 5: Emotional Alchemy Grammar Integration

### Request

```ts
{
  player_id: string
  campaign_id: string
  quest_template_id: 'bar_generated'
  source_context_tags: string[]
  desired_outcome_tags: string[]
  campaign_phase: string
  player_context: {
    nation: string
    archetype: string
    developmental_lens: string
    intended_impact_domain: string
  }
}
```

### Response

```ts
{
  move_id: string
  move_name: string
  state_transition: { from: string[]; to: string[] }
  player_facing_copy: {
    prompt: string
    short_label: string
    completion_reflection: string
  }
  admin_metadata: { grammar_version: string; confidence: number; notes: string[] }
}
```

### Failure Behavior

- Proposal still created
- `emotional_alchemy.status` = unresolved
- Logged for admin review
- Quest can be edited or approved manually

---

## Part 6: Quest Type Templates

| Type | Examples |
|------|----------|
| **resource** | contribute to residency, surface job leads, offer material support |
| **coordination** | connect two players, offer a skill, schedule micro-collaboration |
| **awareness** | share reflection, invite aligned player, post about campaign |
| **action** | test feature, run session, complete specific challenge |
| **reflection** | clarify intention, refine signal, deepen story thread |

---

## Part 7: Admin Review Surface

- List: proposal title, BAR source, domain, confidence, review status, emotional_alchemy status
- Detail: approve, reject, defer, edit title/description/completion_conditions
- Publish to campaign

---

## Part 8: Publication Targets

1. **Campaign Quest System** — Quest becomes active CustomBar in campaign
2. **Twine Authoring IR** — Optional: generate IR node or quest emission block for `.twee` flow

---

## Part 9: Campaign Phase Awareness

v0 supports `phase_1_opening_momentum`.

Phase 1 biases:

- gather_resources
- raise_awareness
- lightweight coordination
- early direct action

---

## Part 10: Data Model Recommendations

| Model | Purpose |
|-------|---------|
| CustomBar | Existing; BARs and quests |
| QuestProposal | New; proposals before publication |
| EmotionalAlchemyResolutionLog | Optional; resolution audit |

---

## Implementation Priority

1. BAR eligibility checker
2. BAR interpretation layer
3. Emotional grammar integration
4. Quest proposal schema
5. Admin review API + UI
6. Quest publication pipeline
7. Optional Twine IR bridge
