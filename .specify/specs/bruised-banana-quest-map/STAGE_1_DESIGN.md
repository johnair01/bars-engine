# Stage 1 Design: Rally the Urgency

**Context:** $3000 goal, 30-day timeline. We're in Stage 1. This doc answers: What quests exist? How do players interface? How long does it last? When is it mature?

---

## 1. What quests need to be present for Stage 1?

### Container (always present)

| ID | Title | Role | Pickupable? |
|----|-------|------|-------------|
| Q-MAP-1 | Rally the Urgency | Scaffold; players add subquests under it | No — it's a hub |

The container is **not** meant to be picked up and completed. It's a parent. Players interact with it by adding subquests (createSubQuest) or by picking up starter subquests that live under it.

### Starter subquests (seed with quest map)

Pre-seed 3–4 concrete quests under Q-MAP-1 so players have something to do immediately. Each maps to a move:

| ID | Title | Move | Description |
|----|-------|------|-------------|
| Q-MAP-1-WAKE | Name What's at Stake | wakeUp | See and name what makes this moment critical. Share one thing that's at stake for the Bruised Banana Residency. |
| Q-MAP-1-CLEAN | Clear What Blocks the Urgency | cleanUp | What blocks you from naming or feeling the urgency? Name it. Do one thing to unblock. |
| Q-MAP-1-GROW | Practice Naming Stakes | growUp | Develop your ability to name stakes. Tell one person why this matters, in one sentence. |
| Q-MAP-1-SHOW | Create Urgency for One Person | showUp | Bring one person into the urgency. Share the story, the goal, or the ask. |

**Alternative:** Fewer starters (e.g. 2) to keep the Market uncluttered. Players can always add more via createSubQuest.

**Schema note:** Starter subquests need `parentId: Q-MAP-1`, `kotterStage: 1`, `visibility: 'public'`, `allyshipDomain: 'GATHERING_RESOURCES'` to appear in Market when instance is at stage 1.

---

## 2. How do players interface with Stage 1?

### Flow A: Pick up a starter quest

1. Player goes to **Market** (Available Bars).
2. Market shows: Rally the Urgency (container) + 4 starter subquests (filtered by `instance.kotterStage === 1`).
3. Player clicks a starter quest → **Accept** → `pickupMarketQuest(questId)`.
4. Quest moves to player's **hand** (active quest).
5. Player completes quest (inputs, submit) → vibeulons minted.

### Flow B: Add a custom subquest

1. Player has at least 1 vibeulon.
2. From Market or quest detail: **Add subquest** under Rally the Urgency.
3. `createSubQuest(parentId: Q-MAP-1, { title, description })` — costs 1 vibeulon.
4. New subquest is created, assigned to player, `visibility: 'private'`.
5. Player completes their custom subquest → vibeulons.

### Flow C: View the container (no pickup)

- Rally the Urgency appears in Market as a **card** or **section header**.
- UI could show: "Rally the Urgency — Add subquests or pick up a starter below."
- Container is **not** pickupable (`maxAssignments: 0` or `isSystem` + special handling).
- Or: container is pickupable but "completion" = admin advances stage (unusual).

**Recommended:** Container is display-only. Add an "Add subquest" button that calls createSubQuest with parentId = Q-MAP-1. Starters are pickupable.

---

## 3. How long does Stage 1 last?

**Answer:** Admin-decided, with guidance from thresholds.

### Option A: Milestone-based (from THRESHOLDS.md)

| Stage | Donation % | Backlog / Quests | Notes |
|-------|------------|------------------|-------|
| 1 | 0% | 0 | Launch |
| 2 | ~15% | 3+ | Allies engaged |

Stage 1 lasts until we're ready for Stage 2: ~15% of goal (~$450) + 3+ "backlog items." For fundraiser, "backlog items" could mean:
- 3+ quests completed at stage 1, or
- 3+ donors, or
- Admin judgment: "enough urgency created."

### Option B: Time-based (30-day split)

- 30 days ÷ 8 stages ≈ 3–4 days per stage.
- Stage 1 = days 1–4 (or 1–3).
- Admin can advance early if milestones hit, or hold if not.

### Option C: Hybrid

- Suggest ~3–4 days for Stage 1.
- Advance when: (a) time elapsed, or (b) ~15% donation + 3+ quests completed, whichever feels right.
- Admin makes the call in Admin → Instances → kotterStage.

---

## 4. How do we know Stage 1 has reached maturity?

**Maturity = ready to advance to Stage 2.**

### Signals (admin uses as guidance)

| Signal | Threshold | How to check |
|--------|-----------|--------------|
| Donation progress | ~15% ($450) | `instance.currentAmountCents` |
| Urgency quests completed | 3+ | Count PlayerQuest where quest.parentId = Q-MAP-1, status = completed |
| Coalition forming | First allies | Donors, or players who completed stage-1 quests |
| Time | 3–4 days | `instance.startDate` + now |

### Admin action

1. Go to Admin → Instances.
2. Select Bruised Banana.
3. Advance `kotterStage` from 1 to 2.
4. Market now shows "Build the Coalition" (Q-MAP-2) + its starters.

### Optional: Stage maturity UI

- Event page or Admin could show: "Stage 1 maturity: 2/3 quests, 10% ($300)."
- Not required for v1; admin can track manually.

---

## Summary: Stage 1 Checklist

| Question | Answer |
|----------|--------|
| **What quests?** | Container (Q-MAP-1) + 4 starter subquests (Q-MAP-1-WAKE, -CLEAN, -GROW, -SHOW). |
| **Player flow?** | Market → Accept starter, or Add subquest under container. Complete → vibeulons. |
| **Duration?** | ~3–4 days (time-based) or until ~15% + 3 quests (milestone-based). Admin decides. |
| **Maturity?** | ~15% donation, 3+ quests completed, coalition forming. Admin advances kotterStage. |

---

## Data to add to seed

Add to `data/bruised_banana_quest_map.json`:

```json
"starterQuests": {
  "1": [
    { "id": "Q-MAP-1-WAKE", "title": "Name What's at Stake", "moveType": "wakeUp", "description": "..." },
    { "id": "Q-MAP-1-CLEAN", "title": "Clear What Blocks the Urgency", "moveType": "cleanUp", "description": "..." },
    { "id": "Q-MAP-1-GROW", "title": "Practice Naming Stakes", "moveType": "growUp", "description": "..." },
    { "id": "Q-MAP-1-SHOW", "title": "Create Urgency for One Person", "moveType": "showUp", "description": "..." }
  ]
}
```

Seed script creates these as children of Q-MAP-1, with `visibility: 'public'`, `kotterStage: 1`.
