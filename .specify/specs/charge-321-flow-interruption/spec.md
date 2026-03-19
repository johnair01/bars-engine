# Charge → 321 → (Quest, BAR, Enemy, Daemon) Flow Interruption

**Source**: [STRAND_CONSULT.md](./STRAND_CONSULT.md) — Game Master consultation on major flow interruption.

## Problem

Charge → 321 → (Quest, BAR, Enemy, daemon). The current flow that completes is **daemon**. Everything else routes back to dashboard without an alert as to what work was done and what the player needs to do next.

**Hypotheses**:
1. Work is being saved but NOT informing the user (success-without-feedback)
2. Work is being interrupted — wiring problem (flow breaks before completion)
3. Both — some paths save, some break; user can't tell which

## Design Principle (to add)

- Major flows can't be interrupted
- We need to identify which flows complete and which don't

## Acceptance Criteria

- [x] Each branch (Quest, BAR, daemon, artifact) has explicit success/failure feedback (toast)
- [x] No silent redirects: Fuel System now redirects to / with toast; Create BAR shows toast before redirect
- [x] Design docs updated: FOUNDATIONS.md "UX: Major Flows Cannot Be Interrupted"
- [ ] Instrumentation to identify which flows complete (future)
