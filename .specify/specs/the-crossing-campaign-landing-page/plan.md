# Plan: The Crossing Campaign Landing Page

## Phase 1: Spec Kit

Create focused implementation spec, plan, and tasks.

## Phase 2: Static Role Model

Add role definitions for:

- Car Scout
- Car Person
- Connector
- Signal Booster
- Encourager
- Donor

Include domains, tiny moves, artifacts, CTA labels, starter cards, and boundary copy.

## Phase 3: Public Page Surface

Integrate the support section into `/campaign/[ref]` when `ref` is `the-crossing`.

Render a static fallback page for `the-crossing` if no approved/live campaign record exists yet.

## Phase 4: BAR Capture

Add a public server action that:

- validates role and basic form fields
- resolves a steward player id
- creates a `CustomBar`
- stores contributor metadata and campaign lineage
- redirects back to `/campaign/the-crossing?thanks=1`

## Phase 5: Verification

Run type/lint or targeted checks available locally.

If a database is available, submit one test support BAR and verify the stored fields.

## Phase 6: Design Handoff

Capture the next design direction for Claude Design:

- Turn the landing page into a choose-your-own-adventure role selection experience.
- Move full story content to a separate story page.
- Rename "How to Contribute" to "How To Play."
- Replace form-first role cards with clickable role/path cards.
- Add dedicated role detail pages with Allyship Deck moves.
- Add Superpower Quiz and BARS Engine signup pathways.
- Make Donor path support a fast Venmo action.

## File Impacts

- `src/lib/the-crossing-support-moves.ts`
- `src/actions/the-crossing-support.ts`
- `src/app/campaign/[ref]/page.tsx`
- `src/app/campaign/[ref]/CampaignLanding.tsx`
- `src/app/campaign/[ref]/TheCrossingSupportSection.tsx`
- `.specify/specs/the-crossing-campaign-landing-page/DESIGN_HANDOFF.md`

## Risks

- No steward player exists in the connected DB.
- Existing campaign route only exposes approved/live campaigns.
- Support form creates follow-up burden before a steward inbox UI exists.

## Mitigations

- Use static fallback for `/campaign/the-crossing`.
- Resolve steward id with explicit env override first.
- Store support BARs as private campaign inbox records for EOD.
