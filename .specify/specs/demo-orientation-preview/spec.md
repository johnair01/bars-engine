# Spec: Demo Orientation Preview (Pre-Signup Links)

## Purpose

Provide **shareable URLs** that let someone experience a **bounded slice** of orientation (CYOA / adventure / campaign reader)—nation/archetype framing, tone, a few beats—**before** creating an account. After the demo, the visitor is prompted to **sign up** and can optionally **continue** with a full invite or golden-path flow.

This is **not** a replacement for [Golden Path Invitation Shape](../golden-path-invitation-shape/spec.md) (which assumes an `Invite` and a player record on accept). It **complements** it: marketing and hosts need “try the vibe” links for demos, fundraisers, and friend invites.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Auth | **Anonymous** for the demo scope; no PII required to start |
| Persistence | **sessionStorage** (and/or URL state) for in-demo progress only; optional server-side **demo session** only if abuse/rate limits require it |
| Content scope | **Allowlisted** `adventureSlug` + `startNodeId` + optional `maxSteps` or “preview ends at node X” |
| Tied campaign | Optional `instanceId` / `campaignRef` for analytics and post-signup **handoff** |
| Relation to Invite | Optional `inviteId` or `promoCode` in query so signup attributes **attribution** without requiring invite acceptance during demo |

## User Stories

1. **As a host**, I generate a **demo link** for our orientation adventure so guests can preview before installing the app.
2. **As a visitor**, I open the link on mobile, read/play a short orientation slice, and see **Create account** / **I already have an invite** without losing context.
3. **As ops**, I can **rotate or revoke** a demo link if it’s abused or the adventure slug changes.

## URL Shape (v0 proposal)

| Pattern | Meaning |
|---------|---------|
| `/demo/orientation?t=<token>` | Opaque token resolves to config server-side |
| or `/demo/o/[publicSlug]` | Human-readable slug maps to same config |

**Query params (optional):** `ref` (campaignRef), `invite` (invite id for attribution only).

## Functional Requirements

### FR1 — Demo link configuration

- Store: `DemoOrientationLink` (or reuse `Invite` with `kind: demo_preview` — **decision in plan**) with:
  - `token` or `publicSlug` (unique)
  - `adventureSlug`, `startNodeId`
  - `instanceId` / `campaignRef` (optional)
  - `expiresAt` / `revokedAt` (optional)
  - `maxDepth` or `endNodeId` (optional cap)

### FR2 — Anonymous reader route

- Renders existing **CampaignReader** / adventure API path with **demo mode** flag:
  - Disables or soft-blocks actions that require `playerId` (wallet, BAR create, quest assign)
  - Shows **Exit ramp** CTA: Sign up, Log in, Donate (instance URLs)

### FR3 — Handoff to signup

- After “demo complete” or CTA: redirect to `/campaign/signup` or `/conclave/...` with **same** `ref` / `invite` query params preserved (aligns with [Custom Portal Onboarding Flow v0](../custom-portal-onboarding/spec.md) when that spec ships).

### FR4 — Safety

- Rate limit token resolution (IP + token)
- No server persistence of demo answers that identify a person (unless they sign up)

## Non-Goals (v0)

- Full orientation parity with logged-in players (all GM faces, vibeulon mints, etc.)
- Editing orientation content from this spec (see [CAF Campaign Authoring Flow](../campaign-authoring-flow/spec.md))

## Dependencies

- [Golden Path Invitation Shape](golden-path-invitation-shape/spec.md) — attribution and post-signup paths
- [Custom Portal Onboarding Flow v0](../custom-portal-onboarding/spec.md) — token → `createCampaignPlayer` (optional convergence)
- Active **Adventure** + API routes: `/api/adventures/[slug]/[nodeId]`
- `CampaignReader` and instance/campaign ref handling

## Acceptance Criteria

- [x] A demo link loads the first node without login (`/demo/orientation?t=` / `?s=`)
- [x] Demo uses anonymous `CampaignReader` fetch path; no player-bound mutations from the reader in demo mode
- [x] Signup handoff: `CampaignAuthForm` receives `campaignState` with `demoOrientationToken`, `ref`, `inviteId`
- [x] Create/revoke: `npm run seed:demo-orientation` + DB row `revokedAt` (admin UI follow-up)

## Implementation (v0)

| Piece | Location |
|-------|----------|
| Prisma | `DemoOrientationLink` in `prisma/schema.prisma`; migration `20260318150000_demo_orientation_preview` |
| Resolver | `src/lib/demo-orientation/resolve.ts` |
| Page | `src/app/demo/orientation/page.tsx`, `DemoOrientationClient.tsx`, `not-found.tsx` |
| Reader | `CampaignReader` `demoHandoff` prop in `src/app/campaign/components/CampaignReader.tsx` |
| Seed | `npm run seed:demo-orientation` → `scripts/seed-demo-orientation-link.ts` |
| Doc | `docs/DEMO_ORIENTATION.md` |

## References

- `src/app/campaign/components/CampaignReader.tsx`
- `src/app/api/adventures/[slug]/[nodeId]/route.ts`
- `.specify/backlog/prompts/dashboard-orientation-flow.md` (orientation context)
