# Gumroad Branding Research

> Context: The Allyship Deck sells via Gumroad. We want to know how far we can brand
> the checkout experience to match the BARS dark-warm aesthetic before the next commerce sprint.
> Researched: 2026-06-18.

## Summary

**Product page / storefront: fully brandable (Pro plan). Checkout step: not brandable** —
Gumroad's payment iframe always completes on `gumroad.com`. That's the fundamental tradeoff.

---

## What IS Possible

### Storefront & product page (Gumroad Pro, $10/mo)

- Full custom CSS on product pages and storefronts — colors, fonts, backgrounds, card layouts,
  buttons, price tags, descriptions, variants, ratings. Dark aesthetic is achievable.
- Custom domain (`masteringallyship.com` or subdomain) for a branded URL.
- Upload custom logo/banner; remove "Powered by Gumroad" branding.

### Overlay / embed button

- Embed Gumroad as a **modal overlay** on your own page — users stay on your site until they
  hit the payment step, then the modal opens Gumroad's checkout.
- The overlay trigger can be any HTML element you style to match the design system.
- A "Highlight Color" setting tints overlay buttons/links to a single brand color (use
  `#C9A84C` gold or `#7c3aed` liminal purple).

---

## What IS NOT Possible

| Limitation | Detail |
|---|---|
| Checkout page CSS | The payment iframe is read-only — no CSS injection. Security/PCI restriction. |
| Custom checkout domain | Checkout always completes on `gumroad.com`. No white-label. |
| API-driven checkout | The Gumroad API manages products/offers but exposes no checkout endpoints. |
| Embedded payment form | Cannot build a fully on-site Stripe-style form through Gumroad. |

---

## Recommended Approach

1. **Upgrade to Gumroad Pro** — enables custom domain + full CSS on the product page.
2. **Brand the product page heavily** — match `--bars-bg-base`, gold accents, Jost font.
   Use the CSS snippet library (see Gumroad Help → Custom CSS) as a starting point.
3. **Use the overlay embed** on `/deck/sales` — custom-styled "Get the deck" button that opens
   the Gumroad overlay modal. Users never leave the page until payment.
4. **Accept the redirect at checkout** — this is the unavoidable gap. One option: use a branded
   post-purchase redirect URL back to `/deck` to resume the experience immediately.

### Alternative if full branding is required

**Stripe Checkout** or **Lemon Squeezy** offer fully embedded, on-domain checkout that never
leaves your app. Either would require migrating away from Gumroad for new purchases (existing
Gumroad customers keep their access via the current entitlement webhook).

---

## Action Items Before Commerce Sprint

- [ ] Upgrade Gumroad account to Pro ($10/mo)
- [ ] Set up `masteringallyship.com` as a Gumroad custom domain
- [ ] Write custom CSS for Gumroad product page to match BARS aesthetic
- [ ] Switch `/deck/sales` CTAs to use the Gumroad overlay embed (`.gumroad-button` class or
  JS SDK) rather than a plain `href` link
- [ ] Configure post-purchase redirect to `/deck` with a `?welcome=1` param to trigger a
  first-draw prompt
- [ ] Evaluate Lemon Squeezy as an alternative if full checkout branding becomes a requirement

---

## Sources

- [Gumroad Help — Build Gumroad into Your Website](https://help.gumroad.com/article/44-build-gumroad-into-your-website)
- [Gumroad Help — Custom Domains](https://help.gumroad.com/article/153-setting-up-a-custom-domain)
- [Gumroad Help — Common CSS Snippets](https://help.gumroad.com/article/168-common-css-snippets)
- Influencer Marketing Hub — Gumroad Review 2025
- Backendo — Integrating Gumroad Checkout Into Your Website
