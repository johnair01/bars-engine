# Plan: Demo Orientation Preview

## Overview

Implement **pre-signup demo links** as a thin layer: configuration + route + reader mode, reusing the existing adventure/CampaignReader stack.

## Phase 1: Schema + resolver

- Add `DemoOrientationLink` (or extend `Invite` — prefer new table for clarity vs golden-path invites) with token/slug, adventure bounds, optional instance/campaign ref, revocation.
- `getDemoOrientationLinkByToken(token)` — server-only lookup; no secrets in client bundle.

## Phase 2: Route + reader mode

- Add `src/app/demo/orientation/page.tsx` (or `/demo/o/[slug]`) that:
  - Validates token/slug
  - Passes `demoMode`, `adventureSlug`, `startNodeId`, `campaignRef` into existing reader
- Extend `CampaignReader` (or wrapper) with `demoMode`: block/disarm player-only effects; show signup CTA strip.

## Phase 3: Handoff + analytics

- Query param preservation: `ref`, `invite`
- Optional: `logDemoOrientationEvent` (segment, completed_preview, etc.) — privacy-minimal

## Phase 4: Admin / ops

- Minimal admin list: create link, copy URL, revoke
- Or seed script for first campaign (Bruised Banana)

## Risks

- **API abuse**: rate limit + short TTL tokens
- **Drift**: adventure slug renames break links — document “link points to adventure id” if we add FK to `Adventure.id` instead of slug

## File impacts (expected)

- `prisma/schema.prisma` — new model
- `src/app/demo/**` — routes
- `src/app/campaign/components/CampaignReader.tsx` — demo props
- `src/actions/demo-orientation.ts` — resolve token, optional create link (admin)
