# Spec: Mastering the Game of Allyship — Deck → Hand → Vault → Onboarding

## Purpose

Make the **Allyship Deck → BAR → Vault** loop work for a single individual practitioner of *Mastering the Game of Allyship (MGA)*. Today the deck card's "Send to BARS" button is a dead end for logged-out players, the deck doesn't connect to where BARs actually live (the Hand / NOW home), and the Vault is a busy, four-move workspace wearing the Conclave onboarding costume. This feature fixes the broken intake, gives logged-out players a capture-then-signup path, replaces the Conclave login costume with plain MGA auth, and redesigns the Vault around the **five moves** as a freely-navigable set of rooms.

**Problem**:
1. **Dead-end intake** — `sendDeckCardToBars` returns `{ error: 'Not logged in' }` for unauthenticated users, and `SendToBarsButton` just prints that raw string. No BAR is captured; no signup is offered.
2. **No deck↔home navigation** — `/deck` links to neither the Hand (NOW home) nor back to NOW; a card's only action routes to `/bars/{id}` and never surfaces the BAR in the player's active inventory.
3. **Onboarding costume mismatch** — login funnels everyone through `/conclave/guided` (nation/archetype story). MGA needs purpose-built auth, not the Conclave narrative.
4. **Busy Vault, wrong frame** — `VaultMoveDashboard` shows only **4** moves (missing **Open Up**) and is cluttered with Scene Atlas, summary-strip counts, and campaign/invite features that don't serve the individual practitioner.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI. The whole loop must work with **no language model** in the path.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Logged-out "Send to BARS"** | **Capture then prompt signup.** The intended BAR (card id + subject) is stashed in a pending/anonymous state (signed cookie), the player is sent to MGA signup, and on successful account creation the pending BAR is materialized into their account — nothing lost. |
| **Seed ceremony** | **Composted for deck cards.** Skip seed → plant → claim → grow. "Send to BARS" creates a ready-to-practice BAR (`claimedById = creatorId`, `status = 'active'`) directly. The plant/grow pipeline remains for CYOA/spoke flows; it is not invoked here. |
| **Where a BAR lands** | **The Hand** (the player's active, bounded inventory shown on NOW home). After capture the player lands on NOW with the new BAR in hand (auto-placed into an open slot; if full, it stays in Vault with a "your hand is full" nudge). |
| **Hand vs Vault** | **Hand = active now (bounded 6). Vault = all of my allyship BARs (unbounded).** Everything in the hand is also visible in the Vault. The Hand modal (today on NOW) is also reachable from the Vault and from the Deck. |
| **Vault frame** | **Five moves as a navigable set of rooms, not a linear funnel.** Add the missing **Open Up** room. Rooms carry an *implied* developmental gradient (Wake → Open → Clean → Grow → Show) but enforce **no** sequence — a practitioner may enter any room. |
| **Open Up room** | **Felt-sense doorway** (single-player core). A non-destructive space to "feel into the charge" of a captured BAR/charge — name the emotion / body / what it points at — **without changing the BAR's state**. The *relational inbox* reading (receiving BARs/invitations from others) is a **multiplayer overlay** deferred to a later slice, not core throughput. |
| **Login flow** | **Plain MGA auth.** A purpose-built MGA signup/login (email + password, reusing the existing `Account`/password infra) with no Conclave story. Conclave's nation/archetype onboarding becomes optional/separate, not the gate. |
| **Game-ready gate** | **Gate on `practiceOrientationComplete` (MTGOA-native), not Conclave's `onboardingComplete`.** `isGameAccountReady` is widened to pass on *either* flag, keeping the two onboarding tracks separate while sharing one access gate. MGA signup sets `practiceOrientationComplete: true` (Conclave's `onboardingComplete` stays its own track). No migration — both fields already exist. |
| **`Player.inviteId`** | **Keep the throwaway auto-invite for now** (field is required). Making `inviteId` optional is deferred as its own migration-disciplined spec item. |
| **One signup path** | **MGA `signupMga` is the canonical open-signup.** `createGuidedPlayer` + its `GuidedAuthForm` are retired. Logged-out `/conclave/guided` now redirects to `/signup`; Conclave nation/archetype survives only as an *optional* post-signup step (the story nodes, once authenticated). This also funnels every page that auth-redirects to `/conclave/guided` into MGA signup in one hop. |
| **MGA stays lean** | No Bruised Banana campaign-`ref` attribution and no config-driven post-signup redirect on MGA signup (dropped from the guided path). Land on `returnTo` or NOW home; a claimed deck card pulls to the Hand. Revisit attribution only if the fundraiser needs it. |
| **Vault de-clutter** | Remove/de-emphasize for the individual practitioner: **Scene Atlas**, **summary-strip counts**, and **campaign/invite features** (event invites, accepted-invitations list, Forge Invitation, Stalls). Keep them behind a campaign/multiplayer context, not on the personal Vault lobby. |
| **Deck navigation** | `/deck` gains a persistent affordance to **open the Hand modal** and a link **back to NOW home**. (No direct Deck→Vault link required — Vault is reachable from NOW.) |
| **AI/dual-track** | No model in the loop. Deck assembly stays deterministic (`assembleDeck()`); felt-sense capture is plain text the player writes. |

