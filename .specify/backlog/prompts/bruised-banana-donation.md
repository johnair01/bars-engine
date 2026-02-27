# Prompt: Bruised Banana Donation Link + Vibeulon Mint

**Use this prompt when implementing the donation flow for the Bruised Banana Residency campaign.**

## Prompt text

> Implement the donation link and vibeulon mint per [.specify/specs/bruised-banana-donation/spec.md](../../specs/bruised-banana-donation/spec.md). Surface `/event` from landing and campaign; configure Instance with Stripe URL and goal; add vibeulon mint on donation so Energy (vibeulons) flows when players support the cause. Use the game language: Energy = vibeulons; donation = contribution that triggers Energy flow.

## Checklist

- [ ] Landing has "Support the Residency" or "Donate" link to `/event`
- [ ] Campaign has Donate CTA
- [ ] Instance configured with goalAmountCents, stripeOneTimeUrl, isEventMode
- [ ] Vibeulon mint on donation (webhook, manual, or "Claim support token")

## Reference

- Spec: [.specify/specs/bruised-banana-donation/spec.md](../../specs/bruised-banana-donation/spec.md)
- Plan: [.specify/specs/bruised-banana-donation/plan.md](../../specs/bruised-banana-donation/plan.md)
- Cursor plan: [.cursor/plans/bruised_banana_campaign_unblock_3fab45ae.plan.md](../../../.cursor/plans/bruised_banana_campaign_unblock_3fab45ae.plan.md)
