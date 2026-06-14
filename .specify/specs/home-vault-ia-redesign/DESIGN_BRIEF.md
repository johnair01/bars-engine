# Design Brief: Home / Vault IA Redesign

> **Audience:** Claude Design (and any human designer picking this up).
> **Status:** Brief — decisions locked via interview, ready for design exploration.
> **Author context:** Synthesized from a two-round Socratic interview with the creator (2026-06-14), grounded in the existing repo and these specs:
> - [`hand-vault-bounded-inventory`](../hand-vault-bounded-inventory/spec.md) — the Hand/Vault ontology this brief adopts
> - [`narrative-os-map-v0`](../narrative-os-map-v0/spec.md) + [`SIX_FACE_ANALYSIS.md`](../narrative-os-map-v0/SIX_FACE_ANALYSIS.md) — the spatial "OS map" world shell
> - [`bar-seed-metabolization`](../bar-seed-metabolization/spec.md) — the maturity-phase model

---

## 1. The Problem (felt, not just functional)

The current homepage and the page at `/hand` (which is **literally titled "Vault"** in code) are clunky. The capture form is too complicated and not ergonomic. Conceptually, **"hand," "inventory," and "vault" are the same thing today** — all are queries against `CustomBar` filtered by creator + status. There is no felt difference between *what I'm playing with right now* and *deep storage*.

The creator's north star, stated plainly in the interview:

> **Get people capturing ideas and metabolizing them as fast as possible.**

Everything below serves that velocity. The redesign is a **full information-architecture redesign**, not a reskin.

---

## 2. North-Star Principle

**Capture → Metabolize velocity is the only KPI that matters for this surface.**

- Capture must be **instant and always-available** (the single most important affordance).
- Every BAR must have **one obvious next move** toward maturity at all times.
- The daily charge ritual **guarantees at least one BAR per day** — it is the floor of the loop, not the ceiling.
- Friction is fuel, not failure (per CLAUDE.md ethos): the design metabolizes the user's friction into the next move rather than presenting an empty form.

---

## 3. Locked Decisions (from interview)

