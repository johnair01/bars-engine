# Spec: Go Deeper (Superpower Funnel)

## Purpose

Turn the (already-built) superpower technique library into a player-facing **"Go Deeper"** feature on the Allyship Deck, and the funnel that feeds it: a free superpower quiz, deck purchase that includes the buyer's inner pack, and a personalized outer-pack upsell. When a player views a deck card, Go Deeper surfaces the superpower move at that coordinate for the player's loadout — full content if they own the matching pack, a citation + upsell if they don't.

This spec is the **wiring layer**: the engine (`resolveTechniques`, `citeSuperpowerMove`, `poolWithSuperpowers`, the 360-card decks, quality gating) and the platform (auth, entitlements, deck UI, Gumroad/redemption, Paywall) already exist and are unchanged. What's missing is the seam between them — a loadout on `Player`, a quiz, pack SKUs, one resolver server action, and a card-overlay affordance.

**Problem**: The library is isolated (imported nowhere). Players can't discover their superpower, can't see superpower moves on cards, and there's no purchase path for packs. Without this, the superpower work is inert.

**Practice**: Deftness Development — spec kit first, API-first (server-action contracts before UI), deterministic over AI. The resolution/citation path is pure and deterministic; no AI in the request path.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Quiz is a free top-of-funnel hook** | The superpower quiz is takeable **anonymously** on the landing page (the conversion hook and the upsell router). It **saves on login**. Same quiz also appears in onboarding (canonical save point) and as a lazy fallback at first Go Deeper. |
| **Quiz outputs a pair** | The quiz produces a **loadout** = `{ inner, outer }` (two superpowers), not one — inner = how you defend/metabolize yourself, outer = how you help others. Scored as two sub-scales over the six superpowers; pick the top of each. |
| **Deck purchase includes the inner pack** | Buying the base deck grants the buyer's **inner** superpower pack so the first Go Deeper on a self/inner card pays off (no empty paywall). Because the inner superpower isn't known at checkout, the grant is **deferred**: on loadout-save, if the player owns the deck, auto-grant `superpower-<inner>-pack` (idempotent). |
| **Outer pack is the upsell; loadout bundle is the headline** | Post-deck, the natural upsell is the **outer** pack ("complete your loadout"). The landing headline offer is the **loadout bundle** (deck + both your packs, discounted). |
| **Two gates** | Login gates *having a saved loadout*; ownership gates *seeing pack content*. `citeSuperpowerMove` already returns the coordinate + `owned` flag without leaking content — anon/non-owners get cite + CTA, owners get the move. |
| **Library stays pure** | The technique library knows nothing about players or purchases. All "who is this / what do they own" lives in a server action + `player-entitlements` helpers. |
| **Aspect from the subject toggle** | The deck overlay already has a self/other (subject) toggle; `self → inner` slot, `other|collective → outer` slot (`aspectForSubject`). Go Deeper reads the active subject to pick the slot. |
| **Content gating to published** | Go Deeper surfaces the **highest-level published** card at the coordinate. If a coordinate has no published card, the affordance is hidden (no broken "go deeper"). This couples to `superpower-deck-quality` Phase 5 (promotion). |
| **Reuse, don't rebuild** | Auth (`getCurrentPlayer`/`requirePlayer`), entitlements (`grantEntitlement`/`hasCapability`/`checkAccess`), redemption codes, Gumroad funnel, and Paywall components are reused. Go Deeper upsell is an **inline Paywall variant**, not a new paywall system. |

## Conceptual Model

```
LAND → free quiz (anon) → loadout {inner, outer}
                               │ login to save → Player.superpowerInner/Outer
                               ▼
   buy deck (deck-digital) ── on loadout-save, deck owned ──▶ grant superpower-<inner>-pack
                               ▼
   /deck (gated) → draw card → subject toggle picks slot
                               ▼
   Go Deeper(cardId, subject):
     loadout[slot] = superpower; owned = getOwnedSuperpowers(player)
     resolveTechniques(card, loadout, subject, poolWithSuperpowers(BASE_POOL, owned))
       owns pack → render the move (steps, tell, …)
       not owned → citeSuperpowerMove(...) → "your <sp> has a move here" + buy outer pack
```

WHO (superpower, via quiz) × WHAT (move) × HOW (operation/face) × WHERE (domain) — the player's loadout selects the WHO; the card supplies the rest; ownership decides content vs. citation.

