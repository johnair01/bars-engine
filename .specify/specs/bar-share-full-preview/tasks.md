# Tasks: BAR Share Full Preview

## Phase 1: Data and SharePreview

- [x] **1.1** Extend share page query to include bar.assets and bar.socialLinks
  - `bar: { include: { assets: true, socialLinks: true } }` or equivalent select
  - Ensure assets have url, mimeType, side; socialLinks have platform, url, note
- [x] **1.2** Update SharePreview component to accept assets and socialLinks props
  - Extend Share type; pass from page
- [x] **1.3** Render BAR photos in SharePreview
  - Reuse BarFaceBackTabs (read-only) or BarListThumb
  - If BarFaceBackTabs requires edit controls, add `readOnly` prop or create ShareBarPhotos
- [x] **1.4** Render BarSocialLinks in SharePreview
  - Import BarSocialLinks; pass links from share.bar.socialLinks
  - Read-only (no form)

## Phase 2: Layout and verification

- [x] **2.1** Ensure SharePreview layout is mobile-first
  - Photos and links stack correctly on narrow viewports
- [x] **2.2** Verify asset URLs are publicly accessible
  - Vercel Blob URLs do not require auth
- [x] **2.3** Run npm run build and npm run check

## Verification

- [ ] Unauthenticated recipient sees BAR photos on shared link
- [ ] Unauthenticated recipient sees and can click inspiration links
- [ ] Claim/Login/Signup CTAs remain below preview
- [ ] Mobile layout correct
