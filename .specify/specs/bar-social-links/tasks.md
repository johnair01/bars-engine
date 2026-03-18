# Tasks: BAR Social Links

## Phase 1: Schema and API

- [x] **1.1** Add BarSocialLink model to prisma/schema.prisma
- [x] **1.2** Add socialLinks relation to CustomBar
- [x] **1.3** Create migration; run db:sync
- [x] **1.4** Create src/lib/bar-social-links.ts — platform detection, allowlist, validateUrl
- [x] **1.5** Create src/actions/bar-social-links.ts — addBarSocialLink, removeBarSocialLink
- [x] **1.6** Include socialLinks in getBarDetail (bars.ts)

## Phase 2: BAR Create/Edit UI

- [x] **2.1** Create BarSocialLinksForm — URL input, platform badge, remove, max 5
- [x] **2.2** Add Inspirations section to CreateBarFormPage
- [x] **2.3** Extend createPlayerBar to accept social link URLs (optional)
- [x] **2.4** Add Inspirations section to BAR detail (owner edit)

## Phase 3: BAR Detail Display

- [x] **3.1** Create BarSocialLinks component — platform labels, links, notes
- [x] **3.2** Add BarSocialLinks to BAR detail page

## Verification

- [ ] Manual: create BAR with 1–2 inspiration links
- [ ] Manual: view BAR detail — links display with labels
- [ ] Manual: add/remove links on BAR edit
- [ ] `npm run build` and `npm run check` pass
