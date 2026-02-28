# Prompt: Story and Quest Map Exploration

**Use this prompt when exploring or specifying a map UI for story progress and quest stack visualization.**

## Context

From [content/narrative-mechanics.md](../../content/narrative-mechanics.md): "Map of Meaning — (Aspirational) The movement of resources (Vibulons) through the system creates a 'map of meaning,' similar to a Twine-like Choose Your Own Adventure structure." Players need a way to visualize their progress and the movement of quest stacks through the game.

## Prompt text

> Explore and spec a Story/Quest Map UI. Design a UI that lets players visualize: (a) campaign/story progress — nodes = passages or story beats, edges = choices, player position highlighted (Twine-style graph); (b) quest stack position and movement — nodes = quests in a thread, sequence, completed vs pending; (c) optionally vibeulon flow — who earned what, for what ("map of meaning"). Create spec only; defer implementation until prioritized. Use existing schema: QuestThread, ThreadQuest, PlayerQuest, player.storyProgress, ThreadProgress, VibulonEvent.

## Checklist

- [ ] Spec document: map concepts, data sources, UI wireframes or descriptions
- [ ] Identify which schema fields support each map type
- [ ] Document entry points (e.g. /map, dashboard widget, quest detail)
- [ ] Add to backlog for implementation when ready

## Reference

- Narrative mechanics: [content/narrative-mechanics.md](../../content/narrative-mechanics.md)
- Quest threads: [src/actions/quest-thread.ts](../../src/actions/quest-thread.ts)
- Schema: QuestThread, ThreadQuest, PlayerQuest, ThreadProgress, VibulonEvent
- Campaign/CYOA: [src/app/campaign/page.tsx](../../src/app/campaign/page.tsx)
