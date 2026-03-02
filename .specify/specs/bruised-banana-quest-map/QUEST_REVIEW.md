# Quest Map Review — Bruised Banana Fundraiser

**Review these 8 quest types before seeding.** Each is a container quest; players add subquests via `createSubQuest` or `appendExistingQuest`. Market shows only the quest matching the instance's current `kotterStage`.

## Archetype Feature

Archetypes aligned to a Kotter stage can create quests for that stage **even when the game clock is elsewhere**. Visionaries (Heaven) can shape the vision while urgency is still being rallied. Each stage has a corresponding archetype (Thunder, Earth, Heaven, Lake, Water, Fire, Wind, Mountain).

## 4 Moves × Stage

Each stage has different applications of the 4 moves (Wake Up, Clean Up, Grow Up, Show Up). All Show Up moves = completing quests. The other three vary by stage.

---

## Instance Config

| Field | Value |
|-------|-------|
| Instance | BB-BDAY-001 (Bruised Banana Birthday Residency) |
| Goal | $3,000 (300000 cents) |
| Timeline | 30 days |
| Domain | GATHERING_RESOURCES |

---

## 1. Rally the Urgency (⚡ Thunder)

**Kotter stage:** 1 — We need resources

**Description:**
> **We need resources.** Create urgency for the Bruised Banana fundraiser. Help others feel why this matters now — the residency, the space, the community. What makes this moment critical?
>
> **By move:** Wake Up — see who needs to hear the urgency; map the stakes. Clean Up — clear what blocks you from naming what's at stake. Grow Up — develop your ability to name stakes and spark action. Show Up — complete quests that create urgency.

| Move | Application |
|------|--------------|
| Wake Up | See who needs to hear the urgency; map the stakes and stakeholders. |
| Clean Up | Clear what blocks you from naming what's at stake. |
| Grow Up | Develop your ability to name stakes and spark action. |
| Show Up | Complete quests that create urgency. |

---

## 2. Build the Coalition (🤝 Earth)

**Kotter stage:** 2 — Who will contribute?

**Description:**
> **Who will contribute?** Gather the people who can support the residency — donors, volunteers, allies. Grow the coalition.
>
> **By move:** Wake Up — see who's already aligned; who's on the fence. Clean Up — clear what blocks connection; repair strained ties. Grow Up — develop your ability to invite and nurture allies. Show Up — complete quests that grow the coalition.

| Move | Application |
|------|--------------|
| Wake Up | See who's already aligned; who's on the fence. |
| Clean Up | Clear what blocks connection; repair strained ties. |
| Grow Up | Develop your ability to invite and nurture allies. |
| Show Up | Complete quests that grow the coalition. |

---

## 3. Shape the Vision (👁 Heaven)

**Kotter stage:** 3 — Fully resourced looks like…

**Description:**
> **Fully resourced looks like…** Paint the picture. What does the Bruised Banana Residency look like when we hit the goal? Visionaries (Heaven archetype) can create quests here even when the game clock is elsewhere.
>
> **By move:** Wake Up — see what the end state could be; gather inspiration. Clean Up — clear fuzzy thinking; sharpen the vision. Grow Up — develop your ability to articulate and hold vision. Show Up — complete quests that articulate the vision.

| Move | Application |
|------|--------------|
| Wake Up | See what the end state could be; gather inspiration. |
| Clean Up | Clear fuzzy thinking; sharpen the vision. |
| Grow Up | Develop your ability to articulate and hold vision. |
| Show Up | Complete quests that articulate the vision. |

---

## 4. Spread the Word (🎭 Lake)

**Kotter stage:** 4 — Share the need

**Description:**
> **Share the need.** Tell people about the fundraiser, the goal, and how to contribute. Make it land.
>
> **By move:** Wake Up — see who needs to hear; what channels reach them. Clean Up — clear noise; find the clearest message. Grow Up — develop your ability to express and persuade. Show Up — complete quests that spread the word.

| Move | Application |
|------|--------------|
| Wake Up | See who needs to hear; what channels reach them. |
| Clean Up | Clear noise; find the clearest message. |
| Grow Up | Develop your ability to express and persuade. |
| Show Up | Complete quests that spread the word. |

---

## 5. Clear the Obstacles (💧 Water)

**Kotter stage:** 5 — What blocks donations?

**Description:**
> **What blocks donations?** Identify and remove barriers. What's stopping people from giving or participating?
>
> **By move:** Wake Up — see the obstacles; map the friction. Clean Up — clear what blocks the flow; unblock yourself and others. Grow Up — develop your ability to infiltrate and dissolve obstacles. Show Up — complete quests that remove barriers.

| Move | Application |
|------|--------------|
| Wake Up | See the obstacles; map the friction. |
| Clean Up | Clear what blocks the flow; unblock yourself and others. |
| Grow Up | Develop your ability to infiltrate and dissolve obstacles. |
| Show Up | Complete quests that remove barriers. |

---

## 6. Claim the First Win (🔥 Fire)

**Kotter stage:** 6 — First milestone reached

**Description:**
> **First milestone reached.** Celebrate progress. We hit 25%, 50%, 75%? Light the fire.
>
> **By move:** Wake Up — see what we've achieved; who made it happen. Clean Up — clear any doubt; let the win land. Grow Up — develop your ability to complete and celebrate. Show Up — complete quests that recognize wins.

| Move | Application |
|------|--------------|
| Wake Up | See what we've achieved; who made it happen. |
| Clean Up | Clear any doubt; let the win land. |
| Grow Up | Develop your ability to complete and celebrate. |
| Show Up | Complete quests that recognize wins. |

---

## 7. Scale the Giving (🌬 Wind)

**Kotter stage:** 7 — Scale giving

**Description:**
> **Scale giving.** We're close. How do we push to the finish? Multiply the momentum.
>
> **By move:** Wake Up — see where the momentum is; what's ready to spread. Clean Up — clear what slows the push. Grow Up — develop your ability to permeate and extend. Show Up — complete quests that build momentum.

| Move | Application |
|------|--------------|
| Wake Up | See where the momentum is; what's ready to spread. |
| Clean Up | Clear what slows the push. |
| Grow Up | Develop your ability to permeate and extend. |
| Show Up | Complete quests that build momentum. |

---

## 8. Anchor the Change (⛰ Mountain)

**Kotter stage:** 8 — Sustainable funding

**Description:**
> **Sustainable funding.** We made it. The goal is reached. Now anchor it: thank everyone, document what worked, set up for ongoing support.
>
> **By move:** Wake Up — see what's been built; what needs stewarding. Clean Up — clear loose ends; create closure. Grow Up — develop your ability to stabilize and institutionalize. Show Up — complete quests that anchor the win.

| Move | Application |
|------|--------------|
| Wake Up | See what's been built; what needs stewarding. |
| Clean Up | Clear loose ends; create closure. |
| Grow Up | Develop your ability to stabilize and institutionalize. |
| Show Up | Complete quests that anchor the win. |

---

## Data Source

- [data/bruised_banana_quest_map.json](../../data/bruised_banana_quest_map.json)
- Domain × Kotter: [.agent/context/kotter-by-domain.md](../../../.agent/context/kotter-by-domain.md)
- Kotter stages: [src/lib/kotter.ts](../../src/lib/kotter.ts)

## Next Step

Once approved, run the seed script to add these to the system:
```bash
npm run seed:quest-map
```
