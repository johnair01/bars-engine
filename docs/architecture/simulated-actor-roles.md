# Bounded Simulated Actor Roles

A small set of simulated actor roles that participate in quests in helpful, bounded ways. Supports future single-player gameplay where the player interacts with simulated collaborators that feel useful and consistent.

These actors are **bounded role-actors**, not full autonomous beings.

## Core Design Rule

Simulated actors should be **useful before dramatic**. They help with quest progression, guidance, or reflection before attempting rich personality simulation.

They must:

- operate within permissions
- emit traceable events
- follow role-specific policies
- avoid silent state mutation
- remain bounded in scope

## Initial Simulated Actor Roles

### 1. Librarian

| Field | Value |
|-------|-------|
| role_id | `librarian` |
| role_name | Librarian |
| purpose | Explain available quest steps; suggest relevant BAR or quest next moves; help the player understand what to do next |

**Typical bounded actions:**

- observe current quest state
- propose next valid action
- recommend relevant BAR usage
- emit guidance events

**Must not:**

- complete the player's core quest actions automatically
- change critical state without approval

### 2. Collaborator

| Field | Value |
|-------|-------|
| role_id | `collaborator` |
| role_name | Collaborator |
| purpose | Help advance work-oriented quests; propose substeps; draft small bounded outputs; join shared quest state in a limited way |

**Typical bounded actions:**

- propose subtask
- suggest quest decomposition
- help draft a BAR or response
- emit collaboration events

**Must not:**

- finalize important user decisions
- impersonate user intent
- silently complete gated progression

### 3. Witness

| Field | Value |
|-------|-------|
| role_id | `witness` |
| role_name | Witness |
| purpose | Reflect progress back to the player; confirm milestones; reinforce completion and continuity; help maintain narrative coherence |

**Typical bounded actions:**

- summarize what happened
- reflect completed actions
- note outstanding next step
- emit acknowledgment events

**Must not:**

- invent progress that did not occur
- create false state changes

## Actor Role Contract

Each simulated actor role defines:

| Field | Description |
|-------|-------------|
| role_id | Unique identifier |
| role_name | Human-readable name |
| purpose | One-sentence purpose |
| allowed_observations | What the actor can observe |
| allowed_actions | Actions the actor may take |
| forbidden_actions | Actions the actor must not take |
| event_types | Event types it may emit |
| policy_summary | Short policy description |
| required_permissions | Permissions needed to invoke |

## Control Mode

Simulated actors use a distinct control mode:

- **system_guided** — Controller follows deterministic policies and role contracts; no autonomous decision-making beyond bounded proposals.

This differs from **human_controlled** actors, who make decisions via UI.

## Bounded Action Model

Simulated actor actions are generally one of:

- observe
- propose
- suggest
- summarize
- acknowledge
- draft_small_output

**Avoid allowing:**

- adjudicate
- finalize player identity choices
- mutate critical progression states autonomously

Goal: supportive participation, not hidden automation.

## Single-Player Use Case

Future single-player mode: simulated actors provide social texture and practical help.

First version must answer:

- How can a player receive guidance when alone?
- How can a player experience collaborative-feeling support?
- How can simulated actors help advance real work in bounded ways?
- How can these interactions remain auditable and trustworthy?

Keep the first implementation narrow.

## References

- [actor-model.md](actor-model.md)
- [flow-simulator-cli.md](flow-simulator-cli.md)
