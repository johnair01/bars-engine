# Archetype Agent Ecology v0

## Purpose

Define a first-generation archetype-based AI agent subsystem that participates in Bars-engine as a **world metabolism layer**. These agents are not generic copilots or human-like AI users. They are **archetypal ecological actors** that keep the world moving when humans stall, drift, or need invitation.

Agents express archetypal motion patterns derived from canonical archetypes and trigram correspondences. They keep the world active between human actions, generate lightweight social and quest momentum, and create a felt sense of a living world with distributed cognition.

**Design goal**: AI expressing archetypal motion within the world — closer to spirits of the system, patterned ecological currents, and distributed organs of world cognition than to generic assistants. That distinction is load-bearing.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), rule-based and inspectable.

---

## Design Principles

| Principle | Description |
|-----------|-------------|
| World forces, not human simulacra | Agents embody stable archetypal patterns of motion; they do not simulate full human psychology |
| Patterned participants | Observe system signals → interpret through archetypal lens → emit bounded actions |
| Rule-based v0 | Inspectable, deterministic where possible; avoid full open-ended LLM orchestration as core logic |
| Bounded action types | Only allowed action types; no unrestricted autonomous world editing |

---

## Agent Purpose

The first version exists to support:

- Make the world feel alive
- Create structured suggestions when humans are inactive
- Propose quests from emerging tensions / BARs
- Support campaign momentum
- Surface collaboration opportunities
- Generate patterned responses without requiring a dense human population

Especially important for: single-player mode, sparse multiplayer mode, early-world ignition, onboarding campaigns, low-traffic campaigns, event production support.

---

## Part 1: Agent Object Model

### AgentActor Schema

Compatible with the Actor Model (`docs/architecture/actor-model.md`). Agents are actors with `actor_type: 'agent'`.

```ts
interface AgentActor {
  actor_id: string
  actor_type: 'agent'
  agent_kind: 'archetype_agent'
  archetype: ArchetypeKey
  display_name: string
  campaign_ids: string[]
  capability_tags: string[]
  visibility: 'system' | 'campaign_visible' | 'public'
  status: 'active' | 'paused' | 'archived'
}
```

### Archetype Keys

Use canonical playbook-based keys (`docs/architecture/archetype-key-reconciliation.md`):

| Archetype | Trigram | Slug |
|-----------|---------|------|
| Bold Heart | Heaven | bold-heart |
| Danger Walker | Water | danger-walker |
| Truth Seer | Fire | truth-seer |
| Still Point | Mountain | still-point |
| Subtle Influence | Wind | subtle-influence |
| Devoted Guardian | Earth | devoted-guardian |
| Decisive Storm | Thunder | decisive-storm |
| Joyful Connector | Lake | joyful-connector |

---

## Part 2: Archetype Motion Model

Action tendencies, not personality blurbs.

| Archetype | Core Motion | Typical Outputs |
|-----------|-------------|------------------|
| **Bold Heart** | initiate, take first step, claim responsibility, begin action | propose new quest, take dormant quest, suggest first move, create direct action invitation |
| **Danger Walker** | explore uncertainty, investigate ambiguity, move toward risk with caution | create investigation/wake-up quest, surface unknowns, propose exploratory conversation, follow unresolved charge |
| **Truth Seer** | reveal patterns, clarify meaning, illuminate hidden truths | synthesize BAR patterns, generate reflection BAR, propose meaning-making quest, create awareness-oriented prompts |
| **Still Point** | stabilize, pause, ground, reduce chaotic motion | suggest pause/clean-up quest, recommend reflection before action, identify overload, hold unresolved tension without escalating |
| **Subtle Influence** | shape slowly, distribute influence, nudge culture | amplify resonant BARs, quietly recommend related content, surface weak signals, reinforce emerging norms |
| **Devoted Guardian** | nurture, support, hold continuity, tend fragility | offer support quests, detect disengagement or burnout risk, encourage follow-up, protect campaign health |
| **Decisive Storm** | activate, catalyze movement, intensify stalled momentum | propose event/sprint, trigger direct action prompt, revive dormant campaign, escalate from planning to doing |
| **Joyful Connector** | connect, bond, celebrate, invite shared energy | suggest collaborations, create appreciation BARs, invite actors into quests/events, celebrate completions |

---

## Part 3: Agent Signal Inputs

