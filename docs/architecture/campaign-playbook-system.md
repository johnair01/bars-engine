# Campaign Playbook System v0

## Purpose

A Campaign Playbook is a generated and curated strategic document attached to every campaign (Instance) in Bars-engine. It serves as a living strategy guide, collaboration artifact, and exportable communications tool. Playbooks transform game artifacts (BARs, quests, events, comments, reflections) into human-readable strategic narrative.

**Design goals**:
- Convert gameplay into strategic narrative
- Help collaborators understand how to contribute
- Support fundraising and outreach
- Provide campaign transparency
- Reduce coordination overhead

**Practice**: Deftness Development — spec kit first, API-first (contract before UI).

---

## Core Concept

A Playbook answers three key questions:

| Question | Section(s) |
|----------|------------|
| What is happening in this campaign? | Origin, Vision, Timeline, Recent Updates |
| What should we do next? | Domain Strategy, Kotter Stages, Suggested Quests |
| How can collaborators participate? | People, Invitations, RACI Roles, Campaign Deck |

Each playbook functions as:
- Campaign orientation guide
- Strategic planning document
- Communications toolkit
- Narrative history

---

## Scope

Playbooks exist at the **Instance** (campaign) level.

```
Instance (campaign)
  └ Playbook
```

Example: Bruised Banana Residency Campaign (Instance) → Playbook

---

## Playbook Sections

### Core Narrative

| Section | Content |
|---------|---------|
| **Origin** | Synthesizes early BARs and founding context |
| **Vision** | Intended impact of the campaign |
| **People** | Key actors and roles |
| **Invitations** | Outreach messaging (onboarding, invites) |
| **Timeline** | Key milestones and events |

### Kotter Model Integration

Content maps into Kotter Change Model stages (1–8):

| Stage | Name | Artifact Sources |
|-------|------|------------------|
| 1 | Create Urgency | Issue BARs, charge BARs |
| 2 | Build Guiding Coalition | Invited actors, InstanceMembership |
| 3 | Form Strategic Vision | Campaign description, targetDescription |
| 4 | Enlist Volunteer Army | Participants, InstanceParticipation |
| 5 | Enable Action | Quests (CustomBar), PlayerQuest |
| 6 | Generate Short-Term Wins | Completed quests |
| 7 | Sustain Acceleration | Campaigns spawning events, EventCampaign |
| 8 | Institute Change | Sustained outcomes, completion reflections |

### Domain Strategy Generation

Four canonical domains (from `src/lib/kotter.ts`):

| Domain | Strategy Focus |
|--------|----------------|
| GATHERING_RESOURCES | Fundraising, donations, resource acquisition |
| RAISE_AWARENESS | Social media, invitations, storytelling, press |
| DIRECT_ACTION | Quest completion, coordination, action |
| SKILLFUL_ORGANIZING | Capacity, systems, practices |

Each domain section contains:
- Strategy summary
- Active quests
- Suggested quests
- Opportunities
- Recent progress

### RACI Integration

Map actors to responsibilities from quest participation and invitation actions:

| Role | Source |
|------|--------|
| Responsible | Quest stewards, GameboardSlot.stewardId |
| Accountable | Campaign direction, InstanceMembership |
| Consulted | Event strategy, BarResponse.offer_help |
| Informed | Community oversight, participants |

---

## Editing Mechanisms

### Manual Updates

Users may submit:
- Narrative updates
- Strategic insights
- Campaign reflections

Sources: ChatGPT-generated text, BARs, 321 reflections, external writing. Updates apply to relevant playbook sections.

### Automated Updates

System periodically synthesizes campaign artifacts:
1. Collect campaign artifacts (BARs, quests, events, comments, completion reflections)
2. Cluster by playbook section
3. Summarize insights
4. Update playbook

---

## Playbook Export

Supported outputs:
- Markdown
- PDF
- Plain text snippets

Export features:
- Generate tweet thread
- Generate email invitation
- Generate campaign summary

---

## Campaign Deck Generation

Campaign Deck = gameboard of the campaign. Includes:
- Active quests
- Available quests
- Events
- Key actors
- Strategic goals

Deck generation pulls from playbook structure.

---

## Playbook Skill (Player Capability)

Players may develop a **Playbook Skill** — ability to synthesize narrative and strategy.

Actions: submit strategic insights, write campaign summaries, curate important BARs, propose new quests, update playbook narrative.

High playbook skill may unlock: strategy generation, campaign diagnostics, quest templating, domain optimization.

---

## Integration Points

| System | Integration |
|--------|-------------|
| Instance | Playbook attached via instanceId |
| CustomBar | BARs, quests as artifact sources |
| EventCampaign | Events, milestones |
| InstanceMembership | People, RACI |
| GameboardSlot | Active quests, deck |
| BarResponse | RACI, participation |
| Kotter | Stage mapping |

---

## Implementation Artifacts (Target Paths)

```
src/features/playbook/
src/features/playbook/types/
src/features/playbook/services/
src/features/playbook/api/
src/features/playbook/__tests__/
```

Adapt to project structure while preserving modular, API-first design.

---

## References

- [campaign-playbook-api.md](campaign-playbook-api.md)
- [event-campaign-api.md](event-campaign-api.md)
- [system-bar-api.md](system-bar-api.md)
- [src/lib/kotter.ts](../src/lib/kotter.ts)