## Conceptual Model

| Dimension | This feature |
|-----------|--------------|
| **WHO** | Individual MGA practitioner (single-player). Account created via plain MGA auth. |
| **WHAT** | A **BAR** (`CustomBar`) seeded from an Allyship Deck card — created ready-to-practice, claimed by its creator. |
| **WHERE** | The Vault, framed as **five move-rooms**; the Hand (active inventory) on NOW home. |
| **Energy** | Vibeulons reward unchanged (card carries a reward value). |
| **Personal throughput** | The **five moves** become the Vault's room set: Wake Up · Open Up · Clean Up · Grow Up · Show Up — navigable in any order. |

**The five Vault rooms** (target):

| Move | Room | Holds | Verb |
|------|------|-------|------|
| **Wake Up** | Charges | Captured charges — "what's alive" | See what's alive |
| **Open Up** | Felt sense *(new)* | Feel into a captured charge/BAR, non-destructively | Receive what's getting through |
| **Clean Up** | Compost | Release & metabolize stale items | Release & metabolize |
| **Grow Up** | Drafts | Shape your work | Shape your work |
| **Show Up** | Quests | Place, deliver, act | Place, deliver, act |

> Rooms are a *set*, not a pipeline. The gradient is a hint, not a gate.

## API Contracts (API-First)

### `sendDeckCardToBars(input)` — revised (Server Action)

**Input**: `{ cardId: string; subject?: 'self' | 'campaign' }`
**Output**: `SendDeckCardResult`

```ts
type SendDeckCardResult =
  | { success: true; barId: string; placedInHand: boolean }   // authenticated: BAR created
  | { needsAuth: true; pendingToken: string }                  // logged-out: pending BAR stashed
  | { error: string }
```

- **Logged-out**: instead of `{ error: 'Not logged in' }`, build the deterministic seed, sign a **pending intent** (`cardId`, `subject`, issued-at) into a short-lived cookie, and return `{ needsAuth: true, pendingToken }`. The client routes to `/signup?returnTo=/deck&pending=<token>` (or opens an inline signup sheet).
- **Authenticated**: create the BAR with `claimedById = creatorId`, `status = 'active'` (no seed ceremony), attempt to place it in an open Hand slot (`placedInHand`), then return `{ success, barId, placedInHand }`. Client routes to NOW home (`/`) — not `/bars/{id}`.

### `claimPendingDeckBar(pendingToken)` — new (Server Action)

**Input**: `{ pendingToken: string }`
**Output**: `{ success: true; barId: string; placedInHand: boolean } | { error: string }`

Called immediately after successful MGA signup/login when a `pending` token is present. Verifies the signed token, materializes the BAR into the now-authenticated player's account (same path as the authenticated branch above), clears the pending cookie.

