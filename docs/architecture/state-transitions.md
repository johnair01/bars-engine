# State Transition and Flow Spec v0

## Purpose

Describe how system state changes occur. The system follows an event-driven architecture. State transitions must: **check permissions**, **emit events**, and **be auditable**. LLMs may propose transitions but should not directly execute sensitive ones.

Compatible with existing onboarding, campaigns, quests, and gameboard flows.

---

## 1. Design Principles

- **Event-driven** — All state changes emit events; mutations are triggered by events
- **Permission-checked** — Transitions enforce actor capabilities at boundaries
- **Auditable** — Event ledger supports debugging, auditing, analytics, narrative triggers
- **LLM-safe** — Agents propose; human/system approval executes; no direct sensitive mutation

---

## 2. Core Flow Types

### 2.1 Identity Flow

**States:** anonymous → identified → authenticated → onboarded

| State | Description | Trigger |
|-------|-------------|---------|
| anonymous | No account; session/cookie only | Initial visit |
| identified | Contact (email) known; no password | Campaign sign-up node reached |
| authenticated | Account created; logged in | Account creation |
| onboarded | Orientation complete; in campaign | Orientation quests completed |

**Events:** `identity_created`, `identity_authenticated`, `onboarding_completed`

---

### 2.2 Actor Lifecycle Flow

**States:** active | suspended | archived

| State | Description | Who Can Trigger |
|-------|-------------|-----------------|
| active | Actor can act | Default; admin reactivates |
| suspended | Actor cannot act; identity preserved | Admin |
| archived | Actor retired; read-only history | Admin |

**Transitions:**
- active → suspended: Admin suspends (e.g., policy violation)
- suspended → active: Admin reactivates
- active → archived: Admin archives (e.g., account deletion request)
- suspended → archived: Admin archives

**Events:** `actor_suspended`, `actor_reactivated`, `actor_archived`

---

### 2.3 Campaign Enrollment Flow

**States:** invited | joined | active | inactive | removed

| State | Description | Who Can Trigger |
|-------|-------------|-----------------|
| invited | Invite sent; not yet used | Admin, system |
| joined | InstanceMembership created | Player (via invite), admin |
| active | Participating; in good standing | Default after join |
| inactive | Paused; e.g., period ended | System, admin |
| removed | Membership revoked | Admin, self (opt-out) |

**Transitions:**
- invited → joined: Player uses invite
- joined → active: Default on join
- active → inactive: Period end, campaign pause
- inactive → active: New period, campaign resume
- active → removed: Admin removes, player opts out
- removed → (none): Terminal

**Events:** `invite_sent`, `actor_enrolled_campaign`, `enrollment_activated`, `enrollment_deactivated`, `enrollment_removed`

**Mapping:** InstanceMembership; roleKey; InstanceParticipation for active participation.

---

### 2.4 Quest Lifecycle Flow

**Quest states:** draft | open | joined | active | blocked | completed | archived

| State | Description | Who Can Trigger |
|-------|-------------|-----------------|
| draft | Quest not published; editing | Creator, admin |
| open | Published; available for assignment | Admin, publish action |
| joined | Player has taken (PlayerQuest created) | Player (take quest) |
| active | In progress; steward working | Implicit on join |
| blocked | Awaiting unblock (e.g., AID) | System, steward |
| completed | Done; rewards applied | Player (completion), system |
| archived | No longer available | Admin |

**Transitions:**
- draft → open: Publish
- open → joined: Player takes quest
- joined → active: Implicit (steward assigned)
- active → blocked: AID offered and pending; or external dependency
- blocked → active: AID accepted; dependency resolved
- active → completed: Completion validated
- open → archived: Admin archives
- completed → archived: Admin archives (optional)

**Events:** `quest_published`, `quest_joined`, `quest_activated`, `quest_blocked`, `quest_unblocked`, `quest_completed`, `quest_archived`

**Mapping:** CustomBar.status (draft/active/archived); PlayerQuest.status (assigned/completed); GameboardSlot phase for active/blocked.

---

### 2.5 BAR / Signal Flow

**States:** captured | validated | attached_to_quest | converted_to_action | event_logged

| State | Description | Who Can Trigger |
|-------|-------------|-----------------|
| captured | Signal received; raw form | System, actor input |
| validated | Signal passes validation | System, validator |
| attached_to_quest | Linked to quest/context | System, steward |
| converted_to_action | Became an action (e.g., move applied) | System |
| event_logged | Persisted in event ledger | System |

