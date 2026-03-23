# Plan: Vault compost mini-game (modal)

Expand [.specify/specs/vault-compost-minigame-modal/spec.md](./spec.md) after stub review.

1. Reuse **Vault Compost** salvage/archive semantics where possible (`vault-compost` actions).  
2. **Modal shell** shared component: invoked from CYOA / spoke gated step + optional `/hand` entry.  
3. **v1 scope:** smallest item set that frees **draft** and/or **unplaced quest** slots (match `vault-limits` enforcement).  
4. Tests: modal open/close, cap check before CYOA emission retry.
