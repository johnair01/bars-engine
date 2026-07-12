# Inner Garden — User-Journey Data Flow (the daily loop is the game)

> **A deliberate inversion.** The rest of the handoff set modeled the *machine* (gate
> confrontation, demonstration, crafting). This doc starts from the **person and the day**,
> derives the data flow from the journey, and only then names the objects. Built from the
> practitioner's own answers (2026-07-12).
>
> **The punchline up front:** the daily practice loop is the primary experience — the quest
> economy is the *deep end* a user visits occasionally. That daily loop is **~70% built but
> not connected into one growing flow**, and the disconnected/missing pieces are exactly the
> three things the user needs to *feel* growing: **capacity, output, relief.**

---

## 0. The unified user — "the Game Master is also a player"

There is one actor, at two altitudes. The practitioner runs the **same daily loop as a
player** (metabolizing their own charges); when their own moves prove out, they **graduate
into the curriculum** others learn from. Authoring is not a separate mode — *you author by
playing well.* The promotion pipeline we built (`candidate → demonstrated → adopted →
canonical`) is exactly this bridge from personal play to teaching content.

**Status:** the identity claim is **not modeled** — the six Faces are framed as teachers,
not as "the GM is also a player," and the `personal → community → canonical` promotion
exists only as spec fragments (`allyship-technique-vocabulary`), not wired to the daily loop.

---

## 1. A day in the life (the atomic unit)

**Day 1 — arrival.** Open the app → **free write** (dump the morning charge). Out of that
write, two things can emerge:
- **(a) tasks** → commit up to **5**, each laddered to a **weekly goal**;
- **(b) a charge** → capture it as a **BARseed**, **plant** it, **water** it.
Then get oriented to the basic moves. *What they see:* their first seed in a small plot,
their 5 committed tasks. *Why they return:* they did one honest thing and it's visible.

**Day 2 — the rhythm begins.** **Water** yesterday's seeds. Free-write again → **plant the
new day's seeds** and commit today's tasks. **Compost** the seeds/tasks that didn't get
done yesterday (no guilt — this is the relief). *What they see:* a farm with a little
history — some growth, some compost, today's fresh commitments.

**Week 1 → Month 1.** The loop repeats daily. Along the way a task hits a **blocker they
can't clear** → it becomes a **quest** (the deep end) → they earn a **technique** → their
**deck grows**. Completed tasks and harvested fruit pile up (**output**). The compost pile
grows (**relief**). Their capacity visibly expands: *"I can handle what used to block me."*

**Month 3.** One charge, watered from many angles, grows too big to hold alone → it
**becomes a campaign** others tend. Inner work has become shared impact.

---

## 2. The daily loop as ONE flow (with real object homes)

```
DAILY FREE WRITE  ── TapTheVeinDailySession.rawEntry (+wordCount)
   │  analyzed for charge ── eaChannel / chargeStrength  ⚠ DEAD SCHEMA (never written/read)
   ├─(a) TASKS emerge ─────→ commit ≤5 ── TapTheVeinTask (MAX_TASKS_PER_DAY=5),
   │                                        laddered to weekly LensGoal (lensGoalId)
   └─(b) CHARGE emerges ───→ BARseed (CustomBar charge_capture) → PLANT (writePlantTriadToBar)
                              ⚠ NOT one flow — charge capture is a SEPARATE parallel ritual today

DAILY TENDING
   ├─ complete a task ─────→ OUTPUT (done)   ⚠ completion does NOT roll up to the weekly goal
   ├─ water a seed (1/day) → charge grows     ⚠ NO water cadence in the engine (prototype only)
   └─ blocked task ───────→ QUEST (gate confrontation) → earn TECHNIQUE (capacity ↑)
                              ✅ ontology built  ⚠ not wired to the TTV task

NEXT DAY
   └─ unaccomplished ─────→ COMPOST (relief) | CARRY (explicit)
                              ⚠ MANUAL only — no auto-sweep of yesterday's incompletes

ROLL-UP (the growth spine)
   daily → weekly → monthly → quarterly → yearly  ── Lens.parentLensId / LensGoal.parentGoalId
                              ⚠ DISPLAY-ONLY quest COUNT (getGoalRollup); completion never rolls up

90 DAYS
   a charge watered from six faces → CAMPAIGN  ── promoteCampaignBarToInstance  ✅ built
```

---

## 3. The three growth axes — what the user must SEE accumulating

The user named these as the month-1 spine. Each has a data home and a specific gap:

| Axis | The felt promise | Data home | Gap that blocks the feeling |
|---|---|---|---|
| **Capacity** | "I can handle what used to block me" | owned techniques (the deck) | earning-from-quests is **not wired** to the TTV task loop |
| **Output** | a visible trail of what I produced | completed `TapTheVeinTask` + harvested fruit | **fruit isn't a first-class object**; completion doesn't aggregate |
| **Relief** | lighter load over time | compost (`compostReason`/`CompostLedger`) | **no daily auto-compost**; relief is manual, so it isn't felt as a rhythm |

**Belonging** (witnessed in a commons) is the user's month-3 axis, delivered by campaign birth
+ the commons — deliberately later.

