# Backlog Prompt: Public BARs in Library

## Spec

- Spec: [.specify/specs/public-bars-library/spec.md](../specs/public-bars-library/spec.md)
- Plan: [.specify/specs/public-bars-library/plan.md](../specs/public-bars-library/plan.md)
- Tasks: [.specify/specs/public-bars-library/tasks.md](../specs/public-bars-library/tasks.md)

## Summary

Provide a place for players to browse public BARs for discovery—in the Library, not the marketplace. The marketplace is for quests to claim; the Library is for BARs to browse. Implement /library/bars with list of public CustomBars.

## Key Deliverables

- **Route**: /library/bars
- **Content**: List public BARs (visibility='public', status='active')
- **Library integration**: Replace "Coming soon" placeholder with link to Public BARs
- **Distinction**: Library = discovery; Marketplace = claimable quests

## Dependencies

- Game Map and Lobby Navigation (FP)
- Onboarding BARs Wallet (clarifies filters)
