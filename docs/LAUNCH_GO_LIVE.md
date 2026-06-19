# Launch + Fundraiser Go-Live Checklist

> The single source of truth for what stands between today and a walkable
> buy → unlock path and a live car fundraiser. Check items off as you go.
>
> Legend: 🔴 blocker (path is broken until done) · 🟡 high (works but buyers
> drop off / find nothing) · 🟢 polish · ✅ already working, no action.

## 🔴 Blockers — nobody can walk the paths until these are done

### Car fundraiser
- [x] **Seed the barn against the live DB** — `npm run seed:barn`
      (Creates the event Instance + 3 active walls: car $8,500 / pre-sale
      $5,000 / runway $1,500/mo. Idempotent; preserves raised totals.)
- [ ] **Verify the car path:** load `/event/barn` → three walls render →
      "Chip in for the car" → report a $1 test donation while logged in →
      car wall increments. If it errors *"the car wall isn't active yet,"*
      the seed hit a different DB than the app reads.

### Deck launch
- [ ] **Set all 7 `NEXT_PUBLIC_GUMROAD_*_URL` env vars** in Vercel. Any unset
      one renders its "Buy" button as **"Setup pending"** (dead end).
      Deck = `NEXT_PUBLIC_GUMROAD_DECK_DIGITAL_URL`.
- [ ] **Set `GUMROAD_WEBHOOK_SECRET`** in Vercel, then point each Gumroad
      product's **Ping URL** at
      `https://<your-domain>/api/webhooks/gumroad?token=<GUMROAD_WEBHOOK_SECRET>`.
      Without the secret the webhook rejects every sale → no code minted.

## 🟡 High — paths work but buyers fall off or find nothing

- [ ] **Enable Gumroad license keys on every product.** This is how the buyer
      actually receives their unlock code.
- [ ] **Set the `GUMROAD_PRODUCT_ID_*` env vars** (one per SKU). Powers the
      `/redeem` fallback that verifies a raw license key if a webhook misfires.
- [ ] **Point each Gumroad product's "redirect after purchase" → `/success`.**
      Optionally `…/success?sku=deck-digital` to name the product. Bridges
      Gumroad's receipt back into `/redeem`.
- [ ] **Upload deliverable files** at `/admin/deliverables` for `book-digital`
      and `rpg-handbook-digital`. Otherwise an owner redeems, hits
      `/downloads`, and finds it empty. (The deck needs no upload — it's the
      in-app surface at `/deck`.)
- [ ] **Configure the barn's payment links** at
      `/campaign/mtgoa-barn-raising/fundraising` (Stripe / Venmo / PayPal /
      Cash App). The honor-system donate form only shows the buttons you set.

## 🟢 Polish — discoverability & flow (shipping on PR #125)

- [x] Fix the dead `/game/` PLAY link → `/game/index.html` (nav + homepage).
- [x] Add DECK (`/deck/sales`) and Redeem (`/redeem`) to the logged-out nav.
- [x] Surface `/event/barn` from the homepage "Support" CTA and the `/event`
      hub (campaign-aware, so non-barn campaigns keep normal routing).
- [ ] Confirm the **$8,500 car target** vs the $7,000 research figure before
      announcing.

## ✅ Already working — no action needed

- Deck app + sales + 120 real cards + "Send to BARS" + paywall + `/collection`.
- Gumroad sale → **auto-credits the pre-sale wall** — deck/book sales raise
  the barn once it's seeded.
- `/redeem` (both minted-code and raw-license paths) → grants capability →
  gates open.
- Honor-system car donation flow end-to-end (once walls are seeded).
- `/event` fundraiser hub is fully public and works signed-in or out.
- `/success` post-purchase return surface (PR #125).

---

## Demo walkthrough mode (no Gumroad needed)

To walk the full logged-out **buy → success → redeem → unlock** flow without
creating a single Gumroad product — e.g. to show stakeholders the funnel and
critique its ergonomics — set one env var on a **preview / staging** deploy:

```bash
NEXT_PUBLIC_LAUNCH_DEMO_MODE=1
```

What it does: every `/launch` offer (including SKUs whose Gumroad URL isn't
wired yet) routes to an internal `/launch/demo-checkout` that mints a **real**
`RedemptionCode` (`source: 'demo'`) and hands off to the normal
`/success → /redeem → Entitlement` pipeline. Only the payment screen is
replaced; the genuine redemption mechanics run unchanged.

- **Off by default.** Going live = leave it unset on Production. There is no
  code to remove. When unset, `/launch/demo-checkout` 404s and offer cards link
  to Gumroad (or read "Setup pending").
- **It's a build-time `NEXT_PUBLIC_` var** — set it on the Preview environment
  only, redeploy, and your demo link is live while Production stays real.
- **Use a staging database.** Demo redemptions write real rows to whatever DB
  that deploy points at — never run it against the production DB.
- **Cleanup:** every demo row is tagged `source: 'demo'`. Remove them with
  `npm run launch:demo:clean` (dry-run; add `-- --apply` to delete).

## Checking your setup

`npm run launch:check` reports, per SKU, whether the buy link and license-verify
product id are wired plus the global webhook config — run it after setting the
Gumroad env vars to confirm what Production will actually serve (add
`-- --strict` to fail if any offer is only partially wired).

---

## Fastest route to "walkable by EOD"

The four 🔴 items — one DB seed (done) plus three Gumroad/Vercel settings —
unlock both flows. The 🟡 items prevent the most common drop-off ("I paid but
nothing happened").