**Transitions:**
- captured → validated: Validation passes
- validated → attached_to_quest: Linked to quest, slot, or thread
- attached_to_quest → converted_to_action: Move applied, completion recorded
- converted_to_action → event_logged: Event emitted and stored

**Actor interaction:** Actors produce signals (e.g., Twine choices, form submissions). Signals are validated before affecting quest state. Invalid signals are rejected; no state change.

**Events:** `signal_captured`, `signal_validated`, `signal_attached`, `signal_converted`, `signal_logged`

**Mapping:** QuestMoveLog, TwineRun, BarShare; completion effects.

---

### 2.6 Resource Flow (Vibeulons)

**States:** minted | held | spent | transferred | expired

| State | Description | Who Can Trigger |
|-------|-------------|-----------------|
| minted | Created; assigned to actor | System (completion, reward) |
| held | In actor wallet | Default after mint |
| spent | Used (bid, redemption, etc.) | Player, system |
| transferred | Sent to another actor | Player |
| expired | Revoked or time-limited | System |

**Transitions:** minted → held; held → spent | transferred | expired.

**Events:** `vibeulon_minted`, `vibeulon_spent`, `vibeulon_transferred`, `vibeulon_expired`

**Mapping:** Vibulon, VibeulonLedger, VibulonEvent.

---

### 2.7 Agent Interaction Flow

Agents follow a **safe interaction pattern**:

1. **Perceive context** — Read events, state, visibility-scoped data
2. **Propose action** — Submit proposed transition (e.g., `propose_quest_join`)
3. **Human/system approval** — Adjudication checks permissions, preconditions
4. **Action executed** — Approved transition runs; state mutates
5. **Event logged** — Event emitted to ledger

**Why this prevents unsafe mutation:** Agents never directly mutate critical state. All mutations go through an adjudication path. Proposals can be rejected; execution is permission-checked. Audit trail is complete.

**Events:** `agent_proposal_created`, `agent_proposal_approved`, `agent_proposal_rejected`, `agent_action_executed`

---

### 2.8 Relationship Flow

**States:** proposed | active | dissolved

| State | Description | Who Can Trigger |
|-------|-------------|-----------------|
| proposed | Relationship offered | Actor (e.g., mentor, ally) |
| active | Relationship established | Both parties (accept) |
| dissolved | Relationship ended | Either party, admin |

**Transitions:** proposed → active (accept); active → dissolved (end).

**Events:** `relationship_proposed`, `relationship_activated`, `relationship_dissolved`

**Mapping:** InstanceMembership, GameboardSlot steward/offerer; future actor_relationships table.

---

## 3. State Machines

### 3.1 Quest State Machine

```
     draft ──(publish)──> open
       │                      │
       │                      │ take
       │                      ▼
       │                 joined ──> active
       │                   │           │
       │                   │           ├──(block)──> blocked ──(unblock)──> active
       │                   │           │
       │                   │           └──(complete)──> completed
       │                   │
       └──(archive)        └──(archive)    │
            │                   │         │
            ▼                   ▼         ▼
         archived <─────────────┴─────────┘
```

| From | To | Trigger | Permission |
|------|-----|---------|------------|
| draft | open | Publish | creator, admin |
| open | joined | Player takes | participant |
| joined | active | Implicit | system |
| active | blocked | AID pending, dependency | system |
| blocked | active | AID accepted, resolved | system, steward |
| active | completed | Completion validated | steward, system |
| draft, open, completed | archived | Archive | admin |

---

### 3.2 Campaign Enrollment State Machine

```
  invited ──(use invite)──> joined ──> active
                                    │      │
                                    │      ├──(pause)──> inactive ──(resume)──> active
                                    │      │
                                    │      └──(remove)──> removed
                                    │
                                    └──(remove before active)──> removed
```

| From | To | Trigger | Permission |
|------|-----|---------|------------|
| invited | joined | Use invite | invitee |
| joined | active | Default | system |
| active | inactive | Pause, period end | admin, system |
| inactive | active | Resume | admin, system |
| active, inactive | removed | Remove | admin, self (opt-out) |

---

### 3.3 Actor Status State Machine

```
  active <───────> suspended
    │                  │
    └──────(archive)───┴────> archived
```

| From | To | Trigger | Permission |
|------|-----|---------|------------|
| active | suspended | Suspend | admin |
| suspended | active | Reactivate | admin |
| active, suspended | archived | Archive | admin |

---

### 3.4 BAR / Signal State Machine

```
  captured ──(validate)──> validated ──(attach)──> attached_to_quest
                                                          │
                                                          │ convert
                                                          ▼
                                              converted_to_action ──> event_logged
```