---

## 4. The cadence hierarchy IS the growth (not a feature — the spine)

The same **free-write → emerge → commit** ritual runs at every Lens cadence
(daily/weekly/monthly/quarterly/yearly), and lower cadences **ladder up** into higher goals.
This is the temporal growth model — a user's development *is* their nested horizons filling
over 90 days.

**The critical gap:** roll-up today is a **display-only count** of quests hanging under a
goal (`getGoalRollup`) — completing a daily task **does not advance its weekly goal**. So the
single most important "growth over time" signal — *horizons visibly filling as I do the
work* — is **not tracked**. `LensGoal.metric`/`alignmentType` exist but nothing computes
progress against them.

---

## 5. Why it doesn't yet feel like one growing system (the honest diagnosis)

Six gaps, and note what they have in common — **they are all connective tissue and growth,
not new mechanics:**

1. **The free-write fork isn't one flow.** "Tasks emerge OR a charge emerges" is two
   separate rituals in code (TTV brainstorm vs. `charge-capture.ts`), not one branch. The
   hook to unify them — `eaChannel`/`chargeStrength` on the daily session — is **dead schema**.
2. **Completion doesn't roll up.** Daily task done ↛ weekly-goal progress. The growth spine
   is inert.
3. **No water cadence in the engine.** The once-a-day tending rhythm exists only in the
   throwaway prototype.
4. **No auto-compost.** Yesterday's incompletes don't compost themselves; relief is a manual
   chore, not a felt daily lightening.
5. **Capacity isn't wired to the loop.** The whole gate→technique economy we built isn't yet
   triggered from a blocked daily task.
6. **GM-is-also-a-player is unmodeled.** No path marks a practitioner's proven artifact as
   promotable into shared curriculum from within the daily loop.

**The reframe for prioritization:** we spent this session building the **deep end**
(charge → gate → technique → fruit → campaign). It's sound. But the **primary daily
experience** — free write → commit 5 → tend → compost → roll up — is a *different, mostly-built
but disconnected system* (Tap the Vein + Lens), and the **growth the user wants felt lives in
the connections and the roll-up**, which are exactly the gaps. More deep-end mechanics won't
move the needle; **wiring the daily loop into one growing flow will.**

---

## 6. What to build to make it ONE growing flow (derived from the journey)

Ordered by leverage on the felt experience — each is connective, not net-new machinery:

1. **Unify the free-write fork.** Make the daily session's write branch to *both* task
   brainstorm and charge capture, using the (currently dead) `eaChannel`/`chargeStrength`
   analysis to detect and route a charge → BARseed. One entry point, two exits.
2. **Roll completion UP.** When a daily task/quest completes, advance its weekly
   `LensGoal` progress; roll weekly→monthly→… So horizons visibly fill. (Turns the
   display-only count into real progress — the growth signal.)
3. **Add the water cadence** server-side (a `lastWateredAt` on the seed + once/day rule),
   so tending is a real daily rhythm, and wire it to seed maturity.
4. **Auto-compost yesterday's incompletes** (with the honest, no-shame framing already in
   `compostReason`) so relief is a felt daily lightening, not a chore.
5. **Wire capacity to the loop.** A blocked daily task → `upgradeToQuest` → gate confrontation
   (the ontology lib) → earn a technique. Connect TTV's `upgraded_to_quest` to the gate model.
6. **Model GM-is-also-a-player.** A promotion surface in the daily loop: mark a proven
   personal technique/insight as promotable (`personal → community → canonical`), closing the
   play→author loop.

**Note the throughline:** items 1–4 are the *daily loop* (the 95% experience); item 5 connects
it to the *deep end* we already built; item 6 closes the practitioner-player identity. This is
the "model how the data flows and grows and meets the user's needs" work — and it's mostly
*connection and accrual*, because the pieces already exist.

---

### Appendix — object map (grounded)
- Free write / daily session: `TapTheVeinDailySession` (`rawEntry`, `wordCount`, `lensLevel`,
  `eaChannel`⚠dead, `chargeStrength`⚠dead); `saveBrainstorm` (`tap-the-vein.ts:318`).
- Tasks: `TapTheVeinTask` (status `committed→completed|carried_over|composted|
  assigned_to_campaign|upgraded_to_quest`; `lensGoalId`, `questId`, `barId`); `commitTask`,
  `MAX_TASKS_PER_DAY=5`; born-as-quest via `mintQuestFromText`.
- Charge (separate today): `charge-capture.ts` `createChargeBar` (type `charge_capture`,
  1/day), `run321FromCharge`.
- Plant: `writePlantTriadToBar` (`garden/plant.ts`); `plantTask`.
- Lens: `Lens`/`LensGoal` (`parentLensId`/`parentGoalId`, `cadence`); descent in
  `lens-goals.ts`; roll-up display `getGoalRollup` (`quests.ts:178`).
- Compost: `updateTaskStatus('composted')`, `carryTask`; `runVaultCompost` + `CompostLedger`.
- Campaign birth: `promoteCampaignBarToInstance` (`campaign-bar.ts`).
- The deep-end economy (built this session): `src/lib/inner-garden/ontology/*`.
</content>
