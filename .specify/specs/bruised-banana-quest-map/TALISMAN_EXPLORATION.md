# Talisman & Blessed Object Inventory — Design Exploration

**Prompt:** Explore what a talisman is. The "primary card = talisman" may over-weight one thing. Blessed object inventory intrigues. Talisman per stage = incentive to go through the whole process. Completed campaign raises maturity of all players.

---

## 1. Talisman: What Is It?

**Current over-weight:** Making "the primary card" a talisman puts too much importance on one UI element. A talisman should be a **thing you earn and keep**, not the whole dashboard.

**Reframe:** A talisman is a **blessed object you've earned** — sacred, portable, with provenance. It goes in your **blessed object inventory**. The dashboard shows your inventory; it doesn't become the talisman.

**Existing lore:** The blessed object story (blessed_object/start) defines a blessed object as "something that carries personal meaning and positive energy." Personal choice. You bring it. **Talismans** are the earned counterpart: the campaign blesses you with an object when you complete meaningful work at a stage.

---

## 2. Blessed Object Inventory

**Concept:** A player has an inventory of sacred objects. Two sources:

| Source | What | When |
|--------|------|------|
| **Personal** | Your chosen blessed object | Onboarding (blessed object story). You name it, bring it. |
| **Earned** | Stage talismans | Complete meaningful work at each Kotter stage. One per stage. |

**Inventory =** Personal object + up to 8 stage talismans (from campaigns you've participated in). Light skeuomorphism: each object has an icon, a name, provenance (which campaign, which stage).

**UI:** A "Blessed Objects" or "Reliquary" view. Not the dashboard center — a place you visit. Tap avatar → Reliquary. Or a nav item. Scarce, potent. You don't need to see it every time; you know it's there.

---

## 3. Talisman Per Stage — Incentive Structure

**Problem:** Players race to the finish (donate, hit Stage 8) and skip Stages 1–7. The campaign becomes a sprint, not a journey.

**Solution:** One talisman "up for grabs" per stage. To earn it, you must **meaningfully participate** in that stage.

| Stage | Talisman | Earning criteria (draft) |
|-------|----------|---------------------------|
| 1 | Talisman of Urgency | Complete 1+ quest at Stage 1, or contribute a lore BAR about urgency |
| 2 | Talisman of Coalition | Complete 1+ quest at Stage 2 |
| 3 | Talisman of Vision | Complete 1+ quest at Stage 3 |
| 4 | Talisman of the Word | Complete 1+ quest at Stage 4 |
| 5 | Talisman of the Threshold | Complete 1+ quest at Stage 5 |
| 6 | Talisman of the First Win | Complete 1+ quest at Stage 6 |
| 7 | Talisman of Momentum | Complete 1+ quest at Stage 7 |
| 8 | Talisman of the Anchor | Complete 1+ quest at Stage 8, or donate |

**"Up for grabs":** Everyone who meets the criteria earns it. Not first-come. The talisman is a marker of participation, not a scarce trophy. The incentive is **to go through the whole process** — if you want the full set, you show up at each stage.

**Alternative:** "Up for grabs" could mean limited (e.g. first 10 per stage) to create urgency. That might encourage racing within a stage. Design choice: inclusive (everyone who participates) vs. scarce (first N).

---

## 4. Campaign Completion → Maturity for All

**Idea:** When a campaign completes (goal reached, Stage 8 anchored), **all players who participated** get a maturity boost. The collective journey elevates everyone.

**Maturity:** Developmental level (Integral Theory, Laloux). Stored in `player.storyProgress` or a new field. Used for personalization (orientation, quest assignment). Teal = seeing the whole system.

**Mechanic:**
- Campaign ends (instance.status = 'completed' or goal reached).
- Query: Players who completed at least 1 quest in this instance, or donated, or contributed lore.
- For each: Increment maturity signal, or set "campaignsCompleted" count, or add to storyProgress.
- Narrative: "The Bruised Banana campaign is complete. All who journeyed with it have been changed."

**Effect:** Completing a campaign is a **collective rite**. Not just "I got my talismans" — "We did this together, and we're all a little more capable now."

---

## 5. Dashboard Implications

**Before:** Primary card = talisman (over-weight).

**After:** 
- Dashboard = focus on what's now (current quest, campaign stage). Not a talisman — just the work.
- **Blessed object inventory** = separate place. Reliquary. You visit when you want to see what you've earned, what you carry.
- Talismans don't dominate the home screen. They're a reward layer, a collection, a record of the journey.

**Deftness:** The dashboard answers "What now?" The reliquary answers "What have I become?" Both matter; they're different questions.

---

## 6. Schema / Model Sketch

**Talisman (or BlessedObjectEarned):**
- id, playerId, instanceId, kotterStage, earnedAt
- source: 'stage_talisman' | 'personal' | 'campaign_completion'
- name: "Talisman of Urgency" (or from config)
- metadata: questId, loreBarId (provenance)

**Earning logic:**
- On quest completion: Check if quest.kotterStage matches instance current stage (or stage when completed). Check if player has already earned this stage's talisman for this instance. If not, create Talisman record.
- On campaign completion: Create maturity/participation record for all participants.

**Personal blessed object:** Could be a Talisman with source: 'personal', no instanceId. Or a separate PlayerBlessedObject. Or stored in storyProgress from the blessed object story.

---

## 7. Open Questions

1. **Earning threshold:** One quest per stage enough? Or "contribute meaningfully" (admin attest, or N quests)?
2. **Scarcity:** Everyone who participates, or first N per stage?
3. **Maturity storage:** New field? storyProgress JSON? What does "maturity boost" mean mechanically?
4. **Naming:** Talisman of Urgency vs. "⚡ Urgency" (symbol) vs. stage-specific poetic names?
5. **Personal blessed object:** Does it live in the same inventory as stage talismans? One "Reliquary" with both?

---

## 8. Summary

| Concept | Resolution |
|---------|------------|
| **Talisman** | Earned blessed object. Not the dashboard. Goes in inventory. |
| **Blessed object inventory** | Reliquary. Personal object + stage talismans. Visit, don't dominate. |
| **Talisman per stage** | 8 talismans per campaign. Earn by participating at each stage. Incentive to journey, not race. |
| **Campaign completion** | All participants get maturity boost. Collective rite. |
| **Dashboard** | Focus on "What now?" Reliquary on "What have I become?" |
