# Six GM Faces — Deliberation on `hand-vault-capture-movement`

> Convened on [spec.md](./spec.md) + the open questions in [plan.md](./plan.md). Faces per [specs/doctrine/gm-faces.md](../../../specs/doctrine/gm-faces.md). Each face is a lens; verdicts and the residual forks for the human are at the bottom.

## GM Face Routing

**Primary Face**: Systems Architect — the dominant work is wiring an existing model/action layer into capture + three UI surfaces with no schema change.

**Secondary Faces**: Ontologist (Hand/Vault/Garden vocabulary), Experience Designer (overflow friction on an immersive canvas).

**Review Faces**: Encounter Designer, Steward, Integrator.

---

## Ontologist — *does this object already exist under another name?*

- **Location vs maturity is a real category split, and the spec under-handles it.** A `CustomBar` has **maturity** (`captured → context_named → elaborated → shared_or_acted → integrated`) *and* a **location** (Hand iff a `HandSlot` binds it; otherwise Vault). But the home-vault IA defines a **Garden**: `context_named`/`elaborated` BARs are *planted* and surface under Garden (`NowHome.fetchBarCounts` counts them separately, not as Vault). So "Vault" in storage terms (no `HandSlot`) actually spans **two felt places — Vault and Garden.** The spec's binary "Hold in Hand / Return to Vault" silently lets a player yank a *planted Garden seed* into the Hand and, on return, drop it back into a "Vault" the UI never showed it in. **→ Decide the movement toggle's eligibility by maturity (see Fork B).**
- **"Vault" vocabulary collides with a pending rename.** [`hand-vault-rename`](../hand-vault-rename/spec.md) is reworking `/hand` route/title/concept ("the page you play from is the Hand; the Vault is overflow reachable from it"). Hard-coding "Return to Vault" copy now risks re-mislabeling. **→ Centralize the two strings (`HOLD_IN_HAND`, `RETURN_TO_VAULT`) in one constant the rename can repoint.**
- **Naming verdict on the actions is clean.** "Hold in Hand" / "Return to Vault" are good ritual verbs and do *not* collide with **Compost** (which archives via `archivedAt`). Keep them, but the UI must visibly differ from the compost affordance so "Return to Vault" never reads as destruction.

## Systems Architect — *fit into existing architecture; migration safety*

- **No schema change — endorsed.** `HandSlot` already encodes location; a `CustomBar.location` column would create a second source of truth that can disagree with the join table. Reject the issue's `location` suggestion explicitly (spec already does).
- **Return-shape change to `captureBarFromCanvas` is safe:** single caller (`SeedCaptureWhiteboard.tsx:1529`). But note **`bar-capture-consolidation` is concurrently editing this same action** (adds `title`, a Captured overlay state, Tune path). **→ Coordinate: land on one return type** `{ barId, title, placedIn, overflow? }` so the two kits don't stomp each other.
- **Import boundary confirmed:** pull `addBarToHandForPlayer` from `@/lib/hand-service` (plain module), *not* the `'use server'` `actions/hand.ts` — the cross-`'use server'` import rule is documented at the top of `hand-service.ts`. Plan already says this.
- **Drop the new `getBarHandState` action.** The BAR detail page is a server component; it can read `HandSlot` inline and pass `inHand`/`handFull` as props to the client `HandLocationToggle`. One fewer server action, no new round-trip. (List rows already render server-side too — pass the flag down.) **→ Simplification: compute in the server component, not a new action.**
- **Concurrency:** `addBarToHandForPlayer` does `findMany` → `upsert` on `(playerId, slotIndex)`. Two near-simultaneous captures could target the same empty slot; the unique constraint will make the second `upsert` overwrite rather than error, so one capture could lose its slot. Single-user risk is low, but **note it** — a `$transaction` around find+upsert would harden it if it ever bites.

## Experience Designer — *ritual vs. paperwork; the gift of context at the right moment*

