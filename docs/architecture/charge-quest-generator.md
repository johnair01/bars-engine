# Charge → Quest Generator v0

## Overview

The Charge → Quest Generator converts charge capture BARs into structured quest opportunities. It analyzes a charge BAR and proposes possible quests aligned with the four transformation moves: Wake Up, Clean Up, Grow Up, Show Up.

**Core principle**: Charge is raw narrative energy. The generator converts that energy into possible next moves. The engine does not force action; it proposes possible transformations.

**Metaphor**: A wise guide offering next steps — not a productivity planner. The system's role is to say: *Here are a few meaningful ways this energy could move.*

---

## Transformation Move Model

All generated quests map to one of four core moves. Each move corresponds to a different way of metabolizing charge.

### Wake Up

| Aspect | Value |
|--------|-------|
| Purpose | Increase awareness or understanding |
| Typical outputs | Research quests, learning quests, conversation quests, mapping quests |
| Example | Charge: "I'm frustrated about housing costs" → Quest: "Learn how housing policy works in your city" |

### Clean Up

| Aspect | Value |
|--------|-------|
| Purpose | Process emotional friction or relational tension |
| Typical outputs | Reflection quests, repair conversations, shadow work, 3-2-1 processes, boundary clarification |
| Example | Charge: "I'm angry at a colleague" → Quest: "Run a 3-2-1 reflection on the colleague conflict" |

### Grow Up

| Aspect | Value |
|--------|-------|
| Purpose | Develop capacity or skill |
| Typical outputs | Skill practice, courage experiments, training quests, capability development |
| Example | Charge: "I wish I could speak up more in meetings" → Quest: "Practice one courageous statement in your next meeting" |

### Show Up

| Aspect | Value |
|--------|-------|
| Purpose | Take visible action |
| Typical outputs | Event quests, collaboration quests, direct action, campaign participation |
| Example | Charge: "The park near my house is neglected" → Quest: "Organize a small cleanup gathering" |

---

## Generator Inputs

The engine analyzes a charge BAR. Input schema (from CustomBar + parsed inputs):

```ts
interface ChargeBarInput {
  bar_id: string
  summary_text: string
  emotion_channel?: 'anger' | 'joy' | 'sadness' | 'fear' | 'neutrality'
  intensity?: 1 | 2 | 3 | 4 | 5
  context_note?: string
  author_actor_id: string
}
```

### Analysis Signals

| Signal | Source | Use |
|--------|--------|-----|
| emotion_channel | Charge BAR inputs | Bias move type |
| intensity | Charge BAR inputs | Prioritization |
| topic keywords | summary_text | Template selection |
| actor nation | Player.nationId | Nation influence |
| actor archetype | Player.playbookId | Archetype framing |
| actor capability profile | Eligibility engine | Suitability |
| campaign context | campaignRef, InstanceMembership | Campaign emergence |

---

## Nation Influence

Emotional channels and nation element may bias transformation suggestions. Bias influences but does not enforce.

| Nation | Element | Typical Bias |
|--------|---------|--------------|
| Argyra | Metal | Wake Up (clarity, investigation) |
| Pyrakanth | Fire | Show Up (action, courage) |
| Lamenth | Water | Clean Up (emotional processing) |
| Meridia | Earth | Grow Up (grounding, capacity) |
| Virelune | Wood | Show Up or Grow Up (connection, growth) |

---

## Archetype Influence

Archetypes modify quest expression, not quest category.

| Archetype | Example framing |
|-----------|-----------------|
| Joyful Connector | Show up: invite people into a conversation |
| Bold Heart | Grow up: take a courageous action |
| Truth Seer | Wake up: investigate deeper truth |
| Devoted Guardian | Clean up: support healing or repair |

---

## Quest Template Integration

Generated quests use the Quest Template Library. The generator fills template parameters rather than writing entirely free-form quests.

**Template examples**:
- `research_exploration`
- `conversation_invitation`
- `reflection_process`
- `skill_practice`
- `event_hosting`
- `collaboration_invitation`

---

## Quest Generation Output

```ts
interface QuestSuggestion {
  move_type: 'wake_up' | 'clean_up' | 'grow_up' | 'show_up'
  quest_title: string
  quest_summary: string
  template_id?: string
  confidence?: number
  rationale?: string
}

interface ChargeQuestGeneratorResult {
  bar_id: string
  quest_suggestions: QuestSuggestion[]
}
```

**Output rules**: Typically 3–4 quests. At least one per move type when charge supports it. Confidence 0–1 for ranking.

---

## Quest Creation Flow

After suggestions appear, user may choose:

| Choice | Action |
|--------|--------|
| Create quest | Create CustomBar (quest) with sourceBarId = charge BAR |
| Reflect first | Launch 3-2-1 from charge |
| Save for later | No action; suggestions stored or regenerated |
| Ignore | No action |

**Linking**: Generated quests set `CustomBar.sourceBarId` to the charge BAR. Enables narrative tracing.

---

## Campaign Emergence

If multiple BARs relate to the same issue (housing, climate, community food), the system may suggest campaign creation. Campaign suggestions remain optional. Not in v0 scope; future extension.

---

## Agent Assistance

Agents may assist in quest generation:
- Research assistant
- Reflection guide
- Strategy advisor
- Community organizer

Agents propose quests but do not automatically create them. User consent required.

---

## Integration Points

| System | Integration |
|--------|-------------|
| Charge Capture UX | Input: charge BAR |
| BAR system | CustomBar, sourceBarId |
| Quest Template Library | Template selection, parameter fill |
| Nation profiles | Nation → move bias |
| Archetype overlays | Archetype → quest framing |
| Transformation Move Registry | WcgsStage, move categories |
| Actor Capability + Quest Eligibility | Actor context, suitability |
| BAR → Quest Generation Engine | May share interpretation, emotional alchemy |

---

## Constraints (v0)

- Generate 3–4 quests
- Map to four move types
- Use quest templates
- Link quests to BAR (sourceBarId)
- Respect actor context (nation, archetype)

**Avoid**: Fully open-ended quest writing, opaque LLM generation, complex ML scoring.

**Favor**: Template-based generation, explainable suggestions, deterministic logic where possible.

---

## Future: Charge Pattern Recognition Engine v0

Detects patterns (e.g. multiple people capturing similar charge) and suggests: shared quests, campaign formation, collective events.
