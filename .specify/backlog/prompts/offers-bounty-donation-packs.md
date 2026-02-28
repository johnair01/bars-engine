# Prompt: Offers, Bounty Board, and Donation Packs

**Use this prompt when implementing the bounty board and donation packs feature for the residency launch.**

## Prompt text

> Implement the Offers, Bounty Board, and Donation Packs per [.specify/specs/offers-bounty-donation-packs/spec.md](../specs/offers-bounty-donation-packs/spec.md). Add a Bounty Board where players stake vibeulons on public quests (allowing multiple completions and/or bigger payouts); distinguish system vs bounty quests in the Market; and introduce Donation Packs (Pokemon booster-style BARs redeemable for vibeulons) so donation-to-vibeulon conversion has an arcade/raffle feel. Use game language: Energy = vibeulons; bounties = user-created quests with staked Energy; packs = BARs that reveal Energy on redemption.

## Checklist

- [ ] Schema: CustomBar.stakedPool, questSource; BountyStake or escrow; RedemptionPack; Instance.packConfig
- [ ] Bounty creation: QuestWizard Bounty mode; stake escrow; createQuestFromWizard bounty params
- [ ] Quest engine: Pay from escrow for bounties; enforce maxAssignments
- [ ] Market: Bounty badge; optional Bounties vs System filter
- [ ] redeemPack action; admin createPackForPlayer
- [ ] Your Packs UI on /event or /wallet
- [ ] Stripe webhook (optional, when ready)
- [ ] Verification quest cert-offers-bounty-packs-v1

## Reference

- Spec: [.specify/specs/offers-bounty-donation-packs/spec.md](../specs/offers-bounty-donation-packs/spec.md)
- Plan: [.specify/specs/offers-bounty-donation-packs/plan.md](../specs/offers-bounty-donation-packs/plan.md)
- Tasks: [.specify/specs/offers-bounty-donation-packs/tasks.md](../specs/offers-bounty-donation-packs/tasks.md)
