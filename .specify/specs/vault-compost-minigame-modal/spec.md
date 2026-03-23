# Spec: Vault compost mini-game (modal) — stub

**Status:** Stub — **to be fully specced**.  
**Relates to:** [vault-page-experience](../vault-page-experience/spec.md), [campaign-hub-spoke-landing-architecture](../campaign-hub-spoke-landing-architecture/spec.md).

## Purpose

A **focused composting experience** usable as a **modal** so players can **free vault capacity without leaving** a hub → spoke **CYOA journey**. Satisfies the **hard inventory gate** on spoke progress (see campaign hub spec).

**Practice:** Deftness — care, not shame; same salvage/archive semantics as full Vault Compost where possible; modal = **interruptible quest-like surface**, not a trap.

---

## Resolved decisions (from parent architecture)

| Topic | Decision |
|-------|----------|
| **Trigger** | CYOA / spoke flow hits **hard block** when emissions would exceed vault caps → prompt to **open compost modal**. |
| **Surface** | **Modal** on top of current journey (do not require navigation to `/hand/compost` as the only path). |
| **Completion** | Player can **finish a compost session** in the modal and **return** to the same CYOA context to **retry** the gated step. |

---

## To be designed (tasks)

- Gameplay loop (steps, time box, salvage ledger integration vs duplicate).  
- Which item types are in-scope in modal v1 (drafts only? quests? charges?).  
- Server actions: reuse `vault-compost` paths vs thin wrapper.  
- Analytics / consent if any AI assists in modal.  
- Accessibility (focus trap, escape behavior = abandon vs save partial).

---

## References

- `src/actions/vault-compost.ts`, `src/app/hand/compost/`, `src/lib/vault-limits.ts`.
