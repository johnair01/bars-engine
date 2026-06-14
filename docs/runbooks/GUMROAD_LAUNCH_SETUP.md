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
(idempotent). Recurring renewal charges extend the subscriber’s entitlement;
refunds/disputes void the code and revoke the entitlement.

## 3. Environment variables (Vercel)

| Var | Required | Purpose |
| :-- | :-- | :-- |
| `GUMROAD_WEBHOOK_SECRET` | ✅ | Shared secret in the Ping URL `?token=`. Webhook **fails closed** if unset. |
| `GUMROAD_SELLER_ID` | optional | Pin to your seller id; rejects pings from other sellers. |
| `GUMROAD_PRODUCT_MAP` | optional | JSON `{ "<permalink\|product_id\|product_name>": "<OfferKey>" }`. If unset, product permalinks are derived from the `NEXT_PUBLIC_GUMROAD_*_URL` links. |
| `NEXT_PUBLIC_GUMROAD_*_URL` | per product | The `/launch` buy links (also the fallback product→SKU source). One per SKU — see launch plan. |
| `ENABLE_LAUNCH_GATES` | launch toggle | `true` switches on the **soft** gates (game / app access). Leave unset/false until launch. |
| `LAUNCH_GATE_CUTOFF` | launch toggle | ISO datetime; players created **before** it are grandfathered when soft gates switch on. Set to your launch moment so the existing community keeps access. |

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

1. Apply migrations: `npx prisma migrate deploy` → `npm run db:record-schema-hash`.
2. Create each Gumroad product; enable license keys; set receipt → `/redeem`.
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

- Subscription **cancellation** webhook (let lapse at expiry for now).
- Wire app-access/capability gates into more surfaces as needed.
- Remove the dead `RedemptionPack` model in a later deliberate cleanup.
