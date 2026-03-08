# Moves Index

Canonical index of moves in the BARS Engine. Used by quest grammar, choice privileging, and wiki.

## 4 Moves (Personal Throughput)

Universal. Each nation has all 4, tuned to its element/channel.

| Move | Meaning |
|------|---------|
| Wake Up | See more of what's available (who, what, where, how) |
| Clean Up | Get more emotional energy; unblock vibeulon-generating actions |
| Grow Up | Increase skill capacity through developmental lines |
| Show Up | Do the work of completing quests |

**Nation 4 moves**: Stored on `Nation.wakeUp`, `cleanUp`, `growUp`, `showUp`. Each nation's descriptions are channel-tuned (Metal→Fear, Fire→Anger, Water→Sadness, Wood→Joy, Earth→Neutrality).

## 15 Canonical Moves (Emotional Alchemy)

Cross-national collaboration. Unlock when onboarding completes (implicit: full 15 available for choice privileging).

**Transcend** (Energy +2): Step Through, Reclaim Meaning, Commit to Growth, Achieve Breakthrough, Stabilize Coherence  
**Generative** (Energy +1): Declare Intention, Integrate Gains, Reveal Stakes, Deepen Value, Renew Vitality  
**Control** (Energy -1): Consolidate Energy, Temper Action, Reopen Sensitivity, Activate Hope, Mobilize Grief  

See [.agent/context/emotional-alchemy-ontology.md](../.agent/context/emotional-alchemy-ontology.md) and [src/lib/quest-grammar/move-engine.ts](../src/lib/quest-grammar/move-engine.ts).

## Developmental Lens → Moves

Each of the 6 Faces has moves available. Used when `developmentalLens` is set in quest generation.

| Lens | Move emphasis |
|------|---------------|
| Shaman | Renew Vitality, Activate Hope, Reopen Sensitivity |
| Challenger | Achieve Breakthrough, Declare Intention, Mobilize Grief |
| Regent | Stabilize Coherence, Integrate Gains, Consolidate Energy |
| Architect | Reveal Stakes, Deepen Value, Integrate Gains |
| Diplomat | Reclaim Meaning, Deepen Value, Reopen Sensitivity |
| Sage | Stabilize Coherence, Commit to Growth, Renew Vitality |

See [src/lib/quest-grammar/lens-moves.ts](../src/lib/quest-grammar/lens-moves.ts).

## Meta-Metaphors: Yellow Brick Road

The Yellow Brick Road maps the 4 Moves to a single navigable image. See [FOUNDATIONS.md](../FOUNDATIONS.md#the-yellow-brick-road).

| Move | YBR Role | What it does on the road |
|------|----------|--------------------------|
| Wake Up | See the road ahead | Orientation — perceive what's available, where the road leads |
| Clean Up | Metabolize blockers into bricks | Alchemy — convert dissatisfied states into yellow bricks (energy + road) |
| Grow Up | Upgrade the vehicle | Capacity — improve the engine's ability to travel and transmute |
| Show Up | Travel the road | Action — move from Point A toward Point B by completing quests |

The vehicle can only move at the speed of metabolizing blockers. The bricks are BARs. The fuel is Vibeulons. The road always leads where you want to go.

## Wiki Paths

| Term | Path |
|------|------|
| 4 Moves | /wiki/moves |
| Emotional Alchemy | /wiki/emotional-alchemy |
| Nations (4 moves per nation) | /wiki/nations |
| Archetypes | /wiki/archetypes |
