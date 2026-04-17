# Adventure Template — Book CYOA Pattern

Template system for steward-authored book campaigns. Reusable pattern proven with MtGoA Chapter 1.

## Template Slots

### `intro` — Expository
Orient reader, set stakes. Single forward button.

### `bridge_open` — Epiphany Bridge  
Reframe + commitment. Same move as intro.

### `domain_pick` (optional) — Expository, branching
Player selects allyship lens. Multiple domain-aligned branches.

### `story_prompt` — Storytelling
Narrative frame for practice. Sets emotional context.

### `skill_practice` — Skill Development
**MUST include `linkedQuestId`** (CustomBar quest). Real practice loop.

### `move_recap` — Expository
Reflect on practice. Close learning loop.

### `library_cta` (optional) — Expository
Invite deeper engagement with library or full book.

## Node Naming Convention

```
<BOOK_SLUG>_<CHAPTER>_<SLOT>
```

Examples: `MTGOA_CH1_Start`, `MTGOA_CH1_Bridge`, `MTGOA_CH1_Practice`

## Passage Schema

```typescript
{
  nodeId: string;
  text: string;
  choices: JSON.stringify([
    { text: string; targetId: string; }
  ]);
  metadata: {
    passageType: "epiphany_bridge" | "expository" | "storytelling" | "skill_development";
    move?: "wake_up" | "clean_up" | "grow_up" | "show_up";
    domains?: string[];
  };
  linkedQuestId?: string | null;
}
```

## Move Alignment

| Passage `move` | Quest `moveType` |
|---|---|
| `wake_up` | `wakeUp` |
| `clean_up` | `cleanUp` |
| `grow_up` | `growUp` |
| `show_up` | `showUp` |

## Four-Move Chapter Structure

```
act1: wake_up     (intro → bridge → practice)
act2: clean_up    (reset/reflection)
act3: grow_up     (skill development)  
act4: show_up     (embodied action)
```

## Validation Checklist

- [ ] All `nodeId` unique within adventure
- [ ] All `targetId` point to existing nodes or valid redirects
- [ ] `linkedQuestId` references active published `CustomBar`
- [ ] ≥1 `epiphany_bridge` passage
- [ ] ≥1 `skill_development` with `linkedQuestId`
- [ ] All passages have appropriate `move` metadata
- [ ] Markdown renders correctly
- [ ] Copy matches book voice

See AUTHORING_GUIDE.md for step-by-step instructions.