## API Contracts (API-First)

All server actions (`'use server'`) returning `{ success, error, data }`. Pure helpers live in `src/lib/player-entitlements/`.

### Loadout

```ts
// src/lib/player-entitlements/loadout.ts
export async function getPlayerLoadout(playerId: string): Promise<Loadout | null>
export async function getOwnedSuperpowers(playerId: string): Promise<Superpower[]>

// src/actions/superpower.ts  ('use server')
export async function saveSuperpowerLoadout(
  inner: Superpower, outer: Superpower,
): Promise<{ success: boolean; error?: string; data?: { granted?: Superpower } }>
//  - requires login; persists Player.superpowerInner/Outer
//  - if hasCapability(player, 'deck-digital') → grantEntitlement(superpower-<inner>-pack) (idempotent)
//  - returns the granted inner pack (if any) for the result UI
```

### Quiz (pure scoring + thin action)

```ts
// src/lib/superpowers/quiz.ts  (pure, runs anywhere incl. anon client)
export interface QuizAnswer { questionId: string; choice: Superpower }
export function scoreQuiz(answers: QuizAnswer[]): Loadout   // two sub-scales → {inner, outer}
export const QUIZ_QUESTIONS: QuizQuestion[]                  // authored; inner-axis + outer-axis sets
```

Anonymous flow computes `scoreQuiz` client-side; `saveSuperpowerLoadout` persists on login.

### Go Deeper

```ts
// src/actions/deck-techniques.ts  ('use server')
export interface GoDeeperResult {
  superpower: Superpower
  aspect: MoveAspect
  owned: boolean
  technique: Technique | null   // populated only when owned AND a published card exists
  citation: SuperpowerCitation  // coordinate + cardId + owned (never content when locked)
  upsellSku: OfferKey | null    // the outer pack / loadout bundle to offer when locked
  available: boolean            // false if no published card at this coordinate (hide affordance)
}
export async function getCardGoDeeper(cardId: string, subject: Subject): Promise<GoDeeperResult>
//  - getCurrentPlayer(); if no loadout → returns { available, needsQuiz: true } variant
//  - resolves the active-slot superpower card at (card.move, card.operation, aspect)
//  - owned → technique (highest published level at coordinate); not owned → citation + upsellSku
```

- **Route vs Action**: all three are **Server Actions** (user context + mutation/read tied to the player). No route handlers; Gumroad purchase webhook already exists in the entitlement layer.

## Persisted data & Prisma

| Check | Done |
|-------|------|
| `Player.superpowerInner String?`, `Player.superpowerOuter String?`, `Player.quizCompletedAt DateTime?` | |
| No new model — pack ownership rides the existing `Entitlement` model via new SKUs/capabilities | |
| `tasks.md` includes: `npx prisma migrate dev --name player_superpower_loadout`, commit `prisma/migrations/…` with `schema.prisma`, then `npm run db:generate` + `db:record-schema-hash` | |
| Verification: `npm run db:sync`; `npm run check` | |
| Human glanced at `migration.sql` (additive only) | |

**Do not** rely on `db push`.

## Scaling Checklist
| Touchpoint | Mitigation |
|------------|------------|
| AI calls | None in the request path — quiz scoring, resolution, and citation are deterministic. |
| Entitlements | Reuse `grantEntitlement`/`hasCapability`; deferred inner-pack grant is idempotent. |
| Env | Pack SKUs + Gumroad links documented in `offers.ts`; add to `docs/ENV_AND_VERCEL.md` if new env. |

## User Stories

### P1: Free quiz → my loadout
**As a visitor**, I can take the superpower quiz without an account and see my inner + outer superpowers, with a taste card; logging in saves it.
**Acceptance**: `scoreQuiz` returns a `{inner, outer}`; result page renders both + one sample card; "log in to save" persists via `saveSuperpowerLoadout`.

### P2: Buying the deck makes Go Deeper pay off (inner)
**As a deck buyer**, after saving my loadout, Go Deeper on a self/inner card shows my inner superpower's move — no paywall.
**Acceptance**: `saveSuperpowerLoadout` auto-grants `superpower-<inner>-pack` when `deck-digital` is held; `getCardGoDeeper(card, 'self')` returns `owned:true` + a published `technique`.

