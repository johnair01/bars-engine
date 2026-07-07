# Runbook — Gumroad Launch Setup (Track A)

Operational steps to take the Mastering Allyship launch live: wire Gumroad
products to the in-app unlock flow, set env, and switch on access gating.

Related: [launch plan](../plans/MASTERING_ALLYSHIP_LAUNCH.md) · SKUs in
`src/lib/launch/offers.ts` · webhook `src/app/api/webhooks/gumroad/route.ts` ·
gating `src/lib/entitlements/gate.ts`.

## The end-to-end loop

```
Buy on Gumroad → license key emailed to buyer → buyer enters it at /redeem
  → Entitlement created → app unlocks
     • digital book  ⇒ 30-day app access
     • game sub      ⇒ app access + digital book + deck (renews monthly)
     • Founding Ally ⇒ lifetime app access + deck
```

## 1. Per-product setup in Gumroad

For **each** product (book digital/physical, RPG handbook digital/physical,
deck, game subscription, Founding Ally bundle):

1. **Enable “Generate a unique license key per sale.”**
   This is how the buyer receives their code — there is no email infra on our
   side. The license key becomes the redemption code.
2. **Set the after-purchase content / receipt to link to `/redeem`** so the
   buyer knows where to paste their license key.

## 2. Webhook (Ping)

Set the product (or seller-level) **Ping** URL to:

```
https://<app-domain>/api/webhooks/gumroad?token=<GUMROAD_WEBHOOK_SECRET>
```

The webhook verifies the secret (timing-safe), maps the sale’s product to an
`OfferKey`, and mints a `RedemptionCode` keyed to the Gumroad `sale_id`
(idempotent). One endpoint handles every event by inspecting the payload:

| Event | Behavior |
| :-- | :-- |
| Sale | Mint a `RedemptionCode` (license key = code). |
| Recurring charge (`is_recurring_charge`) | Extend the entitlement (stacks from current expiry). |
| Refund / dispute | Void the code + revoke the entitlement. |
| Subscription **ended** (`ended_reason` / `subscription_ended_at`) | Expire access now. |
| Subscription **cancelled** (still paid time left) | No change — access lapses at expiry. |

**Register the same URL** for the subscription resources too (Gumroad
Settings → Advanced → Ping, plus resource subscriptions for
`cancellation` / `subscription_ended` / `refund` / `dispute`) so renewals and
cancellations reach the endpoint.

## 3. Environment variables (Vercel)

| Var | Required | Purpose |
| :-- | :-- | :-- |
| `GUMROAD_WEBHOOK_SECRET` | ✅ | Shared secret in the Ping URL `?token=`. Webhook **fails closed** if unset. |
| `GUMROAD_SELLER_ID` | optional | Pin to your seller id; rejects pings from other sellers. |
| `GUMROAD_PRODUCT_MAP` | optional | JSON `{ "<permalink\|product_id\|product_name>": "<OfferKey>" }`. If unset, product permalinks are derived from the `NEXT_PUBLIC_GUMROAD_*_URL` links. |
| `NEXT_PUBLIC_GUMROAD_*_URL` | per product | The `/launch` buy links (also the fallback product→SKU source). One per SKU — see launch plan. |
| `ENABLE_LAUNCH_GATES` | launch toggle | `true` switches on the **soft** gates (game / app access). Leave unset/false until launch. |
| `LAUNCH_GATE_CUTOFF` | launch toggle | ISO datetime; players created **before** it are grandfathered when soft gates switch on. Set to your launch moment so the existing community keeps access. |

### Per-product reference (OfferKey → price → env var)

One row per Gumroad product to create. Set the **buy-link** var to make the
offer live on `/launch` (`isOfferLive` = non-empty URL). Set the **verify-id**
var (core SKUs only) so `/redeem` can verify a raw license key if a sale webhook
ever misfires. Prices are the current `priceCents` in `src/lib/launch/offers.ts`.