### `signupMga(input)` / `loginMga(input)` — new or re-pathed (Server Action)

**Input**: `{ email: string; password: string; returnTo?: string; pending?: string }`
**Output**: `{ success: true; redirectTo: string } | { error: string }`

Reuses existing `Account` + password verification from `conclave-auth.ts`, but **without** the Conclave-guided redirect. On success: set `bars_player_id` cookie, claim any `pending` BAR, redirect to `returnTo` or NOW home. No nation/archetype gate.

- **Surface type**: all three are **Server Actions** (`'use server'`) consumed by React `useTransition` forms — no external/webhook consumer.

## User Stories

### P1: Logged-out capture never loses the BAR
**As a** first-time visitor browsing the Allyship Deck, **I want** tapping "Send to BARS" to take me to signup and then land my card in my new account, **so** my first allyship move isn't thrown away at the door.
**Acceptance**: From a logged-out session, tapping "Send to BARS" routes to MGA signup; after creating an account I land on NOW home with that exact card's BAR in my Hand (or in Vault with a "hand full" note). No "Not logged in" error string is ever shown.

### P1: Logged-in capture lands in the Hand
**As a** signed-in practitioner, **I want** "Send to BARS" to drop a ready-to-practice BAR into my Hand and take me home, **so** I can start practicing without a plant/grow detour.
**Acceptance**: Tapping the button creates an `active`, self-claimed BAR; I land on `/` (NOW); the BAR appears in a Hand slot (or Vault if hand full). No `/bars/{id}` seed page, no plant step.

### P1: Plain MGA auth, no Conclave costume
**As a** new MGA user, **I want** a clean signup/login, **so** I'm not forced through a nation/archetype story to use the product.
**Acceptance**: `/signup` and `/login` present MGA-branded email+password forms; success does not redirect to `/conclave/guided`; the Conclave story is reachable only as an optional path, not a gate.

### P1: Vault shows my allyship BARs in five navigable rooms
**As an** individual practitioner, **I want** the Vault framed by the five moves (including Open Up) and stripped of campaign/scene clutter, **so** it reflects what *Mastering the Game of Allyship* actually asks of me.
**Acceptance**: Vault lobby shows five move-rooms (Wake Up, Open Up, Clean Up, Grow Up, Show Up), enterable in any order; Scene Atlas, summary-strip counts, and campaign/invite features are removed from the personal lobby; my deck-seeded BARs are visible here.

### P2: Open Up — feel into a charge without changing it
**As a** practitioner, **I want** to enter the Open Up room and sit with my live charges, **so** I can receive what's getting through before I metabolize it.
**Acceptance (current)**: From the Open Up room I can see my live charges and sit with them; nothing I do here changes a charge's state. *(The interaction beyond viewing is deferred — see "Open Up / Felt Sense — Design In Progress". The earlier "write and save a felt-sense note" acceptance is retired.)*

### P2: Deck connects to home and hand
**As a** practitioner reading the deck, **I want** to open my Hand and return to NOW from `/deck`, **so** the deck isn't an island.
**Acceptance**: `/deck` shows a persistent affordance to open the Hand modal and a link back to NOW home.

### P3: Verification quest
**As a** tester, **I want** a guided quest that walks the deck→signup→hand→vault loop, **so** we can confirm it before the Bruised Banana residency.

## Functional Requirements

### Phase 1 — Fix intake + pending capture (Slice 1)
- **FR1**: Revise `sendDeckCardToBars` to the contract above: logged-out → `{ needsAuth, pendingToken }`; logged-in → ready-to-practice BAR (`claimedById = creatorId`, `status = 'active'`, no seed metadata pipeline), attempt Hand placement, return `placedInHand`.
- **FR2**: Implement a signed **pending intent** cookie (HMAC over `cardId|subject|iat`, short TTL). No new table required.
- **FR3**: Update `SendToBarsButton` to handle three result shapes: success → `router.push('/')`; `needsAuth` → route to `/signup?returnTo=/deck&pending=<token>`; `error` → inline message (kept only for genuine failures, never "Not logged in").
- **FR4**: Attempt Hand placement on capture via existing `hand-service`/`addBarToHand`; if no open slot, leave in Vault and signal `placedInHand=false`.

