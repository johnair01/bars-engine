# Prompt: Wire non-book SKU Gumroad product ids (light up license-verify for every offer)

**Use when:** activating the per-SKU license-verify fallback shipped in the launch×paywall integration so deck / RPG handbook / subscription / etc. can be unlocked by a Gumroad license key — not just the digital book.

## Context

PR #107 (launch-paywall-integration) added per-SKU license verification: `verifyLicense(key, { sku })` resolves the Gumroad product id from `GUMROAD_PRODUCT_ID_<SKU>` (e.g. `GUMROAD_PRODUCT_ID_DECK_DIGITAL`), and `resolveLicense(key)` in `/redeem` probes a bare key across **every SKU that has a product id configured**. Today only `book-digital` is wired (via the legacy `GUMROAD_PRODUCT_ID`), so the `/redeem` license-key fallback only resolves the book. The webhook → RedemptionCode path still covers all SKUs when it fires; this closes the missed-webhook gap for non-book SKUs.

`OfferKey`s: `book-digital`, `rpg-handbook-digital`, `deck-digital`, `game-subscription`, `book-physical`, `rpg-handbook-physical`, `founding-ally`. Env var pattern: `GUMROAD_PRODUCT_ID_<UPPER_SNAKE>` (e.g. `GUMROAD_PRODUCT_ID_RPG_HANDBOOK_DIGITAL`). See `src/lib/gumroad.ts` `productIdForSku`/`skusWithProduct`.

## Prompt text

> For each launch SKU sold on Gumroad with license keys enabled, set its `GUMROAD_PRODUCT_ID_<SKU>` env var (Vercel + `.env.local`) and confirm `/redeem` resolves a real license key for that SKU end-to-end (mock-mode test `TEST-<sku>-…`, then a live key). Document the env-var convention in `docs/ENV_AND_VERCEL.md` (table: SKU → env var → Gumroad product). Keep the legacy `GUMROAD_PRODUCT_ID` mapped to `book-digital` for back-compat. Note the known degradation: a **subscription** SKU redeemed via the `resolveLicense` fallback has no `subscriptionId` link so it won't auto-renew — fine for a missed webhook, but flag it in the docs.

## Reference

- `src/lib/gumroad.ts` (`productIdForSku`, `skusWithProduct`, `verifyLicense`, `resolveLicense`)
- `src/lib/launch/offers.ts` (`OfferKey`), `src/actions/entitlements.ts` (`redeemLaunchCode`)
- `.specify/specs/launch-paywall-integration/spec.md` (Phase 2; "Follow-ups")
- `docs/ENV_AND_VERCEL.md`