| OfferKey (SKU) | Product | Price | Buy-link env (`NEXT_PUBLIC_…`) | Verify-id env (`GUMROAD_PRODUCT_ID_…`) |
| :-- | :-- | :-- | :-- | :-- |
| `founding-ally` | Founding Ally Bundle | $150 | `NEXT_PUBLIC_GUMROAD_FOUNDING_ALLY_URL` | `GUMROAD_PRODUCT_ID_FOUNDING_ALLY` |
| `book-digital` | Mastering Allyship — Digital | $15 (PWYW) | `NEXT_PUBLIC_GUMROAD_BOOK_DIGITAL_URL` | `GUMROAD_PRODUCT_ID_BOOK_DIGITAL` (or legacy `GUMROAD_PRODUCT_ID`) |
| `book-physical` | Mastering Allyship — Physical | $25 (preorder) | `NEXT_PUBLIC_GUMROAD_BOOK_PHYSICAL_URL` | `GUMROAD_PRODUCT_ID_BOOK_PHYSICAL` |
| `rpg-handbook-digital` | RPG Handbook — Digital | $30 | `NEXT_PUBLIC_GUMROAD_RPG_DIGITAL_URL` | `GUMROAD_PRODUCT_ID_RPG_HANDBOOK_DIGITAL` |
| `rpg-handbook-physical` | RPG Handbook — Physical | $49 (preorder) | `NEXT_PUBLIC_GUMROAD_RPG_PHYSICAL_URL` | `GUMROAD_PRODUCT_ID_RPG_HANDBOOK_PHYSICAL` |
| `deck-digital` | Oracle Deck — Digital Access | $10 | `NEXT_PUBLIC_GUMROAD_DECK_DIGITAL_URL` | `GUMROAD_PRODUCT_ID_DECK_DIGITAL` |
| `game-subscription` | The Game — Monthly | $10/mo | `NEXT_PUBLIC_GUMROAD_GAME_SUB_URL` | `GUMROAD_PRODUCT_ID_GAME_SUBSCRIPTION` |
| `superpower-connector-pack` | Connector Pack | $8 | `NEXT_PUBLIC_GUMROAD_SP_CONNECTOR_URL` | — |
| `superpower-storyteller-pack` | Storyteller Pack | $8 | `NEXT_PUBLIC_GUMROAD_SP_STORYTELLER_URL` | — |
| `superpower-strategist-pack` | Strategist Pack | $8 | `NEXT_PUBLIC_GUMROAD_SP_STRATEGIST_URL` | — |
| `superpower-disruptor-pack` | Disruptor Pack | $8 | `NEXT_PUBLIC_GUMROAD_SP_DISRUPTOR_URL` | — |
| `superpower-alchemist-pack` | Alchemist Pack | $8 | `NEXT_PUBLIC_GUMROAD_SP_ALCHEMIST_URL` | — |
| `superpower-escape_artist-pack` | Escape Artist Pack | $8 | `NEXT_PUBLIC_GUMROAD_SP_ESCAPE_ARTIST_URL` | — |
| `superpower-coach-pack` | Coach Pack | $8 | `NEXT_PUBLIC_GUMROAD_SP_COACH_URL` | — |
| `loadout-bundle` | Your Loadout Bundle | $20 | `NEXT_PUBLIC_GUMROAD_LOADOUT_BUNDLE_URL` | — |

Notes: superpower packs and the loadout bundle have no verify-id fallback (the
license-verify path covers the core SKUs in `src/lib/launch/grants.ts`). The
loadout bundle's two packs are granted idempotently by SKU, so a deck owner whose
inner pack was already auto-granted isn't re-charged. `GUMROAD_PRODUCT_MAP` can
override product→SKU resolution if a Gumroad permalink doesn't match its URL.

## 4. Access gating

- **Hard gate** (`checkAccess(cap)`) — always enforced. Net-new premium surfaces.
  Currently: **`/deck`** (`deck-digital`). `/oracle` is a public gift, left open.
- **Soft gate** (`checkAccess(cap, { soft: true })`) — dormant until
  `ENABLE_LAUNCH_GATES=true`, and grandfathers pre-cutoff players. Currently:
  **`/play`** and **`/adventures`** (`app-access`). This protects the existing
  community — only post-launch signups without a purchase hit the paywall.
- **Admins always bypass.**

To gate another surface, in a server component:
```ts
const access = await checkAccess('app-access', { soft: true })
if (!access.allowed) return <Paywall title="…" authed={access.authed} />
```

## 5. Go-live checklist

1. Apply migrations: **`npm run db:migrate:deploy`** (resolves the direct
   Postgres URL from `.env`/`.env.local` and records the schema hash). Plain
   `npx prisma migrate deploy` fails if only the Accelerate URL is present.
2. Upload the finished digital files (book, RPG handbook, deck, …) at
   **`/admin/deliverables`** — buyers download them at `/downloads`.
3. Create each Gumroad product; enable license keys; set receipt → `/redeem`.
3. Set the Ping URL with `?token=…`.
4. Set `GUMROAD_WEBHOOK_SECRET` and the `NEXT_PUBLIC_GUMROAD_*_URL` links.
5. Test: buy a cheap/test product → confirm a `RedemptionCode` row appears →
   redeem at `/redeem` → confirm the `Entitlement` and that `/deck` unlocks.
6. At launch: set `LAUNCH_GATE_CUTOFF` (your launch time) and
   `ENABLE_LAUNCH_GATES=true`. Verify an existing (pre-cutoff) player still
   reaches `/play`, and a fresh signup without a purchase sees the paywall.

## Manual fulfillment (fallback)

Before the webhook is configured, an admin can mint a code with the
`mintLaunchCode({ sku })` server action and hand it to a buyer.

## Known follow-ups

- Wire app-access/capability gates into more surfaces as needed.
- Remove the dead `RedemptionPack` model in a later deliberate cleanup.