### Phase 2 — Plain MGA auth (Slice 2)
- **FR5**: Add `/signup` and MGA-branded `/login` (or re-skin existing `LoginForm`) backed by `signupMga`/`loginMga`, reusing `Account` + password infra from `conclave-auth.ts`, **without** the Conclave-guided redirect.
- **FR6**: Implement `claimPendingDeckBar`; call it on signup/login success when `pending` is present.
- **FR7**: Decouple auth gating: `/vault` (and friends) redirect unauthenticated users to `/login` (MGA), **not** `/conclave/guided`. Conclave remains reachable as an optional onboarding, not a gate.

### Phase 3 — Vault five-move redesign + de-clutter (Slice 3)
- **FR8**: Expand `VaultMoveDashboard` from four to **five** rooms, adding **Open Up** (Felt sense). Rooms render as a freely-navigable set (no locked/sequential ordering).
- **FR9**: Remove from the personal Vault lobby: **Scene Atlas**, **VaultSummaryStrip** counts, and **campaign/invite** blocks (event invites, accepted-invitations, Forge Invitation, Stalls). Preserve these components for campaign/multiplayer contexts (do not delete the components; remove them from the personal lobby).
- **FR10**: Ensure deck-seeded BARs surface in the Vault (they are `active`, self-claimed CustomBars by the creator).

### Phase 4 — Open Up room + deck navigation (Slice 4)
- **FR11** *(deferred — design in progress, do not build the interaction yet)*: The **Open Up** room ships for now as a **contemplative viewing space** — it lists your live charges so you can sit with them; it does **not** yet have an editor. The interaction is being designed (see *Open Up / Felt Sense — Design In Progress* below). The earlier "felt-sense note editor (emotion/body/what-it-points-at)" framing is **retired**: a freeform note box turns an interior move into cognitive homework and demands a term (*felt sense*) the newcomer doesn't have.
- **FR12**: Add to `/deck`: a persistent affordance to open the **Hand modal** and a link back to **NOW home**.

## Open Up / Felt Sense — Design In Progress

> **Status (2026-06-24): model + interaction design locked; ready to build a v1 on the creator's go.** The metabolic model (amplifier, single-magnitude conversion) and the Open Up gesture (somatic sliders) are both decided. Only a mechanical persistence-field confirmation remains, resolvable at build time. The room stays a viewing space until the creator says build. This section is the scratch space we refined in conversation.

**What "felt sense" actually is.** Eugene Gendlin's term (*Focusing*): the vague, pre-verbal, *bodily* sense of a situation that can "shift" when attended to. Everyone has them; almost no one has the word. So the UI must never ask the player to "write a felt sense" — that produces either a bounce or an *analysis*, and analysis is the cognitive opposite of the interior move. Open Up has to be **felt**, not journaled.

**The throughput model (LOCKED 2026-06-24).** The moves are a metabolic pipeline on a **charge** that holds one hidden total magnitude, split between *locked* and *workable* material:

| Move | Does | On the charge |
|------|------|---------------|
| **Wake Up** | Notice it exists | A raw charge appears — mostly **density** (locked), a thin skin of **volume** (workable) |
| **Open Up** | Turn toward it — *unlock* | Converts some **density → volume**. Adds nothing; releases what was already there |
| **Clean Up** | Transform it into usable material | Eats **volume**, yields energy; the charge shrinks |

- One hidden magnitude `M = volume + density`. **Density = stuckness / armor** (locked, unworkable). **Volume = loose, workable material.**
- **Clean Up only eats volume** — you can't compost a rock, only what's already broken down.
- **Open Up converts density → volume** — a single quantity moving, not two independent stats ("soften toward it, widen the aperture so the truth can land" — already the Open Up copy in `src/components/bars/MoveGenerator.tsx`).
- A charge is fully metabolized only when both reach zero — and **density can leave only by first becoming volume (via Open Up).**

