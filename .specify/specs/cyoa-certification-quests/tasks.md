# Tasks: CYOA Certification Quests (EM)

## Implementation (FR1–FR4)

- [x] **FR1** Twine story `cert-cyoa-onboarding-v1` — steps: landing CTA → campaign → sign-up redirect → first quest
- [x] **FR2** `CustomBar` id `cert-cyoa-onboarding-v1`, `isSystem: true`, `visibility: public`, reward
- [x] **FR3** Idempotent seed: `npm run seed:cert:cyoa` → `scripts/seed-cyoa-certification-quests.ts`
- [x] **FR4** Completion mints via existing quest/Twine completion path

## Verification

1. `npm run seed:cert:cyoa`
2. **Adventures** → find **Certification: CYOA Onboarding V1** (badge: Certification)
3. Play through; confirm links to `/`, `/campaign`, `/conclave/onboarding` work
4. Complete → vibeulon reward

## Related

- [cyoa-onboarding-reveal testing](../cyoa-onboarding-reveal/testing.md) (if present)
- [LOOP_READINESS_CHECKLIST.md](../../../docs/LOOP_READINESS_CHECKLIST.md) — includes `seed:cert:cyoa` in pre-launch order
