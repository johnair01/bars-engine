# Plan: MGA — Deck → Hand → Vault → Onboarding

> Implement per [spec.md](./spec.md). **API-first**: lock the `sendDeckCardToBars`, `claimPendingDeckBar`, and `signupMga/loginMga` signatures before any UI.

## Architecture Strategy

Four independently-shippable slices. Each slice ends with `npm run build` + `npm run check` green.

```
Slice 1  Intake fix + pending capture     (deck card never dead-ends)
Slice 2  Plain MGA auth + claim pending    (Conclave costume off the gate)
Slice 3  Vault five-move redesign + declutter
Slice 4  Open Up room + deck navigation + verification quest
```

Slices 1→2 are sequential (pending capture needs the claim-on-signup handler). Slice 3 is independent of 1–2. Slice 4 depends on 3.

## Slice 1 — Intake fix + pending capture

**Server (API-first):**
- `src/actions/send-deck-card-to-bars.ts`
  - Branch on `getCurrentPlayer()`:
    - **null** → build seed via `buildDeckSeed(card, subject)`, sign a pending intent, return `{ needsAuth: true, pendingToken }`. Do **not** write to DB.
    - **player** → create `CustomBar` with `claimedById: player.id`, `status: 'active'` (drop `claimedById: null` seed semantics for this path); call hand placement; return `{ success, barId, placedInHand }`.
  - Keep server-side rebuild from `assembleDeck()` (no client-trusted text).
- `src/lib/deck-pending-intent.ts` *(new)* — `signPendingIntent({cardId, subject})` / `verifyPendingIntent(token)` using HMAC over `cardId|subject|iat` with a server secret (reuse existing session/secret env; document in `docs/ENV_AND_VERCEL.md` if a new var). Short TTL (e.g. 30 min). Cookie name `bars_deck_pending`.
- Hand placement helper: reuse `addBarToHand` (`src/actions/hand.ts`) / `hand-service`; tolerate "no open slot" → `placedInHand=false`.

**Client:**
- `src/components/deck/SendToBarsButton.tsx`
  - Handle `success` → `router.push('/')`.
  - Handle `needsAuth` → `router.push('/signup?returnTo=/deck&pending=' + token)`.
  - Handle `error` → inline message (genuine failures only).

**Verify:** logged-in tap creates active BAR, lands on NOW, BAR in hand; logged-out tap routes to signup with pending token; `npm run build && npm run check`.

## Slice 2 — Plain MGA auth + claim pending