**The rule — an amplifier, a dial, not a wall (LOCKED):**

> **The more you've opened up, the more there is to clean up.**

Clean Up is **never gated** — it always runs on whatever volume is currently unlocked. Closed off, you strip the thin skin and metabolize a little; the dense core just sits there. So a charge cleaned *without* opening **plateaus** — and that plateau **is the residue**: unconverted density, still on the charge, heavy, waiting for you to turn toward it. No separate "stuck marker" system is needed; the leftover density *is* the stuckness. This teaches felt sense *by consequence*, with zero vocabulary — and stays true to life (closed-off people still metabolize, just poorly).

**Measuring openness without reading someone's insides.** You don't self-report aperture; the interaction *produces* the unlock amount from the **act of turning toward** — dead-simple somatic inputs (where do you feel it; tight vs diffuse; does staying with it change). **Engagement is aperture.** Fully no-AI, no jargon, works at a party (dual-track safe).

**Resolved:**
- ✅ **Gate vs amplifier** → **amplifier** (dial, not wall). Clean Up always runs; Open Up raises available volume.
- ✅ **Density ↔ volume** → **one hidden magnitude**; density = locked remainder, Open Up *converts* density → volume; Clean Up consumes volume.
- ✅ **Residue** → falls out of the model for free: unconverted density is the residue; a charge cleaned without opening plateaus on its dense core.
- ✅ **Aperture derivation** → **somatic sliders, NOT felt-shift self-report.** Asking an untrained person to report a felt shift presumes the skill it's trying to measure — useless without training. The slider instead *walks the player into the body* ("where do you feel this?" + a tight↔diffuse read), and the somatic contact happens as a side effect of answering. See *The gesture* and *Why not felt-shift* below.

**The gesture (Open Up v1).** Pick a charge, then a tiny somatic check-in:
- **Where do you feel it?** — coarse body anchor (head / throat / chest / gut / limbs / whole-body). This is the get-into-your-body move; the *point*, not metadata.
- **Tight or diffuse?** — a `tight ↔ loose` slider. This is the **density read** for this sitting.
- *(optional)* **How big/loud?** — an intensity read for magnitude.

The slider is a **reading you re-take each visit**, not a completion you drag to done. The unlock per session is **small and capped** (a fraction of remaining density, diminishing returns) — so you *cannot* one-shot a dense core regardless of where you drag, and the trend toward "loose" *over repeated visits* is the metabolization. Big things loosen gradually, like real grief.

**The payload is the gesture, not the accounting.** The density→volume→energy economy exists to **motivate a repeated embodied check-in**; the actual change vector is interoception training — locating a charge in the body, on a phone, again and again. The numbers serve the habit, not vice versa. So a "small" unlock is fine: the somatic link is the win.

**The embodiment ladder (roadmap, not v1).** The slider is rung one. As the interface matures, Open Up gets *increasingly sophisticated ways to get people into their bodies on a phone* — breath pacing, hold-to-feel, haptics, and eventually the **felt-shift check** itself (now earnable, because the somatic link already exists). Felt-shift isn't cut; it's deferred up the ladder.

**Why not felt-shift (v1).** Self-reporting a felt shift with no training produces a bounce or an intellectualization. Build the somatic link first; let the richer interior reads arrive once players have a body-on-the-phone practice to report *from*.

**Still open before building:**
1. **Persistence shape** — **not** a freeform note. A small **structured read on the charge**: `magnitude`, `density` (locked remainder), `volume` (workable), plus the latest somatic read (`bodyLocation`, `tightness`). Likely fits `CustomBar` metadata JSON with **no migration**. Confirm the field can hold it; decide exact keys at build time.


