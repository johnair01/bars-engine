# Spec: Charge capture — personal move commitment & downstream alignment

## Purpose

Players expect **Wake Up / Clean Up / Grow Up / Show Up** to be a **meaningful fork** in the system: the move they stand in should **shape** what gets created next (BAR, quest, daemon fuel, vibeulon mint metadata) and **connect** to **campaign milestones** (e.g. Bruised Banana Kotter stage, gameboard placement, Partiful-attended events).

**Today that fork is largely implicit or cosmetic** — the UI sometimes *names* moves on generated suggestions, but the **capture step does not persist a chosen move**, and the **charge → quest generator** ranks moves by **emotion channel**, not by player-selected move.

**Practice:** Deftness — dual-track (deterministic rules first); no fake alignment; vault/campaign constraints stay honest ([vault-page-experience](../vault-page-experience/spec.md), [bruised-banana-milestone-throughput](../bruised-banana-milestone-throughput/spec.md)).

### Resolved: capture vs 321 (product)

- **Capture = intent** — Player declares **personal move** (Wake / Clean / Grow / Show) + emotion/voltage as *where they’re standing now*.
- **321 = refinement** — Shadow process **refines** quest/BAR copy, aligned action, and metadata; it does **not** replace move unless the player **explicitly** changes stance after 321 (UX TBD). Merge rule: **321 narrows meaning; capture supplies default move** for generator + economy traceability.

**Sage + Architect consult (offline synthesis):** [SAGE_ARCHITECT_CONSULT.md](./SAGE_ARCHITECT_CONSULT.md) — Partiful/event binding (Architect), vibeulon policy (Sage), active BB `Instance` reference.

---

## Problem statement (confirmed in codebase)

| Area | What exists | Gap |
|------|-------------|-----|
| **Capture payload** | [`CreateChargeBarPayload`](../../src/actions/charge-capture.ts) — `summary`, `emotion_channel`, `intensity`, `satisfaction`, `context_note` | **No `personal_move` / `moveType`** (or equivalent) stored on the charge BAR `inputs`. |
| **Capture UI** | [`ChargeCaptureForm`](../../src/components/charge-capture/ChargeCaptureForm.tsx) — emotion grid + text + optional intensity/satisfaction | **No four-move picker**; `MOVE_LABELS` only used for **display** after suggestion generation. |
| **Quest suggestions** | [`generateQuestSuggestions`](../../src/lib/charge-quest-generator/generator.ts) | Move **order** comes from **`EMOTION_MOVE_BIAS[emotion]`**, not user choice. |
| **Quest from suggestion** | [`createQuestFromSuggestion`](../../src/actions/charge-capture.ts) — sets `moveType` on created quest from **suggestion** | Suggestion move is **emission-order**, not “I chose Wake Up at capture.” |
| **Transition ceremony** | [`TransitionCeremony`](../../src/components/charge-capture/TransitionCeremony.tsx) — scene + Kotter | Does **not** surface **personal move** (only scene label + Kotter stage). |
| **321 → BAR / quest / fuel** | [`Shadow321Runner`](../../src/app/shadow/321/Shadow321Runner.tsx), [`charge-metabolism`](../../src/actions/charge-metabolism.ts), [`fuelSystemFrom321`](../../src/actions/charge-metabolism.ts) | **Needs audit:** ensure `Metadata321` / mint / daemon paths can carry **committed move** when user completes 321 after charge; **campaign placement** (`campaignRef`, `kotterStage`) may be missing from “create quest aligned with 321 + milestone.” |

**Net:** The system **does not treat “which of the four moves?” as a first-class input** at capture time, so it cannot consistently drive BAR, quest grammar, daemon, or vibeulon **fuel** as a *single coherent thread*.

---

## User stories

### P1 — Choose move at capture

**As a** player capturing a charge, **I want** to **pick one** of Wake Up / Clean Up / Grow Up / Show Up (or confirm a default), **so** the system knows **how I’m metabolizing** this charge.

**Acceptance:** Charge BAR `inputs` JSON includes `personal_move` (or `move_type` aligned with `CustomBar.moveType` vocabulary: `wake_up` | `clean_up` | `grow_up` | `show_up`). UI makes the choice explicit.

### P2 — Suggestions respect the move

