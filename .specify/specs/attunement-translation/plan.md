# Plan: Economy Translation
## Architectural Approach
We will implement an append-only ledger system to track all Vibeulon movements.
- **Schema**: Add `VibeulonLedger` model and `InstanceParticipation` model to Prisma.
- **Services**: Create a `LedgerService` to handle all balance mutations via transaction-wrapped events.
- **Validation**: Strict checks on local vs global scope in all spending actions.

## Impacted Files
- `prisma/schema.prisma`: New models for Ledger and Participation.
- `src/actions/wallet.ts`: Update to support multi-layer views.
- `src/actions/engine.ts`: Update quest reward/spend logic to use Local liquidity first.
- `src/lib/economy.ts`: (New) Centralized logic for attunement and transmutation.

## Minimizing Changes
Avoid touching core auth or player identity models. Use relation-based participation records to track local state relative to a player.