Bounded set of world signals agents observe:

| Signal | Source | Use |
|--------|--------|-----|
| newly created BARs | CustomBar | BAR response, quest suggestion |
| charge BARs | CustomBar.type = 'charge_capture' | Danger Walker wake-up, Truth Seer synthesis |
| dormant quests | CustomBar + PlayerQuest | Bold Heart take, Decisive Storm revive |
| unresolved help request BARs | CustomBar.type = 'help_request' | Devoted Guardian support |
| campaign inactivity | Instance, EventCampaign | Decisive Storm activation, Devoted Guardian check-in |
| event production milestones | EventCampaign, EventArtifact | Joyful Connector invites, Truth Seer post-event |
| player inactivity | PlayerQuest, last activity | Devoted Guardian support, Still Point pause |
| role vacancies in quest threads | ThreadQuest, RACI | Joyful Connector invite, Bold Heart fill |
| quest completions | PlayerQuest.completedAt | Joyful Connector appreciation |
| event completions | EventArtifact.status | Truth Seer summary, Devoted Guardian follow-up |
| public/campaign-visible appreciation gaps | CustomBar, BarResponse | Joyful Connector appreciation BAR |

---

## Part 4: Agent Action Types (v0 Bounded Set)

| Action Type | Description |
|-------------|-------------|
| create_quest_suggestion | Propose new quest from BAR or tension |
| create_bar_suggestion | Propose BAR (reflection, appreciation, help request) |
| create_appreciation_bar | Create appreciation BAR for public achievement |
| respond_to_bar | Respond to existing BAR (witness, offer_help, curious) |
| suggest_event_creation | Propose event from campaign |
| suggest_campaign_next_step | Propose next milestone or activation |
| invite_actor_into_role | Suggest actor for RACI role in quest |
| surface_collaboration_suggestion | Recommend collaboration between actors |
| synthesize_pattern_summary | Create pattern summary from BARs/quests |

---

## Part 5: Action Generation Rules (Rule-Based v0)

Example rules (inspectable, deterministic where possible):

```
IF high-charge BAR exists AND no linked quest exists
THEN Danger Walker agent proposes wake-up quest
```

```
IF player has stalled on quest for N days
THEN Devoted Guardian agent proposes support or clean-up quest
```

```
IF campaign has no visible momentum for N days
THEN Decisive Storm agent proposes activation event or direct-action quest
```

```
IF quest completed AND public/campaign-visible
THEN Joyful Connector creates appreciation BAR
```

```
IF unresolved help_request BAR exists
THEN Devoted Guardian responds with offer_help or support suggestion
```

---

## Part 6: Agent Participation Surfaces

| Surface | Description |
|---------|-------------|
| quest suggester | Propose quests from BARs, tensions, campaign state |
| BAR respondent | Respond to BARs (witness, offer_help, curious) |
| campaign steward | Suggest campaign next steps, activation |
| event-production assistant | Support event production milestones |
| witness / synthesizer | Create pattern summaries, reflection BARs |

Agents do not appear as unrestricted chatbots. Participation is structured and archetypally legible.

---

## Part 7: Agent → BAR Interaction

- Truth Seer: create reflection BAR from campaign patterns
- Joyful Connector: create appreciation BARs on public achievements
- Devoted Guardian: respond to burnout-adjacent BARs with support prompts
- Danger Walker: respond to unresolved charge BARs with exploration suggestions

All interactions compatible with BAR visibility and privacy rules. Agents must not expose private reflective source material.

---

## Part 8: Agent → Quest Interaction

- Propose new quest from BAR
- Recommend next move for stuck quest
- Fill role (Responsible/Consulted/Informed) if allowed
- Suggest event conversion for quest cluster

Uses same role eligibility logic as human actors where possible.

---

## Part 9: Agent → Campaign Interaction

- Devoted Guardian: monitor stagnation, suggest support interventions
- Decisive Storm: propose activation pushes
- Truth Seer: summarize campaign learning
- Joyful Connector: encourage collaboration invitations
- Subtle Influence: surface emerging themes

Remains suggestions or bounded actions unless explicitly permitted.

---

## Part 10: Agent → Event Interaction

Integrates with Event Campaign Engine and Event Artifact System:

