# Spec: Admin Editable Launch Page

## Goal

Allow logged-in admins to edit the public `/launch` page copy and product imagery without changing code or redeploying.

## Users

- Public visitor: sees the launch page with the configured text/images.
- Admin: sees an editor on `/launch` when logged in with the `admin` role.

## Requirements

- Admin-only editing must be hidden from non-admin visitors.
- Public page must render when the database is unavailable, falling back to code defaults.
- Editable content includes:
  - Header eyebrow, title, body.
  - "How the pieces fit" labels.
  - Intent chooser labels/descriptions.
  - Per-offer display name, blurb, best-for label, kicker, unlock summary, context, card image URL, hero image URL.
- SKU keys, prices, Gumroad URLs, pay-what-you-want behavior, and pending/live states remain controlled by `src/lib/launch/offers.ts`.
- Persist content in the existing `AppConfig.theme` JSON under `launchPage` to avoid a migration for V1.
- Save action must require admin role.
- Saving must revalidate `/launch`.

## Acceptance

- Admin logged in: `/launch` shows an "Admin launch editor" panel.
- Non-admin/logged-out: no edit controls are visible.
- Editing text/image URLs and saving updates the rendered page.
- Empty fields fall back to safe defaults rather than breaking images or content.
- Existing Gumroad fallback behavior remains intact.
