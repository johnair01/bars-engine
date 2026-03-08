# Actor Model Spec

## Purpose

Define the participation primitive for Bars-engine. Actors represent entities that can act within campaigns and quests. This spec is implementation-oriented and compatible with existing Player, Instance, and Quest models.

---

## 1. Actor Definition

An **actor** is an entity that satisfies all of the following:

- **Durable identity** — Stable, unique identifier across sessions and events
- **Permission-bearing capacity** — Can hold roles and capabilities that grant or restrict actions
- **Role participation** — Participates in campaigns, instances, and quests via assigned roles
- **Action initiation or response** — Can initiate actions (e.g., join quest, create BAR) or respond to actions (e.g., accept AID offer, complete quest)
- **Event participation** — Generates or receives events; state changes are event-backed

### Not Actors

The following are explicitly **not** actors:

- **Static objects** — Nations, Playbooks, AllyshipDomains, DocNodes (reference data)
- **Background jobs** — Extract workers, analysis workers, cron tasks
- **UI elements** — Components, modals, forms (they render actor actions, they do not act)
- **Stateless utilities** — Compilers, validators, formatters
- **Resources** — Vibulons, VibeulonLedger entries (they are owned by actors, not actors themselves)
- **Artifacts** — CustomBar (quests), TwineStory, Adventure (they are created by actors)

---

## 2. Actor vs Controller

Actors are **separate** from the intelligence controlling them.

| Concept | Definition |
|---------|------------|
| **Actor** | The durable entity with identity, permissions, and event participation |
| **Controller** | The system or process that decides what actions the actor takes |

**Controllers** may be:

- **Human users** — Direct control via UI
- **LLM agents** — Propose actions; do not directly mutate critical state
- **Deterministic policies** — Rules, heuristics, scripts
- **Hybrid human/agent** — Human approves agent proposals; agent executes approved actions

**Why separate:** Controllers can change without changing actor identity. An actor may be human-controlled today and agent-assisted tomorrow. Separation improves auditability (who acted vs. who decided) and safety (agents propose; humans or policies adjudicate).

---

## 3. Actor Invariants

Every actor must support:

| Invariant | Description |
|-----------|-------------|
| **identity** | Unique `id`; stable across sessions |
| **display_name** | Human-readable label (may change) |
| **actor_type** | `human` \| `npc` \| `agent` |
| **status** | `active` \| `suspended` \| `archived` |
| **campaign_membership** | Set of campaigns/instances the actor belongs to |
| **permission_set** | Derived from roles; determines allowed actions |
| **relationship_graph** | Typed relationships to other actors, quests, campaigns |
| **event_participation** | All state changes emit events; actors appear in event log |

---

## 4. Actor Roles

Roles are **capability bundles**, not separate entity types. One actor can hold multiple roles.

| Role | Capabilities | Typical Use |
|------|--------------|-------------|
| **participant** | observe, join, converse, propose | Player in campaign |
| **admin** | observe, create, modify, adjudicate | System administration |
| **quest_giver** | create, modify (own quests), observe | Creator of CustomBar |
| **librarian** | observe, converse, propose (docs) | K-Space Librarian, guide |
| **vendor** | observe, create (offers), modify (own) | Redemption packs, donations |
| **facilitator** | observe, converse, propose, join | Game Master, steward |
| **steward** | observe, modify (slot), adjudicate (AID) | Gameboard slot owner |

Roles may be scoped: e.g., `admin` (global) vs. `campaign_admin` (per-instance).

---

## 5. Control Modes

Actors operate under a **control mode** that affects allowed actions:

| Mode | Description | Allowed Actions |
|------|-------------|-----------------|
| **human-controlled** | Direct user input | Full set per role |
| **agent-assisted** | Agent proposes; human approves | Propose only; human executes |
| **agent-driven** | Agent executes approved actions | Execute pre-approved actions |
| **system-driven** | Deterministic policy | Scripted actions (e.g., seed, cron) |
| **hybrid** | Mix of above | Per-action policy |

**Rule:** LLM-guided agents **propose** actions; they do not directly mutate critical state. Mutations go through an adjudication path (human approval, policy check, or event handler).

---

## 6. Capabilities / Permissions

### Capability Model

| Capability | Description |
|------------|-------------|
| **observe** | Read visibility-scoped data |
| **converse** | Send/receive messages, participate in threads |
| **propose** | Submit actions for approval (agent use case) |
| **join** | Join campaigns, quests, instances |
| **create** | Create quests, BARs, adventures |
| **modify** | Edit own or scope-permitted resources |
| **adjudicate** | Approve/reject proposals; resolve disputes |
| **mint** | Create vibulons, assign rewards |