### P3: Outer is the upsell
**As that same buyer**, Go Deeper on an other/outer card cites my outer superpower's move and offers the outer pack / loadout bundle.
**Acceptance**: `getCardGoDeeper(card, 'other')` returns `owned:false`, `citation` (no steps), and `upsellSku`; the overlay shows an inline Paywall CTA.

### P4: No loadout → prompt the quiz
**As a player without a saved loadout**, Go Deeper prompts the quiz instead of erroring.
**Acceptance**: `getCardGoDeeper` returns a `needsQuiz` variant; the overlay links to the quiz.

### P5: Verification quest
A Twine quest walks a tester through quiz → result → draw → Go Deeper (inner pays off) → Go Deeper (outer upsell), minting on completion.

## Functional Requirements

### Slice 1 — Loadout foundation (no UI)
- **FR1**: Prisma: `Player.superpowerInner/superpowerOuter/quizCompletedAt` (+ migration).
- **FR2**: `player-entitlements/loadout.ts`: `getPlayerLoadout`, `getOwnedSuperpowers` (entitlement → Superpower map).
- **FR3**: `actions/superpower.ts`: `saveSuperpowerLoadout` with deferred inner-pack grant (idempotent).
- **FR4**: `BASE_POOL` exported from the technique library (canonical base, excludes packs).
- **FR5**: Unit tests: loadout round-trip; deck-owner save grants inner pack; non-owner save grants nothing.

### Slice 2 — The quiz
- **FR6**: `superpowers/quiz.ts`: `QUIZ_QUESTIONS` (inner-axis + outer-axis) + pure `scoreQuiz`.
- **FR7**: Quiz UI (anon-capable) + result page (inner/outer + one taste card) + "log in to save".
- **FR8**: Entry points: landing hook + onboarding step + lazy at Go Deeper.

### Slice 3 — SKUs & entitlements
- **FR9**: `offers.ts`: `superpower-<x>-pack` (×6) + `loadout-bundle`; `grants.ts`: SKU→capability; capability→Superpower map for `getOwnedSuperpowers`.
- **FR10**: Deck purchase wiring confirmed: `deck-digital` + deferred inner-pack grant.

### Slice 4 — Go Deeper
- **FR11**: `actions/deck-techniques.ts`: `getCardGoDeeper` (owned content vs citation+upsell vs needsQuiz; respects published-only + highest-level).
- **FR12**: Deck overlay: a "Go Deeper" affordance (shown only when `available`), rendering the move (owner) or an inline Paywall upsell (non-owner) or a quiz prompt (no loadout).

### Slice 5 — Verification & polish
- **FR13**: Verification quest `cert-go-deeper-v1` (Twine + idempotent seed) tied to the fundraiser narrative.
- **FR14**: `npm run build` + `npm run check` green; analytics/telemetry hooks optional.

## Non-Functional Requirements
- Deterministic request path (no AI); anon-safe (quiz works logged-out).
- Additive: base deck, resolver, validator, entitlement spine unchanged.
- Graceful gating: never show Go Deeper with no resolvable published content.

## Verification Quest
- **ID**: `cert-go-deeper-v1`
- **Steps**: take quiz → see inner/outer result → (deck owned) open a card → Go Deeper on a self card (move shows) → Go Deeper on an other card (outer upsell) → final passage mints reward.
- Frame toward the Bruised Banana Fundraiser (party prep / engine improvement). Reference `.specify/specs/cyoa-certification-quests/`.

## Dependencies
- `superpower-move-decks` (the packs), `superpower-deck-quality` (published content — **content readiness gates how good Go Deeper feels**; ideally inner hero cells exist for all six superpowers, else L2 is the included floor).
- `allyship-technique-vocabulary` (resolver/citation), `allyship-deck-experience` (deck UI + subject toggle).
- `book-launch-paywall` / entitlements (`offers.ts`, `grants.ts`, `entitlements/*`), auth (`src/lib/auth.ts`).

## References
- `src/components/deck/AllyshipDeckReader.tsx`, `AllyshipCard.tsx` (overlay + subject toggle)
- `src/lib/auth.ts` (`getCurrentPlayer`, `requirePlayer`)
- `src/lib/entitlements/{service,gate}.ts`, `src/lib/launch/{offers,grants}.ts`
- `src/lib/technique-library/` (`resolveTechniques`, `superpowers/pools.ts` citation/pools, `superpowerDeck`/`publishedDeck`)
- `.specify/specs/superpower-move-decks/spec.md`, `.specify/specs/superpower-deck-quality/spec.md`
