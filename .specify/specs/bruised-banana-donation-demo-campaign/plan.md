# Plan: Bruised Banana donation demo + GSCP (PR #30 retrospective)

## Status

**Merged.** This plan is for **documentation, regression focus, and cert hooks**—not net-new feature work unless a gap is found.

## Code map (primary)

| Area | Entry points |
|------|----------------|
| Demo | `src/app/demo/`, BB public demo routes |
| Donate | `src/app/event/donate/`, `DonationSelfServiceWizard`, donate API routes |
| Auth handoff | `src/actions/conclave.ts`, login `returnTo` normalization |
| GSCP | `src/app/campaign/spoke/[index]/generated/`, `GeneratedSpokeCyoaWizard`, `src/lib/generated-spoke-cyoa/` |
| Events ICS | `src/app/api/events/[id]/ics/` |
| Wiki | `src/app/wiki/campaign/bruised-banana/` |

## When to edit this spec

- Major change to BB `campaignRef` semantics
- New donate or initiation entry that bypasses safe `returnTo`
- GSCP wizard schema or auth gate changes

## Verification

- `npm run validate:routes`
- Manual smoke: demo → donate wizard → login → initiation (staging/local)
