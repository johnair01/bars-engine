# Plan: Bruised Banana Residency Ship

## Summary

Orchestrate unblocking (PD, loop:ready), pre-launch seeds, and daemons concept documentation so the Bruised Banana residency can ship with a playable main game loop. Daemons implementation is deferred; create backlog prompt only.

## Implementation Order

### Phase 1: Unblock (no deploy required)

1. **Daemons backlog prompt** — Create `.specify/backlog/prompts/daemons-inner-work-collectibles.md`. No code; pure documentation.
2. **PD verification** — PD scripts exist (`verify-production-db`, `ensure-admin-local`). Document runbook in ENV_AND_VERCEL if not already. Run against prod when URL available.
3. **loop:ready** — Run `npm run loop:ready` or `loop:ready:quick` with `DATABASE_URL` set. Fix any failures.

### Phase 2: Pre-launch (when deploy works)

4. **Pre-launch seeds** — Run in order: `seed:party`, `seed:quest-map`, `seed:onboarding`, `seed:cert:cyoa`.
5. **Manual smoke** — Follow LOOP_READINESS_CHECKLIST Section 3.

### Phase 3: Daemons (post-residency)

6. Create full spec from backlog prompt; implement Reliquary, talisman earning, use-in-quests.

## File Impacts

| Action | File |
|--------|------|
| Create | `.specify/backlog/prompts/daemons-inner-work-collectibles.md` |
| Create | `.specify/specs/bruised-banana-residency-ship/spec.md` |
| Create | `.specify/specs/bruised-banana-residency-ship/plan.md` |
| Create | `.specify/specs/bruised-banana-residency-ship/tasks.md` |
| Edit | `.specify/backlog/BACKLOG.md` — add residency ship item if desired |

## Verification

- [ ] Daemons prompt exists and is coherent
- [ ] loop:ready passes (with DATABASE_URL)
- [ ] PD scripts run successfully against prod (when URL available)
- [ ] Pre-launch seeds run; Bruised Banana content exists
- [ ] Manual smoke: auth, quest complete, wallet update