## Non-Functional Requirements
- **Dual-track**: entire loop works with no LLM. Deck stays deterministic.
- **Backward compatibility**: the plant/grow/claim pipeline (CYOA, spoke) is untouched; only the deck-card path skips it. Existing `/bars/{id}` flow remains for other entry points.
- **Security**: pending-intent cookie is signed (HMAC, server secret), short TTL, single-use (cleared on claim). No raw card text trusted from client — seed is rebuilt from `assembleDeck()` server-side.
- **No destructive Vault deletes**: campaign/Scene components are removed from the lobby surface, not deleted from the codebase.

## Persisted data & Prisma

> Likely **no schema change** for Slices 1–3. The deck path reuses `CustomBar`; pending intent lives in a signed cookie, not a table.

**Open Up persistence — blocked on design, not on a table choice.** The earlier "felt-sense note" persistence question (reuse a `CustomBar` note field vs. new `FeltSenseNote` model with `emotion/body/pointsAt`) is **withdrawn**: the interaction is no longer a freeform note. Once the *Open Up / Felt Sense — Design In Progress* model settles (gate vs amplifier, aperture derivation, density↔volume, residue), the persisted shape is expected to be a small **structured read on the charge** (magnitude / aperture / location), most likely fitting `CustomBar` metadata with **no migration**. Decide fields only after the mechanic clicks.

**Do not** rely on `db push` for anything merging to main.

## Verification Quest (required for UX features)

- **ID**: `cert-mga-deck-vault-onboarding-v1`
- **Frame**: *Bruised Banana Fundraiser* — "Verify the new front door so guests can pick up their first allyship move at the party and find it waiting in their vault."
- **Steps** (one Twine passage each; final passage has no link → minting the reward):
  1. From a fresh (logged-out) session, open `/deck` and draw a card.
  2. Tap **Send to BARS** → confirm you are taken to **MGA signup** (no "Not logged in" error, no Conclave story).
  3. Create an account → confirm you land on **NOW home** with the card's BAR **in your Hand**.
  4. Open the **Hand modal** from NOW; confirm the BAR is present.
  5. Open the **Vault**; confirm five move-rooms (Wake Up · Open Up · Clean Up · Grow Up · Show Up) and that your new BAR is visible.
  6. Enter **Open Up**; confirm you can see your live charges and sit with them. *(Interaction beyond viewing is deferred — see "Open Up / Felt Sense — Design In Progress". Re-add the "feel into a charge" step once that mechanic ships.)*
- **Structure**: TwineStory + CustomBar, `isSystem: true`, `visibility: 'public'`, deterministic id `cert-mga-deck-vault-onboarding-v1`, idempotent seed script `seed:cert:mga-deck-vault-onboarding`.
- Reference: [.specify/specs/cyoa-certification-quests/](../cyoa-certification-quests/), [scripts/seed-cyoa-certification-quests.ts](../../../scripts/seed-cyoa-certification-quests.ts).

## Dependencies
- Existing deterministic deck: `src/lib/allyship-deck/assemble.ts`, `move-library.ts`, `seed.ts`.
- Hand model + service: `prisma` `HandSlot`, `src/lib/hand-service.ts`, `src/actions/hand.ts`, `src/components/world/HandModal.tsx`, `src/components/now/HandGlance.tsx`.
- Auth infra: `src/actions/conclave-auth.ts` (`Account`, password verify, `bars_player_id` cookie), `src/lib/auth.ts`.

## References
- `src/app/deck/page.tsx`, `src/components/deck/AllyshipCard.tsx`, `src/components/deck/SendToBarsButton.tsx`
- `src/actions/send-deck-card-to-bars.ts`
- `src/app/vault/page.tsx`, `src/components/hand/VaultMoveDashboard.tsx`, `src/components/vault/VaultSummaryStrip.tsx`
- `src/app/login/LoginForm.tsx`, `src/app/conclave/guided/page.tsx`, `src/actions/conclave.ts`
- `src/components/now/NowHome.tsx`
- Prisma workflow: [prisma-migration-discipline skill](../../../.agents/skills/prisma-migration-discipline/SKILL.md), [fail-fix-workflow](../../../.cursor/rules/fail-fix-workflow.mdc)