**As a** player who chose **Clean Up**, **I want** Explore / quest suggestions to **prioritize** that move (or anchor the first suggestion on it), **not** only reorder by emotion.

**Acceptance:** `generateQuestSuggestions` takes **declared move** from charge inputs; ordering rules documented; emotion can **nudge** copy or secondary suggestions, not override committed move without a deliberate “override” UX (see Open questions).

### P3 — 321 + quest + campaign milestone

**As a** player stuck on a project, **I want** to run **321** with my charge as context, then **create a quest** that **inherits** 321 metadata **and** can be **placed** toward a **Bruised Banana** (or active instance) milestone — e.g. subquest on gameboard or stage-aligned container.

**Acceptance:** Documented pipeline: `chargeBarId` → 321 → quest wizard / placement → `addQuestToCampaign` or thread with `campaignRef` resolved; ties to [game-loop-bars-quest-thread-campaign](../game-loop-bars-quest-thread-campaign/spec.md) and [bruised-banana-milestone-throughput](../bruised-banana-milestone-throughput/spec.md).

### P4 — Daemon & vibeulon fuel

**As a** player, **I want** mint / daemon awakening paths to **record** which move was active when fuel was created, **so** analytics and future GM tools respect the four-move frame.

**Acceptance:** `VibulonEvent` / daemon metadata (or related tables) includes `personal_move` or `moveType` when sourced from charge or 321; **no** fake attribution.

---

## Non-goals (v1)

- Replacing emotion channel — it remains useful for **alchemy** and **language**; this spec **adds** move commitment, not remove emotion.
- Full AI re-ranking of quests — template + rules first.
- Partiful **API** implementation — may be **documentation + hook points** until credentials/flows exist.

---

## Dependencies

| Spec | Relationship |
|------|----------------|
| [charge-capture-ux-micro-interaction](../charge-capture-ux-micro-interaction/spec.md) | Capture UX baseline; extend with move picker. |
| [bruised-banana-milestone-throughput](../bruised-banana-milestone-throughput/spec.md) | Guided actions → placement; this spec feeds **move-aware** quest creation. |
| [game-loop-bars-quest-thread-campaign](../game-loop-bars-quest-thread-campaign/spec.md) | Placement contracts. |
| [individuation-engine](../individuation-engine/spec.md) | Transition ceremony / scene — may extend to show move. |

---

## Decisions & open questions

**Decided**

1. **321 timing:** **Capture = intent; 321 = refinement** (see above). Optional post-321 move change = explicit UX only.
2. **Precedence (emotion vs move):** **Move wins** for template ordering / quest anchor; **emotion** flavors copy and secondary suggestions. Optional **“tension”** line when emotion and move pull different ways (v2 copy).
3. **Partiful / “counts toward event X” (Architect-aligned):** **Quests count** via **`Instance` + `campaignRef` + placement** (gameboard/thread). **Events** link to that **`Instance`** via existing **event-campaign / artifact** patterns; **player** fields only for **attribution** (e.g. came from link), not primary eligibility. Details: [SAGE_ARCHITECT_CONSULT.md](./SAGE_ARCHITECT_CONSULT.md) §1.
4. **Vibeulons (Sage-aligned):** **v1 = metadata + labels + analytics** on mint (record `personal_move`, source); **amount multipliers by move** only after telemetry + Regent review — see [SAGE_ARCHITECT_CONSULT.md](./SAGE_ARCHITECT_CONSULT.md) §2.

**Still open**

1. **Optional vs required move at capture:** Required vs defaulted from compass / last session (recommend: default + one tap to change).
2. **Partiful API:** Docs-only hooks + query params until partner API; see consult doc.

---

## Acceptance (release gate)

- [ ] Charge stores `personal_move`; generator + create-quest path use it.
- [ ] At least one **end-to-end** path documented: charge → 321 → quest → campaign placement with `campaignRef`.
- [ ] `npm run build` && `npm run check` pass.
- [ ] Playtest: player can name **which move** they chose and see it **in the created quest** (or in vault detail).

---

## Changelog

| Date | |
|------|--|
| 2026-03-22 | Initial spec — confirmed gap: no move on capture; generator uses emotion bias only. |
| 2026-03-22 | Capture=intent / 321=refinement; SAGE_ARCHITECT_CONSULT.md; decided precedence, events, vibeulons v1. |
