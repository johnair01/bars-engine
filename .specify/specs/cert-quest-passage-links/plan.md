# Plan: Certification Quest Passage Links

## Approach

Audit and update passage `text` and `cleanText` in seed-cyoa-certification-quests.ts. Add markdown links wherever a URL or route is mentioned.

## File impacts

| Action | Path |
|--------|------|
| Modify | scripts/seed-cyoa-certification-quests.ts |

## Passages to audit

- cert-lore-cyoa-onboarding-v1: STEP_1 (/wiki), STEP_2 (/event), STEP_3 (/campaign?ref=bruised-banana)
- cert-two-minute-ride-v1: STEP_1 (/event), STEP_2 (/), STEP_3 (/campaign), STEP_4 (BB_Moves_ShowUp), STEP_5 (/event/donate), STEP_6
- cert-avatar-from-cyoa-v1, cert-k-space-librarian-v1, etc.
