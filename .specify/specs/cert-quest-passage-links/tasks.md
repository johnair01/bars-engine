# Tasks: Certification Quest Passage Links

## Phase 1: Audit

- [ ] List all cert quest passages that mention URLs but lack markdown links.
- [ ] Prioritize: cert-lore-cyoa-onboarding-v1, cert-two-minute-ride-v1.

## Phase 2: Update seed

- [x] PassageRenderer now uses `passage.text` (has markdown links) instead of `passage.cleanText` for content.
- [x] Seed already has markdown links in passage.text; no seed change needed.

## Verification

- [ ] cert-lore-cyoa-onboarding-v1 STEP_1: /wiki appears as clickable link, opens in new tab.
- [ ] cert-two-minute-ride-v1: each step with URL has clickable link.
