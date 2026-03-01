# Tasks: Certification Feedback Stability

## Phase 1: Investigation

- [ ] Reproduce: open cert quest, go to FEEDBACK, type; note when navigation occurs.
- [ ] Identify trigger: auth, revalidate, layout, or client effect.
- [ ] Document root cause in plan.md.

## Phase 2: Fix

- [x] Add sessionStorage persistence for feedback text; restore when re-entering FEEDBACK (safeguard for unexpected navigations).
- [ ] Verify: type for 30+ seconds on FEEDBACK; no redirect. (Root cause not reproduced; safeguard in place.)

## Verification

- [ ] cert-lore-cyoa-onboarding-v1: Report Issue → type feedback → no dashboard redirect.
- [ ] cert-two-minute-ride-v1: Same.
