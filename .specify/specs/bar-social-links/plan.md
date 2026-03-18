# Plan: BAR Social Links

## Phase 1: Schema and API

1. Add `BarSocialLink` model to Prisma schema
2. Add relation on CustomBar
3. Create migration
4. Implement `addBarSocialLink`, `removeBarSocialLink`, `listBarSocialLinks` server actions
5. URL validation: allowlist + platform detection

## Phase 2: BAR Create/Edit UI

1. Add "Inspirations" section to CreateBarFormPage (after Photos, before Intent)
2. Add "Inspirations" section to BAR detail edit (BarFaceBackTabs or dedicated section)
3. Link input with paste detection; platform badge; remove button
4. Max 5 links validation in UI and server

## Phase 3: BAR Detail Display

1. Fetch social links in getBarDetail
2. Add BarSocialLinks component: platform labels, links, optional notes
3. Plain link cards (no oEmbed in v0); future: rich preview

## File Impacts

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add BarSocialLink model, CustomBar relation |
| `prisma/migrations/` | New migration |
| `src/actions/bar-social-links.ts` | New — add, remove, list, validate |
| `src/lib/bar-social-links.ts` | New — platform detection, allowlist |
| `src/app/bars/create/CreateBarFormPage.tsx` | Add Inspirations section |
| `src/app/bars/[id]/page.tsx` | Include socialLinks in getBarDetail |
| `src/components/bars/BarSocialLinks.tsx` | New — display links |
| `src/components/bars/BarSocialLinksForm.tsx` | New — add/remove links form |

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Platform ToS changes | Start with plain links; defer rich embeds |
| Link rot | Accept; no preview fetch in v0 |
| XSS via URLs | Strict allowlist; no arbitrary domains |
