# Editable Sales And Campaign Pages

## Goal

Allow trusted operators to edit public-facing page copy without a code deploy.

This extends the current "campaign owners can edit pages they own" behavior to:
- global sales/funnel pages owned by the site admin (`/launch`, `/awaken`)
- campaign landing pages owned by campaign stewards (`/campaign/[ref]`, including `/campaign/the-crossing`)

## Users

- Admin: can edit global launch/sales pages and any campaign landing page.
- Campaign owner/steward: can edit campaign landing pages for campaigns they own or steward.
- Public visitor: sees the latest approved copy and images, with no editing controls.

## Requirements

1. `/launch` copy and imagery remains editable by admins.
2. `/awaken` page copy, card copy, event details, and secondary link text can be edited by admins.
3. `/campaign/[ref]` landing copy can be edited by admins and campaign owner/steward roles.
4. `/campaign/the-crossing` uses the dedicated live The Crossing route, not the deprecated generic campaign fallback, and can be edited by admins.
5. Editing copy must not alter product SKU identifiers, checkout URLs, donation logic, event signup logic, or campaign membership logic.
6. Saved changes must be persisted in existing storage. No database migration is required for this iteration.
7. Save actions must revalidate the public page immediately after a successful save.
8. Save actions must write an admin audit log or equivalent audit record where the actor is known.
9. If storage is unavailable, pages render their defaults rather than crashing.

## Data Model

Global page overrides are stored in `AppConfig.theme`:

```json
{
  "launchPage": {},
  "awakenPage": {},
  "theCrossingPage": {}
}
```

Campaign landing pages that exist in the database use existing typed `Campaign` columns:
- `name`
- `description`
- `wakeUpContent`
- `showUpContent`
- `storyBridgeCopy`

Campaign poster image editing can use `CampaignTheme.posterImageUrl` when a DB campaign exists.

## Acceptance Criteria

- Admin sees editing controls on `/awaken`.
- Admin sees editing controls on the dedicated `/campaign/the-crossing` route.
- Owner/steward of a DB campaign sees editing controls on their campaign landing page.
- Non-admin/non-owner visitor never sees editing controls.
- Saving `/awaken` updates the public page after refresh.
- Saving The Crossing updates `AppConfig.theme.theCrossingPage` and the public dedicated route after refresh.
- Focused lint/type checks for touched files pass, or any unrelated blocker is documented.
