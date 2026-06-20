# Strand consult: Mobility Quest Superpower Campaign — Six Game Master faces

**Question on the table (spec Open Q #2):** Are milestone **needs** counted as
**discrete actions** (`value: 1`) or **steward-weighted** (a Connector intro worth
more than a flyer drop)?

**Why it matters:** the unit choice decides whether scoped donation reads as
*solidarity* (every honest act counts) or *productivity accounting* (some people's
time is worth more) — which touches the project's core ethos: **emotional energy
is fuel, not judgment**, and the Portland community's allergy to extractive
gamification.

Faces deliver **observations / risks / recommendations**. **Sage** issues the
ruling + `tasks.md` deltas. Registers are the canonical
`FACE_HEALTHY_REGISTER` from `src/lib/quest-grammar/move-aspect.ts`.

---

## 1. Shaman — *in ritual, holding the container* (charge / terrain)

- **Observation:** A weight number on a human act is a **judgment spell**. The
  moment a Coach's "next honest step" is worth `0.5` and a Connector's intro is
  worth `3`, the player feels *ranked*. Charge leaks instantly.
- **Observation:** What people actually feel is **"did my act land?"** — not its
  point value. The milestone bar moving is the real ritual feedback.
- **Risk:** Weighting **medicalizes contribution** — turns metabolizing-as-fuel
  into a payroll table.
- **Recommendation:** Whatever the math, the **player-facing surface must read
  discrete and dignified**: "You took one scoped action. The milestone moved."
  Hide any weight from the contributor's view.

## 2. Architect — *by strategy and design* (the machine)

- **Observation:** Discrete-only (`value: 1`) **under-models reality**: a milestone
  like "Raise $2,400 for the move" cannot be satisfied by counting actions; a
  dollar is not an intro is not an hour.
- **Observation:** The clean model is **typed units, not arbitrary weights**: each
  need declares `unit ∈ { action | currency | hours }` and a `value` in that unit.
  The milestone aggregates **per unit**, never by summing across types.
- **Risk:** A single float `value` collapses "3 actions" and "$3" — silent
  category error in the contribution ledger.
- **Recommendation:** `MilestoneNeed { unit, value }`; default `unit:'action',
  value:1`. Stewards set `currency`/`hours` only where the milestone's own target
  is denominated that way. **No free-floating multiplier on actions.**

## 3. Challenger — *at the edge, naming the lever* (rupture)

- **Observation:** Steward-set weights become a **gameable leaderboard** the day
  someone notices intros pay triple — people farm the high-value need and starve
  the rest.
- **Risk:** Weighting **recreates the saviorism gradient** the inner/outer spec
  warns about: "valuable" external acts dwarf quiet internal self-allyship, so the
  internal orientation becomes worthless busywork. That **breaks the polarity**.
- **Risk:** Discrete-only **also** breaks — a campaign with one $5,000 need and
  forty 1-point needs shows a nonsense progress bar.
- **Recommendation:** Falsify both extremes. The only safe lever is **unit-typed,
  not weighted**: actions count actions, money counts money, hours count hours —
  and **internal-orientation needs are tracked on their own face**, never summed
  into the external dollar/hour bar.

## 4. Regent — *through clear roles and order* (phasing / gates)

- **Observation:** This is a **Phase 3/4 sequencing** call, not a day-one one.
  Phase 3 ships **action-only** needs (the safe default); units arrive with the
  Phase 4 schema.
- **Risk:** Letting stewards type arbitrary weights in Phase 3 (JSON) hard-codes a
  bad shape we then must migrate away from.
- **Phase gate:** Phase 3 = `unit:'action', value:1` **only**. Phase 4 introduces
  `unit` (+ `currency`/`hours`) behind the migration, reconciled with the existing
  `MilestoneContribution.value` + DSW/barn-raising `wallKey` money path.
- **Recommendation:** Definition of done for the unit work = a milestone can mix
  an action-need and a currency-need and render **two honest sub-bars**, never one
  blended number.

## 5. Diplomat — *in relationship, weaving care* (culture / onboarding)

- **Observation:** In Portland-allyship culture, **"every act counts equally" is a
  value statement**, not just a data model. Discrete framing *is* the solidarity
  message.
- **Risk:** Any visible hierarchy of worth excludes people who can only offer the
  "small" internal acts — the exact people the internal orientation is for.
- **Recommendation (copy):** Need cards say what the act *is* and *who it helps*,
  never a price. The reveal of contribution is **relational** ("the milestone
  moved because you showed up"), not transactional.
- **Recommendation:** Reconcile with **DSW** so money needs reuse the existing
  donation wizard's dignified language rather than a new "worth" vocabulary.

## 6. Sage — *in flow, holding the whole* (integration & RULING)

**Synthesis.** The faces converge: the discrete-vs-weighted framing is a **false
binary**. Shaman/Diplomat protect *dignity*; Architect/Challenger expose that one
float can't model money + acts + hours; Regent phases it. The whole is:

> **Unit-typed, never weighted. Discrete by default, denominated only when the
> milestone itself is.** Internal-orientation acts are tracked on their own face
> and never summed into an external money/hours bar.

**Ruling (resolves Open Q #2):**

1. A `MilestoneNeed` carries **`unit ∈ { action | currency | hours }`** and a
   `value` in that unit. **Default `unit:'action', value:1`.**
2. **No arbitrary action multipliers.** Stewards may not make one action "worth
   more" than another. They may only choose the *unit* that matches the
   milestone's own target.
3. A milestone **aggregates per unit** → renders honest sub-bars; it never blends
   units into one number.
4. **Player-facing surfaces are always discrete and dignified** (Shaman/Diplomat):
   the contributor sees "one scoped action; the milestone moved," not a score.
5. **Internal orientation is first-class** (Challenger): internal-allyship needs
   accrue on their own track and are **never** dwarfed by external dollar/hour
   totals — protecting the polarity.

**`tasks.md` deltas:**
- **Δ T3.2** — `MilestoneNeed` includes `unit` (`'action'|'currency'|'hours'`),
  default `action`/`value 1`; `listMilestoneNeedsForPlayer` returns unit so UI can
  group. No multiplier field.
- **Δ T3.3** — completion routes to the correct unit bucket; money needs reuse the
  **DSW / barn-raising** money path (`wallKey`), not a new ledger.
- **Δ T3.4** — needs UI groups by unit into separate sub-bars; **never** shows a
  per-act point value to the contributor.
- **Δ T4.2** — schema: `MilestoneNeed.unit String @default("action")` +
  `value Float @default(1)`; document the "no action multiplier" invariant.
- **New cross-cutting AC** — "No player-facing surface displays a per-action point
  value; internal-orientation contributions are tracked separately from external
  money/hours totals."

**Deferred (explicit):** cross-unit "equivalence" (e.g. 1 hour ≈ $X) — a judgment
the engine must not make. Out of scope; would violate *energy is fuel, not
judgment*.

**Open question raised by the council:** when a milestone has both an internal and
an external track, is internal progress shown to the campaign at large or kept
private to the player? (Lean: aggregate internal counts shown, individual internal
acts private.) → fold into spec Open Q.