- Joyful Connector: suggest invite waves
- Devoted Guardian: suggest attendee follow-up
- Decisive Storm: propose promotional pushes before event deadline
- Truth Seer: create post-event summary BAR
- Danger Walker: identify unresolved tensions emerging from event

---

## Part 11: Agent Visibility Model

| Option | Description |
|--------|-------------|
| explicit named agent in feed | "Truth Seer surfaced a pattern from recent BARs" |
| campaign-visible system actor | Visible to campaign members |
| subtle recommendation layer | Suggestion without named agent |
| hidden backend suggestion engine | No user-facing agent presence |

v0 allows explicit agent presence where it adds world aliveness. Users can recognize archetype agent when useful.

---

## Part 12: Agent Governance and Limits

| Constraint | Rule |
|------------|------|
| Private BAR content | May not expose |
| Autonomous publish | May not publish public content without rule-based permission |
| Content volume | Throttling and limits |
| Nested interactions | May not generate uncontrolled nested interactions |
| Schema/role alteration | May not alter canonical schemas or roles outside allowed services |
| Impersonation | May not impersonate humans |

### Do Not Build (v0)

- Unrestricted social chat agents
- Fully autonomous human simulacra
- Uncontrolled quest spam
- Opaque agent decision-making

### Favor

- Archetypal consistency
- Bounded action types
- Simple observable rules
- World aliveness over agent realism

---

## Part 13: Encounter Geometry Extension Points

Future-compatible with Cube / Encounter Geometry (`docs/architecture/transformation-encounter-geometry.md`). v0 does not implement full geometry integration. Extension points for future agent bias toward encounter types:

- truth | dare | hide | seek | interior | exterior

---

## Part 14: Minimum Viable Agent Rollout Order

1. Devoted Guardian
2. Joyful Connector
3. Danger Walker
4. Truth Seer
5. Decisive Storm
6. Still Point
7. Bold Heart
8. Subtle Influence

---

## Integration Points

| System | Integration |
|--------|-------------|
| Actor Model | AgentActor as actor_type: 'agent' |
| BAR System | create_bar_suggestion, respond_to_bar, create_appreciation_bar |
| Charge Capture | charge BARs as signal; Danger Walker, Truth Seer responses |
| Charge → Quest Generator | create_quest_suggestion |
| Quest System | propose quest, recommend move, fill role |
| Campaign System | suggest_campaign_next_step |
| Event Campaign Engine | suggest_event_creation, event production support |
| Actor Capability + Quest Eligibility | Same eligibility logic for agent actions |
| Quest Stewardship + Role Resolution | RACI role filling |
| Transformation Move Registry | move_type alignment for suggestions |
| Encounter Geometry | Future: bias toward encounter types |

---

## Implementation Artifacts (Target Paths)

```
src/features/agents/
src/features/agents/archetypes/
src/features/agents/services/
src/features/agents/api/
src/features/agents/types/
src/features/agents/__tests__/
```

Adapt to project structure while preserving modular, API-first design.

---

## Testing Requirements

- Each archetype has bounded rule-based behaviors
- Agents observe BAR/quest/campaign signals
- Agents create valid suggested outputs
- Private data is not leaked
- Agents remain within throttling limits
- Agent actions are traceable and inspectable
- Multiple agents act without feedback spam loops
- Single-player scenarios remain coherent

---

## Expected Outcome

After implementation, Bars-engine supports a lightweight ecology of archetype agents that keep the world moving, respond to charge and stagnation, generate structured invitations and quests, maintain campaign aliveness, and support players without replacing them. The world feels less like a static app waiting for users and more like a living ecology with patterned forces at work.

---

## Companion Spec (Future)

**Charge + Encounter Geometry → Quest Synthesis Engine v0** would define how BAR charge, archetype motion, cube encounter geometry, move type, and domain combine into automatically generated quests with an actual transformation grammar.

---

## References

- [actor-model.md](actor-model.md)
- [system-bar-api.md](system-bar-api.md)
- [charge-capture-api.md](charge-capture-api.md)
- [event-campaign-api.md](event-campaign-api.md)
- [actor-capability-quest-eligibility-engine.md](actor-capability-quest-eligibility-engine.md)
- [transformation-encounter-geometry.md](transformation-encounter-geometry.md)
- [archetype-key-reconciliation.md](archetype-key-reconciliation.md)
- [archetype-agent-api.md](archetype-agent-api.md)
