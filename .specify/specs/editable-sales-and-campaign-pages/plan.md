# Editable Sales And Campaign Pages Plan

## Phase 1: Shared Permission And Storage Helpers

- Reuse the existing app-config JSON pattern from the `/launch` editor.
- Add reusable helpers for admin checks and campaign steward checks where practical.
- Keep global page content normalization separate from server-only database reads.

## Phase 2: `/awaken`

- Move hardcoded visible copy into a typed default content object.
- Load admin overrides from `AppConfig.theme.awakenPage`.
- Add an inline admin editor that edits the hero, stats, move cards, event details, and secondary links.
- Save via a server action that validates admin access and revalidates `/awaken`.

## Phase 3: Campaign Landing Pages

- Add campaign-page edit permission resolution to `/campaign/[ref]`.
- For DB campaigns, save edits into the existing campaign fields and theme poster field.
- For static fallback pages such as The Crossing, save edits into `AppConfig.theme.campaignPageFallbacks[slug]`.
- Add an inline owner/admin editor to the landing page.

## Phase 4: Verification

- Run focused lint against touched files.
- Check that server-only imports do not cross into client components.
- Document any known unrelated validation blockers.
