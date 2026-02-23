# Spec: Economy Translation (Attunement & Transmutation)
## Description
The Vibeulon economy operates on two layers: persistent Global reserves and context-specific Local instance balances.
- **Global Vibeulons**: Player-owned, persistent across all worlds and instances.
- **Local Vibeulons**: Bounded to a specific instance (Event/Conclave). Used for local leverage and rewards within that context.
- **Attunement**: A player move to move Vibeulons from Global -> Local.
- **Transmutation**: A governed move to move Vibeulons from Local -> Global or another instance. Requires ratification.

## Core Rules
- BARs (kernels) are global and portable.
- Quests (runs) are instance-scoped.
- Local liquidity is scarce to preserve choice value.
- No automatic reverse attunement.

## Acceptance Criteria
- [ ] Player can view Global and Local balances simultaneously.
- [ ] `attune` action deducts from Global and adds to Local for a specific Instance.
- [ ] `spend` action uses Local balance if initialized; fails if insufficient.
- [ ] `transmute` action requires a Role with 'Ratifier' permissions for the target domain.
- [ ] All move types (MINT, ATTUNE, SPEND, TRANSMUTE) are recorded in an immutable `VibeulonLedger`.