- **Forcing an overflow modal on the whiteboard is paperwork at the wrong moment.** The whiteboard is a full-bleed, immersive "make something" canvas. A power-capturer with a full Hand would hit a swap-decision modal *every capture* — friction precisely when flow matters most. The quick-keep `CaptureBox` overflow modal is fine (it's a deliberate toggle); the canvas is not. **→ Prefer a silent Vault fallback + toast ("Hand full — saved to your Vault; hold it when you have room") (see Fork A).** Capture is never blocked, never modal-interrupted.
- **Empty Hand slot must not overload one tap.** Today `+` → `/bars/create`. Adding "pull from Vault" means two intents. **→ The empty slot opens a small bottom-sheet: "Pull from Vault" (list) / "Capture new" (→ whiteboard).** Don't make a bare tap ambiguous.
- **One shared `HandLocationToggle` across all three surfaces — endorsed.** Consistency + single maintenance point. Compact variant for rows; full for detail.
- **Honest copy (HV-MV-6) matters most here.** The current bug literally lies (says nothing, BAR vanishes to Vault). Toasts must name the real destination.

## Encounter Designer — *does it generate gameplay?*

- **This unblocks the core loop — highest-value framing.** An empty Hand means the daily charge and the 5 moves have nothing to act on. Captures landing **active in the Hand** make the Hand the live workbench; the loop (capture → hold → tend/advance → file) starts turning. This is the real prize, above the movement UI.
- **Keep the overflow *choice* somewhere — it's a good micro-encounter** ("which seed do I set down to pick this up?"). On the deliberate `CaptureBox` Hand toggle, yes. On the immersive canvas, the choice can wait (Fork A) — the player resolves it later from the Hand glance, which is itself a small encounter.
- **Movement should stay free and unlimited** (no energy cost) — matches home-vault IA's "deposit is a free action." A cost here would tax the very behavior we're trying to unblock.

## Steward — *privacy, access, safety*

- **Owner-only, enforced twice.** `promoteVaultBarToHand`/`depositHandBarToVault` already check `creatorId === playerId`. The detail page renders for `isOwner || isRecipient` — **gate the toggle to `isOwner` strictly**, never `isRecipient` (a talisman recipient must not move someone else's BAR). List rows: only on owned rows.
- **No new data captured, no AI, deterministic** — clean on privacy and projection risk.

## Integrator (Deftness) — *lineage, coherence, evaluation*

- **Lineage preserved:** `captureBarFromCanvas` already stamps `campaignRef`, `provenanceSource`, `contextLines`, `storyContent`; our change only adds a `HandSlot` binding after creation. No provenance regression.
- **Coherence flag — two capture defaults must read as one principle, not an inconsistency:** `CaptureBox` defaults to Vault, whiteboard defaults to Hand. State the rule in one sentence in the spec so it's a *doctrine*, not a discrepancy: **"Quick-keep files (Vault); deliberate make holds (Hand)."** Also note this aligns with `bar-seed-capture-whiteboard` FR13's original "redirect to `/hand`" intent — we are *restoring* intent, not inventing divergence.
- **Sequence with the rename:** if `hand-vault-rename` is imminent, coordinate the vocabulary once (constants) rather than shipping copy that needs immediate rework.
- **Evaluation hook present:** `cert-hand-vault-movement-v1` walks the full loop — keep it; it is the deftness check that the wiring actually closes.

---

## Verdicts on the three open questions

| Open question | Convened verdict |
|---|---|
| **Vault/feed row inventory (T2.0)** | Keep as a discovery step, but **scope it**: target the owned-BAR rows in the Vault sections (`src/components/hand/Vault*`) and the Garden list first; defer feed if rows there aren't owner-context. One `HandLocationToggle(compact)` everywhere. |
| **OverflowModal extraction** | **Yes, extract** `src/components/now/OverflowModal.tsx` from `CaptureBox` and share it — but per Fork A it may only be needed by `CaptureBox` (not the whiteboard). Extract anyway for reuse + testability; it's ~80 lines of duplicated markup otherwise. |
| **Hand-glance Vault picker UX** | **In-place bottom-sheet**, not a page route. Stays on Now (mobile-first), and the empty slot offers both "Pull from Vault" and "Capture new" so we don't overload the tap. |

## Residual forks — DECIDED by the human (2026-06-20)

- **Fork A → Silent Vault fallback + toast** on the whiteboard when Hand is full. No modal on the canvas.
- **Fork B → Restrict the movement toggle to non-planted BARs** (`captured` / `shared_or_acted`) in v1; Garden↔Hand deferred.

Original framing retained below for the record.

## Residual forks for the human (faces split / ontology choice)

**Fork A — Whiteboard capture when the Hand is full (6/6):**
- *Experience Designer + Integrator:* **silent Vault fallback + toast** ("Hand full — saved to Vault; hold it later"). No modal on the immersive canvas; resolve later from the Hand glance.
- *Encounter Designer:* the swap is a nice micro-choice — but agrees it can be deferred off the canvas.
- **Convened recommendation: silent Vault fallback on the whiteboard; keep the forced overflow modal only on the deliberate `CaptureBox` Hand toggle.** (Spec currently says "overflow modal on whiteboard" — this would change it.)

**Fork B — Should "Hold in Hand / Return to Vault" appear on *planted* (Garden) BARs?**
- *Ontologist:* Garden is a distinct felt place; blindly treating planted BARs as "Vault" muddies the ontology.
- **Convened recommendation: show the movement toggle only for `captured`-maturity and `shared_or_acted` BARs** (the two phases the IA homes in Hand/Vault). For `context_named`/`elaborated` (planted), the home is the **Garden** — offer "Hold in Hand" there too if desired, but label the origin **Garden**, not Vault, and treat Garden↔Hand as its own move. Simplest v1: **restrict the toggle to non-planted BARs**; handle Garden↔Hand in a follow-up.

Both forks are genuine product decisions — surfaced to the human rather than silently chosen.
</content>
