# Backlog Prompt: Onboarding BARs in BARs Wallet (Not Marketplace)

## Spec

- Spec: [.specify/specs/onboarding-bars-wallet/spec.md](../specs/onboarding-bars-wallet/spec.md)
- Plan: [.specify/specs/onboarding-bars-wallet/plan.md](../specs/onboarding-bars-wallet/plan.md)
- Tasks: [.specify/specs/onboarding-bars-wallet/tasks.md](../specs/onboarding-bars-wallet/tasks.md)

## Summary

BARs generated in the Bruised Banana onboarding flow must appear in the creator's BARs wallet and **not** in the marketplace. Exclude onboarding BARs from marketplace query (completionEffects contains onboarding:true or sourceType='onboarding').

## Key Deliverables

- **Marketplace exclusion**: getMarketQuests excludes CustomBars where completionEffects contains "onboarding":true
- **Wallet inclusion**: Creator's onboarding BARs appear in /bars and /hand (verify existing behavior)
- **Optional**: Add sourceType to CustomBar for clearer semantics

## Dependencies

- Campaign Onboarding Twine v2
- Market Redesign for Launch