### Grant Sources

Capabilities may be granted by:

- **Campaign role** — InstanceMembership.roleKey, InstanceParticipation
- **Quest role** — Steward, creator, participant
- **Admin assignment** — PlayerRole with Role.key (e.g., `admin`)
- **Earned reputation** — Future: trust score, completion history
- **Temporary delegation** — Future: time-bound capability grant

---

## 7. Actor Goals

Actors may optionally carry **goals**. Goals are useful for:

- **NPC actors** — Narrative objectives, quest hooks
- **Agents** — Task completion, alignment targets
- **Guided workflows** — Orientation, onboarding steps

Goals **influence** behavior but are **not required**. Human actors typically have no explicit goals in the system. Goals do not override permissions.

---

## 8. Actor Relationships

Actors maintain typed relationships:

| Relationship | To | Description |
|--------------|-----|-------------|
| **collaborator** | Actor | Co-participant in quest/campaign |
| **mentor** | Actor | Guides another actor |
| **guide** | Actor | Librarian, facilitator |
| **ally** | Actor | Campaign ally (allyship domain) |
| **participant** | Instance/Campaign | Member of instance |
| **steward** | GameboardSlot | Owns slot |
| **creator** | CustomBar, Adventure | Created resource |

Relationships may affect **visibility** (what the actor sees) and **permissions** (what they can do).

---

## 9. Event Participation

Actors generate or respond to events. **Actors must never mutate system state without emitting an event.**

### Example Events

| Event | Actor Role | Description |
|-------|------------|-------------|
| `quest_joined` | Participant | Player takes a quest |
| `bar_created` | Creator | CustomBar created |
| `actor_enrolled_campaign` | Participant | InstanceMembership created |
| `quest_completed` | Participant | PlayerQuest completed |
| `aid_offered` | Offerer | GameboardAidOffer created |
| `aid_declined` | Steward | Offer declined |
| `vibeulon_minted` | System | Reward granted |

Event log supports auditability and replay. LLM agents consume events to maintain context.

---

## 10. Conceptual Actor Schema

*Not bound to Prisma. Maps conceptually to Player + extensions.*

### Actor

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| display_name | string | Human-readable name |
| actor_type | enum | human, npc, agent |
| control_mode | enum | human_controlled, agent_assisted, agent_driven, system_driven, hybrid |
| owner_user_id | string? | For agents: human who owns the agent |
| status | enum | active, suspended, archived |
| policy_ref | string? | Reference to policy/config for agent-driven actors |
| created_at | datetime | |
| updated_at | datetime | |

### actor_capabilities

| Field | Type | Description |
|-------|------|-------------|
| actor_id | string | FK to Actor |
| capability | string | observe, converse, propose, join, create, modify, adjudicate, mint |
| scope | string? | campaign_id, instance_id, or null (global) |
| granted_by | string? | Actor or system that granted |
| expires_at | datetime? | For temporary grants |

### actor_relationships

| Field | Type | Description |
|-------|------|-------------|
| actor_id | string | FK to Actor |
| target_type | string | actor, quest, campaign, instance |
| target_id | string | |
| relationship_type | string | collaborator, mentor, steward, participant, creator, etc. |
| created_at | datetime | |

### actor_goals

| Field | Type | Description |
|-------|------|-------------|
| actor_id | string | FK to Actor |
| goal_type | string | narrative, task, alignment |
| goal_ref | string? | Reference to quest, thread, or config |
| status | enum | active, completed, abandoned |
| created_at | datetime | |

### actor_event_log

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique event id |
| actor_id | string | Actor who generated or received |
| event_type | string | quest_joined, bar_created, etc. |
| payload | json | Event-specific data |
| created_at | datetime | |

---

## Mapping to Current Schema

| Conceptual | Current Bars-engine |
|------------|---------------------|
| Actor | Player (human actors) |
| actor_capabilities | PlayerRole + Role.key; InstanceMembership.roleKey |
| actor_relationships | InstanceMembership, InstanceParticipation; GameboardSlot.stewardId |
| actor_event_log | VibulonEvent, QuestMoveLog, VerificationCompletionLog (partial) |
| actor_goals | Not yet implemented |

Future: NPC and agent actors extend this model; Player remains the primary human actor implementation.
