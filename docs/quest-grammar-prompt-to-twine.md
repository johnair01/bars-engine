# Quest Grammar: Prompt to Twine Story

Repeatable process for turning unpacking data into playable CYOA quests. Documents mechanics, choice patterns, and admin workflow.

## Overview

1. **Prompt assembly** — `buildQuestPromptContext` produces structured prompt (External desire → Wall → Conflict → Transformation).
2. **AI skeleton generation** — AI outputs passage texts (skeleton), choice labels, target passage IDs, emotional metadata per node.
3. **Twine conversion** — Deterministic: `questPacketToTwee(packet)` → Twee 3 format (passages, links).
4. **Admin flavor pass** — Admin edits passage text in-place. Structure (choices, targets) preserved. Voice Style Guide applied.
5. **Publish** — Twee → Adventure + Passages (or append to existing).

## Mechanics

### Passage structure

- **One beat per passage** — No walls of text; chunk per CYOA rules.
- **2–3 choices per passage** — Except final passage (e.g. "Create my account" → signup).
- **Model choice**:
  - **Personal (Epiphany Bridge)**: 6 beats — orientation, rising_engagement, tension, integration, transcendence, consequence.
  - **Communal (Kotter)**: 8 stages — urgency, coalition, vision, communicate, obstacles, wins, build_on, anchor.

### Problem–solution mapping

When the narrative presents a problem (tension, wall, obstacle), choices offer distinct approaches. Map emotional alchemy moves to choice types:

| Move | Choice flavor |
|------|---------------|
| **Wake Up** | "Learn more", "Explore", "Orient" |
| **Clean Up** | "Work through this", "Process", "Unblock" |
| **Grow Up** | "Build capacity", "Practice", "Develop" |
| **Show Up** | "Take action", "Commit", "Do it" |

### Skeleton + flavor

- **AI skeleton**: Beat text, choice labels, target passage IDs, emotional metadata per node.
- **Admin flavor pass**: Edit text to add voice, campaign-specific language, and tone without changing the graph.
- **Voice Style Guide**: Presence first, confident tone, economical with words. See [Voice Style Guide](/wiki/voice-style-guide).

## AI skeleton output schema

```ts
{
  objectives: string[]           // What a completer achieves
  passages: Array<{
    id: string                  // e.g. node_0, node_1
    text: string                // Passage body (markdown)
    choices: Array<{
      text: string
      targetId: string
      moveId?: string           // Canonical move for choice privileging
    }>
  }>
  startPassage: string          // e.g. "node_0"
}
```

## Admin workflow

### Edit-in-place

- Admin sees each passage with its text.
- Can edit text without changing choice structure.
- **Preserve**: Passage IDs, choice targets, links.

### Choice refinement

- Add/remove/relabel choices.
- Targets must resolve to valid passage IDs.
- Validate before publish.

### Validation before publish

- [ ] All choice targets exist (no broken links)
- [ ] No orphan passages
- [ ] Start passage defined
- [ ] Final passage has signup/contribution choice when applicable

## Twine conversion

`questPacketToTwee(packet: SerializableQuestPacket, title?: string): string`

- Outputs Twee 3 format (SugarCube).
- Uses `node.id` for passage IDs.
- External targets (e.g. `signup`) get stub passages: `[End — signup]`.

## Related

- [Quest Grammar UX Flow spec](../.specify/specs/quest-grammar-ux-flow/spec.md)
- [Voice Style Guide](/wiki/voice-style-guide)
- [Emotional First Aid](/wiki/emotional-first-aid)