**Server:**
- `src/actions/mga-auth.ts` *(new, or extend `conclave-auth.ts`)* — `signupMga`, `loginMga` reusing `Account` create/verify + `bars_player_id` cookie, **omitting** the `/conclave/guided` redirect. On success: if `pending` present, call `claimPendingDeckBar`; redirect to `returnTo` or `/`.
- `claimPendingDeckBar(pendingToken)` in `send-deck-card-to-bars.ts` (or a sibling action) — verify token, materialize BAR for the now-authenticated player (shared helper with Slice 1's authenticated branch), clear cookie.
- Extract a shared `materializeDeckBar(player, cardId, subject)` helper so the authenticated branch and the claim path are identical.

**Routes/UI:**
- `src/app/signup/page.tsx` + form *(new)* and MGA re-skin of `src/app/login/LoginForm.tsx` — email+password, accept `returnTo` + `pending` query.
- Auth gate decoupling: change `/vault` (and any route redirecting to `/conclave/guided` for *auth*) to redirect to `/login`. Leave Conclave reachable as optional onboarding.

**Verify:** signup with `pending` lands BAR in account + hand; `/vault` logged-out → `/login` (not Conclave); existing Conclave login still works as optional path.

## Slice 3 — Vault five-move redesign + declutter

**Components:**
- `src/components/hand/VaultMoveDashboard.tsx` — add **Open Up** room (key `open_up`, label "Open Up", room "Felt sense", href `/vault/open-up`, verb "Receive what's getting through"). Render five rooms as an unordered, equally-accessible set (no lock/sequence). Align colors with card-tokens move palette.
- `src/app/vault/page.tsx` — remove from the personal lobby: `VaultSummaryStrip`, Scene Atlas block, and campaign/invite blocks (`VaultCampaignInviteBars`, accepted-invitations, Forge Invitation footer, Stalls header link). **Do not delete** these components — they stay for campaign contexts. Keep "New BAR", Hand glance, and the five-move dashboard.
- Reachability: ensure Hand modal is openable from the Vault lobby (reuse `HandModal`/`HandGlance`).

**Verify:** Vault lobby shows five rooms, navigable in any order; clutter gone; deck-seeded BARs visible; campaign components still compile/usable elsewhere.

## Slice 4 — Open Up room + deck nav + verification quest

**Open Up room:**
- `src/app/vault/open-up/page.tsx` *(new)* — list captured charges/BARs; select → felt-sense note editor (emotion / body / what-it-points-at).
- Persistence decision (per spec § Persisted data): **first** check for an existing journal/notes field on `CustomBar` or the collection-journal model and reuse it. Only if none fits, add `FeltSenseNote` model + migration. Saving must **not** mutate BAR `status`/maturity.

**Deck navigation:**
- `src/app/deck/page.tsx` / deck chrome — add persistent affordance to open `HandModal` and a link back to NOW (`/`).

**Verification quest:**
- Twine passages (6 steps from spec) + `CustomBar` (`isSystem`, `visibility: 'public'`, id `cert-mga-deck-vault-onboarding-v1`).
- `scripts/seed-cert-mga-deck-vault-onboarding.ts` (idempotent), npm script `seed:cert:mga-deck-vault-onboarding`. Follow `scripts/seed-cyoa-certification-quests.ts`.

## File Impact Summary

| File | Slice | Action |
|------|-------|--------|
| `src/actions/send-deck-card-to-bars.ts` | 1,2 | Rewrite branches; add `materializeDeckBar`, `claimPendingDeckBar` |
| `src/lib/deck-pending-intent.ts` | 1 | New — signed pending cookie |
| `src/components/deck/SendToBarsButton.tsx` | 1 | Handle 3 result shapes |
| `src/actions/mga-auth.ts` | 2 | New — `signupMga`/`loginMga` (no Conclave gate) |
| `src/app/signup/page.tsx` (+form) | 2 | New |
| `src/app/login/LoginForm.tsx` | 2 | MGA re-skin; accept `returnTo`+`pending` |
| `src/app/vault/page.tsx` | 2,3 | Auth redirect → `/login`; declutter lobby |
| `src/components/hand/VaultMoveDashboard.tsx` | 3 | 4→5 rooms, add Open Up, non-linear |
| `src/app/vault/open-up/page.tsx` | 4 | New — felt-sense doorway |
| `src/app/deck/page.tsx` | 4 | Hand modal + NOW link |
| `scripts/seed-cert-mga-deck-vault-onboarding.ts` | 4 | New — verification quest seed |

## Risks / Trade-offs
- **Pending cookie security** — must be signed + short-TTL + single-use; never trust client card text (rebuild from `assembleDeck()`).
- **Auth-gate sprawl** — search for *all* `/conclave/guided` auth redirects, not just `/vault`, to avoid leaving a Conclave gate elsewhere. Distinguish *auth* gating from *profile-completeness* onboarding.
- **Hand-full edge** — capture must degrade gracefully to Vault with a clear "hand full" signal, never silently drop the BAR.
- **Don't delete campaign components** — only remove from the personal lobby; they serve multiplayer/campaign surfaces.

## Verification (per slice)
- `npm run build` — full Next.js build
- `npm run check` — lint + type-check
- Manual: walk the verification-quest steps from `spec.md`.
