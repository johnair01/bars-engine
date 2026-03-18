# Spec: BAR Share Full Preview

## Purpose

When a player shares a BAR link externally, the recipient should be able to **interact with the full BAR** — photos, inspirations (social links), description, tags — **without logging in**. Claiming or keeping the BAR still requires sign-up/login. The shared preview is currently minimal (title + description only); it should mirror the authenticated BAR detail experience for viewing.

**Practice**: Deftness Development — spec kit first, mobile-first.

**Source**: User feedback — "choosing to share a bar means that the potential player who receives it can interact with most of it."

## Current State

- `/bar/share/[token]` shows `SharePreview` with: sender name, BAR title, description, campaign name
- BAR assets (photos) and social links are **not** fetched or displayed
- Page query: `bar: { select: { id, title, description } }` — excludes assets, socialLinks

## User Stories

### P1: View BAR photos on shared link

**As a** recipient who clicks a shared BAR link, **I want** to see any photos attached to the BAR (front/back), **so** I can experience the full reflection before deciding to sign up.

**Acceptance**: SharePreview (or equivalent) displays BAR assets (images) when present. Same layout as BAR detail: face/back tabs or stacked images.

### P2: View and use inspiration links on shared link

**As a** recipient who clicks a shared BAR link, **I want** to see and click inspiration links (YouTube, Spotify, etc.) attached to the BAR, **so** I can explore what inspired the sender.

**Acceptance**: SharePreview displays BarSocialLinks. Links open in new tab. Platform labels (Watch, Listen to, etc.) as in BAR detail.

### P3: Full BAR experience before auth

**As a** recipient, **I want** to interact with all viewable BAR features (description, photos, links, tags) before signing up, **so** I understand the value before committing.

**Acceptance**: Shared view shows: title, description, photos (front/back), social links, tags. Claim/keep CTA remains below. No edit controls.

## Functional Requirements

- **FR1**: Extend share page query to include `bar.assets` and `bar.socialLinks` (and tags if stored separately)
- **FR2**: SharePreview (or new component) renders BAR photos using existing BarFaceBackTabs or BarListThumb patterns
- **FR3**: SharePreview renders BarSocialLinks (read-only, no add/remove)
- **FR4**: Layout remains mobile-first; no auth required for preview
- **FR5**: Claim/Login/Signup CTAs remain below the full preview

## Non-Functional Requirements

- Preview must not require auth (for crawlers and unauthenticated recipients)
- Asset URLs must be publicly accessible (Vercel Blob URLs are; verify no auth gate)
- Social links open with `target="_blank" rel="noopener noreferrer"`

## Dependencies

- [BAR External Sharing](../bar-external-sharing/spec.md) — share flow, token, auth branching
- [BAR Social Links](../bar-social-links/spec.md) — platform detection, BarSocialLink model
- BAR assets (Asset model, Vercel Blob URLs)

## Out of Scope (this spec)

- YouTube/Spotify embed (see [FEASIBILITY_YOUTUBE_EMBED.md](./FEASIBILITY_YOUTUBE_EMBED.md))
- Edit controls on shared view
- Analytics for share views