| From | To | Trigger | Permission |
|------|-----|---------|------------|
| captured | validated | Validation passes | system |
| validated | attached_to_quest | Link to quest | steward, system |
| attached_to_quest | converted_to_action | Move applied | steward, system |
| converted_to_action | event_logged | Event emitted | system |

---

## 4. Event Ledger

All transitions must emit events. Events support: **debugging**, **auditing**, **analytics**, **narrative triggers**.

### 4.1 Event Schema

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique event id |
| actor_id | string | Actor who performed or received the action |
| action_type | string | Event type (e.g., quest_joined, aid_declined) |
| target_ref | string | Target entity (e.g., questId, slotId, instanceId) |
| payload | json | Event-specific data |
| timestamp | datetime | When the event occurred |
| controller_ref | string? | For agent actions: human or policy that approved |

### 4.2 Canonical Event Types

| action_type | Payload | Flow |
|-------------|---------|------|
| identity_created | accountId, contactValue | Identity |
| quest_joined | playerId, questId, slotId? | Quest |
| quest_completed | playerId, questId, completedAt | Quest |
| quest_blocked | questId, reason, offerId? | Quest |
| quest_unblocked | questId | Quest |
| actor_enrolled_campaign | playerId, instanceId, roleKey | Enrollment |
| aid_offered | offerId, stewardId, offererId, type | AID |
| aid_accepted | offerId | AID |
| aid_declined | offerId | AID |
| vibeulon_minted | playerId, amount, sourceRef | Resource |
| signal_captured | signalType, actorId, targetRef | BAR/Signal |
| agent_proposal_created | proposalId, actorId, action_type | Agent |
| agent_proposal_approved | proposalId | Agent |
| agent_proposal_rejected | proposalId, reason | Agent |

### 4.3 Mapping to Current Schema

| Conceptual | Schema |
|------------|--------|
| Event log | VibulonEvent, QuestMoveLog, VerificationCompletionLog (partial) |
| Full ledger | Future: actor_event_log or event_ledger table |

---

## 5. Implementation Notes

### 5.1 Enforce Permissions at Transition Boundaries

- Every transition handler checks actor capabilities before mutating.
- Use a central `canTransition(actorId, fromState, toState, context)` or equivalent.
- Reject with 403 if unauthorized; do not mutate.

### 5.2 Keep Transitions Idempotent

- Same event id + same current state → no duplicate mutation.
- Use idempotency keys for external triggers (e.g., webhooks).
- Return success without re-applying if already applied.

### 5.3 Centralize Event Emission

- Single `emitEvent(event)` used by all transition handlers.
- Events emitted in same transaction as state change where possible.
- Async emission acceptable for non-critical path; ensure ordering for audit.

### 5.4 Avoid Duplicating State Logic

- State machine logic lives in backend/services, not UI.
- UI reflects state; does not compute valid next states.
- Shared types for states (e.g., QuestStatus enum) used by API and UI.

### 5.5 Agent Proposal Flow

- Agent calls `proposeAction(actorId, actionType, payload)`.
- Returns proposalId; does not mutate.
- Human or policy calls `approveProposal(proposalId)` or `rejectProposal(proposalId)`.
- Approval path runs the transition and emits events.

---

## 6. Constraints

- **Implementation-readable** — Developers can implement from this spec.
- **Stable primitives** — Future features build on these flows.
- **No speculative features** — Only flows that exist or have clear migration path.
- **Integrate with existing systems** — Onboarding, quests, gameboard, campaigns.

---

## 7. Mapping to Current Schema

| Conceptual | Schema / Model |
|------------|----------------|
| Quest states | CustomBar.status, PlayerQuest.status, GameboardSlot |
| Enrollment states | InstanceMembership, InstanceParticipation |
| Actor status | Player (no status field yet; future) |
| BAR/Signal | QuestMoveLog, TwineRun, BarShare, completion effects |
| Resource flow | Vibulon, VibeulonLedger, VibulonEvent |
| Event ledger | VibulonEvent, QuestMoveLog; future event_ledger |
| Orientation | QuestThread, orientationQuestId, postSignupRedirect |
| AID | GameboardAidOffer.status |
| Bid | GameboardBid.status |

---

## 8. Expected Outcomes

After this spec is implemented, developers can:

- **Implement the actor system** — Actor lifecycle, status, permissions
- **Build agent-assisted NPCs** — Propose → approve → execute pattern
- **Enforce permissions cleanly** — Central transition guards
- **Implement quest state machines** — draft → open → joined → active → completed → archived
- **Build event-driven gameplay logic** — Event ledger as source of truth for triggers
