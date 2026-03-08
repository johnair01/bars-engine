# Simulated Actor Example

## Scenario: Player Inside a Quest

A player is at a quest node that requires choosing a nation. The player is alone (single-player mode). Bounded simulated actors provide guidance and reflection.

## Librarian: Suggesting Next Valid Step

**State:** Player at `nation_choice` node. Options: Argyra, Pyrakanth, Virelune, Meridia, Lamenth.

**Librarian action:**

```json
{
  "actor_role": "librarian",
  "action_type": "propose",
  "payload": {
    "message": "You can choose one of five nations. Each aligns with an element and a developmental lens.",
    "valid_actions": ["choose_nation"],
    "suggested_next": "Select a nation to continue."
  },
  "event": "guidance_emitted"
}
```

Librarian observes state, proposes next valid action. Does not choose for the player.

## Collaborator: Proposing Bounded Subtask

**State:** Player at `intended_impact_bar` node. Must create a BAR (contribution note).

**Collaborator action:**

```json
{
  "actor_role": "collaborator",
  "action_type": "draft_small_output",
  "payload": {
    "message": "I can help draft a starter. You might write: 'I want to contribute by...' — then complete in your own words.",
    "draft_type": "suggestion",
    "requires_approval": true
  },
  "event": "collaboration_emitted"
}
```

Collaborator proposes a bounded subtask. Does not finalize the BAR.

## Witness: Summarizing Completion

**State:** Player has completed the nation selection and BAR creation. Reached completion node.

**Witness action:**

```json
{
  "actor_role": "witness",
  "action_type": "acknowledge",
  "payload": {
    "message": "You've chosen your nation and shared your intended impact. The Conclave has recorded your contribution.",
    "milestones": ["nation_selected", "bar_created", "orientation_complete"]
  },
  "event": "acknowledgment_emitted"
}
```

Witness reflects what happened. Does not invent progress.

## Forbidden: Witness Emitting False Completion

**Invalid:** Witness must not emit `quest_completed` when the player has not reached the completion node.

```json
// INVALID — Witness cannot create false state
{
  "actor_role": "witness",
  "action_type": "acknowledge",
  "payload": {
    "message": "Quest complete!",
    "milestones": ["quest_completed"]
  }
}
```

Witness only acknowledges events that actually occurred in the flow.
