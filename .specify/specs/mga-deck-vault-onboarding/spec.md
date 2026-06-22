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
**As a** practitioner, **I want** to open a captured charge/BAR and record the felt sense (emotion, body, what it points at) without altering its state, **so** I can receive what's getting through before I metabolize it.
**Acceptance**: From the Open Up room I can select a captured charge/BAR, write a felt-sense note, and save it; the underlying BAR's status/maturity is unchanged.

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
- **FR11**: Build the **Open Up / Felt sense** room: list captured charges/BARs; selecting one opens a non-destructive felt-sense note editor (emotion, body, what-it-points-at); saving persists the note **without** mutating the BAR's status/maturity.
- **FR12**: Add to `/deck`: a persistent affordance to open the **Hand modal** and a link back to **NOW home**.

## Non-Functional Requirements
- **Dual-track**: entire loop works with no LLM. Deck stays deterministic.
- **Backward compatibility**: the plant/grow/claim pipeline (CYOA, spoke) is untouched; only the deck-card path skips it. Existing `/bars/{id}` flow remains for other entry points.
- **Security**: pending-intent cookie is signed (HMAC, server secret), short TTL, single-use (cleared on claim). No raw card text trusted from client — seed is rebuilt from `assembleDeck()` server-side.
- **No destructive Vault deletes**: campaign/Scene components are removed from the lobby surface, not deleted from the codebase.

## Persisted data & Prisma

> Likely **no schema change** for Slices 1–3. The deck path reuses `CustomBar`; pending intent lives in a signed cookie, not a table.

**Open question for Slice 4 (Open Up felt-sense note):** decide persistence before building.

| Option | Note |
|--------|------|
| Reuse existing journal/note field on `CustomBar` (e.g. an `agentMetadata`/notes JSON or existing collection-journal model) | Preferred if a felt-sense/journal field already exists — **no migration** |
| New `FeltSenseNote` model (`id, barId, playerId, emotion, body, pointsAt, createdAt`) | Only if no suitable field exists — **requires migration** |

| Check | Done |
|-------|------|
| Confirm whether an existing note/journal field can hold the felt-sense note (avoid a new model if possible) | ☐ |
| If new model: `npx prisma migrate dev --name felt_sense_note`, commit `prisma/migrations/…` with `schema.prisma` | ☐ |
| `npm run db:sync` after any schema edit; `npm run check` | ☐ |
| Human glanced at `migration.sql` (additive) | ☐ |

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
  6. Enter **Open Up**, feel into a charge, save a felt-sense note; confirm the BAR's state is unchanged.
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
