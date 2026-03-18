# Plan: BAR Share Full Preview

## Overview

Extend the shared BAR view (`/bar/share/[token]`) to show full BAR content — photos, social links — for unauthenticated recipients. Claiming/keeping still requires auth.

## Phases

### Phase 1: Data and SharePreview

1. Extend share page query to include `bar.assets` and `bar.socialLinks`
2. Update SharePreview props to accept assets + socialLinks
3. Render BAR photos (reuse BarFaceBackTabs or BarListThumb)
4. Render BarSocialLinks (read-only)

### Phase 2: Layout and polish

1. Ensure mobile-first layout
2. Verify asset URLs are public (Vercel Blob)
3. Run build and check

## File impacts

| File | Change |
|------|--------|
| `src/app/bar/share/[token]/page.tsx` | Extend bar include: assets, socialLinks |
| `src/app/bar/share/[token]/SharePreview.tsx` | Add assets, socialLinks props; render photos + links |
| `src/components/bars/BarSocialLinks.tsx` | No change (already supports read-only) |
| `src/components/bars/BarFaceBackTabs.tsx` | May reuse; check if needs barId for edit (share view = no edit) |

## Dependencies

- bar-external-sharing (BES) — share flow complete
- bar-social-links (BSL) — done
- BAR assets — Vercel Blob URLs, public