| # | Question | Decision | Confidence |
|---|----------|----------|------------|
| D1 | Inventory vs Vault | **Bounded Hand + overflow Vault.** Adopt the `hand-vault-bounded-inventory` spec: the Hand is a bounded in-world play set (Pokémon team); the Vault is unbounded out-of-world storage (Bill's PC). | Locked |
| D2 | Where does a BAR live as it matures? | **Location follows maturity.** A BAR's home changes as it grows. (See §4.) | Locked |
| D3 | Primary navigation shell | **Clean up the current top nav as the law-of-the-land, AND let the OS map be the spatial world surface — they are not competitors.** The creator finds the OS map "connected" but also wants the existing top nav simplified. Resolution mirrors `narrative-os-map-v0`: *top nav owns "where am I in the app," the Game Map owns "where am I in the world."* (See §6.) | Locked, with design latitude |
| D4 | Homepage's one job | **Capture-first, with the daily charge ritual and Hand visibility folded in.** The creator could not separate "capture / daily charge / your hand" — because the homepage should do all three as one integrated loop. Capture is the most important; the daily charge guarantees ≥1 BAR/day; the Hand must be visible so people know what they're holding. (See §7.) | Locked |

---

## 4. The Maturity → Location Map (the heart of D2)

A BAR has **5 maturity phases** today (`MATURITY_PHASES` in `src/lib/bar-seed-metabolization/types.ts`):

`captured → context_named → elaborated → shared_or_acted → integrated`

**Location follows maturity.** A raw seed is *not* found in the Garden — it's in your Inventory/Hand. A planted BAR-seed lives in the Garden. Proposed canonical mapping for design to render:

| Maturity phase | Felt state | Home location | Why |
|---|---|---|---|
| `captured` | raw seed, just dropped in | **Inventory / Hand** (or the capture inbox) | Not yet planted; it's something you're carrying. |
| `context_named` | named, given soil context | **Garden** (planted in a plot) | Now it has soil (`campaign` / `thread` / `holding_pen`) and can grow. |
| `elaborated` | actively tended, growing | **Garden** | Mid-growth; the tending surface. |
| `shared_or_acted` | ready to play / acted on | **Hand** (playable, brought into spatial rooms) | The well-specced BAR you carry into play. |
| `integrated` | graduated | **Quests / Adventures** (out of the nursery) | It's now a structure the player uses, not a seedling. |

> **Design note:** This makes the Garden the *growing* surface and the Hand the *playing* surface. The Vault is the **overflow** for anything that doesn't fit the bounded Hand — storage, not a stage. A seed can be carried in the Hand before it's planted; once planted it belongs to the Garden until it graduates.

**Open question for design:** the boundary between "captured/inbox" and "Hand slot" — does a fresh capture auto-occupy a Hand slot, or sit in an unbounded capture inbox until the user promotes it? (See §10, Q1.)

---

## 5. Hand vs Vault — the Bounded Inventory Model (D1)

Adopt [`hand-vault-bounded-inventory`](../hand-vault-bounded-inventory/spec.md) as-is. Summary for design:

- **Hand = 6 ordered slots** (hardcoded v1; slot 0 = the BAR currently being carried/active). Explicit membership via `HandSlot`, not a derived query.
- **Vault = everything active that is NOT in the Hand. Unbounded.** This is the answer to "what's the difference?": the Vault is **overflow storage you reach by leaving the play space**, not a workspace.
- **Pickup with full Hand → overflow modal**: two columns (current Hand + incoming BAR); pick one to deposit to Vault. Cancel → new BAR goes to Vault by default. Nothing is ever lost or forced.
- **Vault → Hand promotion** only happens when you leave play and enter the Vault page, and requires an empty slot. This creates the intended ceremony: *compost old work to make room for new.*

**Naming fix (do this first):** the route `/hand` is currently titled **"Vault."** That single mislabel is the source of most conceptual confusion. The page the player *plays from* is the **Hand**; the **Vault** is a distinct overflow destination. Rename so the route, the title, and the concept agree. See [`hand-vault-rename`](../hand-vault-rename/spec.md) if present.

---

## 6. Navigation: Two Truths, No Conflict (D3)

There are competing nav models in the repo. Resolution:

- **Top nav = "Where am I in the app?"** (the Regent's law of the land). Keep it, but clean it. Current items: `/` (Now) · `/hand` ("Vault") · `/event` (Events) · `/adventures` (Play). Proposed cleaned set — design to validate:
  - **Now** (home / the active loop — §7)
  - **Garden** (growing seeds — replaces the ambiguous "Vault" slot as the primary metabolization surface)
  - **Hand** (what you're carrying into play) — *with the Vault reachable from inside it as overflow*
  - **Play** (Adventures / spatial rooms)
  - **Events** (community)
- **OS Map = "Where am I in the world?"** The spatial shell (Library / Dojo / Forest / Forge from `narrative-os-map-v0`) is a *destination reachable from Play*, not a replacement for the top nav. Campaigns seed into the map; they don't own it.

**Six-face check (Regent):** there must be exactly **one** answer to "what is the primary shell." Top nav wins for v1; the OS map is world-exploration inside Play. Do not ship two primary shells.

---

## 7. The Homepage ("Now") Spec (D4)

The homepage is **the active loop**, not a dashboard. One screen, three integrated zones, capture dominant:

1. **Capture (dominant, always-on).** A single always-present capture affordance — one field/voice button, zero required fields to drop a seed. Speed over structure. The "complicated form" is replaced by *capture now, contextualize later* (the `captured → context_named` step happens as a follow-up move, not a blocking form). This is the most important element on the page.
2. **Daily Charge ritual (the guaranteed floor).** A daily check-in that reliably yields **≥1 BAR/day**. This is the engine that keeps the Garden fed even on low-energy days. Surface it as a single inviting ritual, not a chore list.
3. **Your Hand (ambient awareness).** A compact view of the ≤6 BARs you're carrying, each showing its **one next move** toward maturity. People must always know what's in their hand without leaving Now.

**The loop the homepage must make obvious:** *Capture a seed → (daily charge guarantees one) → see it in your Hand → take its one next move → it graduates into the Garden / Quests.*

---

## 8. The 5th Move — "Open Up" (must be reflected)

The move grammar is expanding from **4 → 5**. Today `WaveStage` in `src/lib/quest-grammar/types.ts` is **still only four**:

```ts
export type WaveStage = 'Wake' | 'Clean' | 'Grow' | 'Show'
```

The redesign must reflect **five moves: Wake · Open · Clean · Grow · Show** (Open Up inserted after Wake). Implications for design + a follow-on eng task:

- Anywhere the four moves are rendered as rooms/stages/throughput (`/game-map`, move panels, the wave-stage UI), leave room for the fifth.
- "Open Up" sits between *Wake Up* (notice the charge) and *Clean Up* (clear what's in the way) — design should give it a distinct felt register and color/altitude per the UI_COVENANT three-channel system.
- **Eng note (out of scope for design, flagged):** extending `WaveStage` is a typed change that ripples through `move-engine.ts` and quest grammar; it needs its own slice.

---

## 9. Six-Face Review of This Design

| Face | Reading |
|---|---|
| **Shaman** (felt field) | The Garden/Hand/Vault distinction gives each space a felt sense of place; capture-first keeps the emotional charge honest and immediate. |
| **Regent** (rules/sovereignty) | One primary shell (top nav); OS map is world-exploration, not a second law. Hand is a hard 6-slot rule; Vault is the lawful overflow. |
| **Challenger** (friction/honesty) | The honest cut is: rename `/hand`, ship the bounded Hand, make capture instant. Resist adding another campaign feature instead of fixing the world shell. Don't fake all five moves before `WaveStage` actually supports five. |
| **Architect** (structure) | Location-follows-maturity gives a clean state machine: capture→inventory, plant→garden, ready→hand, graduate→quests. `HandSlot` makes membership explicit, not derived. |
| **Diplomat** (relationship/community) | Daily charge + Events keep the social/ritual floor. Respect the Portland AI-allergy: the loop must work without AI (deterministic capture + manual tending), AI only accelerates. |
| **Sage** (meaning/integration) | The whole IA teaches the core teaching: ideas are composted, not hoarded. The Vault's scarcity pressure (6-slot Hand) *is* the lesson. |

---

## 10. Open Questions for Claude Design

1. **Capture inbox vs auto-Hand:** does a fresh `captured` BAR occupy a Hand slot immediately, or sit in an unbounded capture inbox until promoted? (Affects whether capture can ever be "full.")
2. **Garden plot model:** the Garden has soil kinds (`campaign / thread / holding_pen`). Should the homepage Garden glance show plots, or a flat "growing" list?
3. **Mobile-first?** "Capture on the fly" implies mobile capture is primary. Confirm the dominant form factor for the capture affordance.
4. **Daily charge → which move?** Does the daily charge always produce a `captured` seed, or can it advance an existing BAR's maturity?

---

## 11. Suggested First Slices (smallest honest cuts)

1. **Rename `/hand` so route/title/concept agree** (Hand is play; Vault is overflow). Pure clarity win, no new model.
2. **Bounded Hand (6 slots) + overflow modal** per `hand-vault-bounded-inventory`. Make the Hand real.
3. **Homepage "Now" v1:** dominant always-on capture + daily charge + ambient Hand strip.
4. **Garden as the maturity surface:** route `captured` seeds in, render the maturity→location map.
5. **(Eng, separate) Extend `WaveStage` to five** and surface "Open Up."

> Per project workflow: before authoring full spec kits from this brief, read `.agents/skills/spec-kit-translator/SKILL.md`, scaffold from `.specify/spec-template.md`, and add a **Verification Quest** for these user-facing changes.
