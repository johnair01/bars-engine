# Spec: Bruised Banana donation demo, GSCP spoke wizard, donate auth (PR #30 retrospective)

## Purpose

Canonically document work shipped in **[GitHub PR #30](https://github.com/johnair01/bars-engine/pull/30)** (`feat(campaign): donation demo, GSCP spoke wizard, donate auth handoffs`, **merged**) so outreach, demo, and auth flows have a **spec authority** for maintenance, certification, and ontology alignment.

> **Note:** On GitHub, **#30 is a merged pull request**, not issue **#39**. **Issue #39** is the ontology glossary + architecture note — see [docs/architecture/campaign-ontology-glossary.md](../../../docs/architecture/campaign-ontology-glossary.md) and [campaign-ontology-alignment Phase 1](../campaign-ontology-alignment/tasks.md).

**Practice**: Deftness Development — retrospective spec; verification quests where UX is player-facing.

## Scope (from PR body)

- Public **Bruised Banana demo** (`/demo/bruised-banana`), outreach **donate** surfaces, `DonatePageView`
- **Login `returnTo`** for initiation and donate flows (safe return, conclave auth, donate URL normalize)
- **DonationSelfServiceWizard**: `bruised-banana` ref routes sign-in toward **campaign initiation**
- **Wiki** `/wiki/321-shadow-process`; campaign wiki + initiation nav; `movesGMPacket` Show Up links
- **Route JSDoc** for demo, donate, generated spoke pages (`validate:routes`)
- **GSCP** generated spoke CYOA wizard (actions, lib); **events** API **ICS** under `/api/events/[id]/ics`
- Spec kit + seed for bruised-banana **donation demo BAR**; registry refresh
- **validate-manifest** tuning (demo JSDoc, source-ingestion doc rename)
- Misc as listed in PR (AdventurePlayer, books, wallet, charge capture, cert triage skill, ProfileRoomCanvas, etc.) — treat as **adjacent** unless a regression targets them

## Design decisions

| Topic | Decision |
|-------|----------|
| Campaign key | `bruised-banana` `campaignRef` remains the demo/donation anchor until [campaign-ontology-alignment](../campaign-ontology-alignment/spec.md) migrates identity |
| Auth | Return-to URLs must stay **open-redirect safe** (existing helpers) |
| GSCP | Generated spoke CYOA lives under campaign spoke paths with `?ref=` preservation |

## Related spec kits

- [.specify/specs/donation-self-service-wizard/spec.md](../donation-self-service-wizard/spec.md)
- [.specify/specs/campaign-scoped-donation-cta/spec.md](../campaign-scoped-donation-cta/spec.md)
- [.specify/specs/campaign-ontology-alignment/spec.md](../campaign-ontology-alignment/spec.md)

## Functional requirements (retrospective — verify on regressions)

- **FR1**: `/demo/bruised-banana` and donate paths render and respect campaign ref where configured.
- **FR2**: Sign-in from DSW with BB ref lands in initiation flow with safe `returnTo`.
- **FR3**: `/campaign/spoke/[index]/generated` honors `ref` query and login redirect preserves it.
- **FR4**: `/api/events/[id]/ics` serves ICS for scheduled events when data present.
- **FR5**: `npm run validate:routes` passes for annotated demo/donate/spoke routes.

## Verification quest (optional follow-up)

- Cert quest or runbook step: “Donate wizard → sign in → initiation → return to donate” — tie to Bruised Banana party prep when implemented in Twine cert suite.

## References

- PR #30 description (GitHub)
- `src/components/event/DonationSelfServiceWizard.tsx`, `src/app/event/donate/`, `src/app/campaign/spoke/[index]/generated/`
