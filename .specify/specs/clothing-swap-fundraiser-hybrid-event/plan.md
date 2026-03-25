# Plan: Clothing swap hybrid fundraiser event

## Guiding sequence (API-first)

1. **Phase 0 complete** — vibeulon MVP parameters, strict BAR accept, fundraiser disclaimer ownership, Partiful doc template (`docs/events/clothing-swap-bb-residency-partiful-copy.md`). **Earlier locks:** sub-campaign → event, exportable event type, single pool, **event-wide** `eventClosesAt`, BB Residency surfacing, seller-validated BAR offers, co-host = Player only.
2. Define **Prisma / JSON** shapes for: `eventIntake`, `listingMetadata`, `bidHold`, `rsvpLight` — migrate only when shapes stabilize.
3. Implement **server actions** from `spec.md` API Contracts (stubs → real with transactions for bids).
4. Wire **UI** (gallery, listing form, organizer dashboard, orientation CYOA entry).
5. **Seed**: invitation BAR + orientation adventure + verification quest.
6. **Partiful doc** in `docs/events/` + OG on landing route.

## Phase map

| Phase | Focus | Key files (expected) |
|-------|--------|----------------------|
| **0** | Product locks + Partiful copy draft | `spec.md`, `docs/events/clothing-swap-*.md` |
| **A** | Instance/event shell + roles + intake | `prisma/schema.prisma`, `src/actions/*event*`, admin UI |
| **B** | CYOA branch + invitation BAR + RSVP light | `scripts/seed-*.ts`, `src/app/invite/`, adventures |
| **C** | Listings + gallery + metadata | `src/actions/swap-listing.ts`, `src/lib/swap-listing.ts`, `/swap/[slug]/gallery`, `/swap/[slug]/new`, `CustomBar.swapListingHidden`, Vercel Blob upload reuse |
| **D** | Bids (vibeulon + BAR offer) | `src/actions/economy*`, ledger, listing detail |
| **E** | Donation CTAs + learn-more + share meta | `/event` pattern reuse, `layout.tsx` OG |
| **F** | `.ics` + calendar docs | `src/app/api/events/`, event page |
| **G** | Campaign “available events” surfacing | campaign hub / board / event list components |
| **H** | Pre-production subquests | quest/BAR scoping by `instanceId` / `eventId` |
| **VQ** | Verification quest | `seed-cyoa-certification-quests.ts` or dedicated seed |

## File impacts (non-exhaustive)

- `prisma/schema.prisma` — possible: `EventRsvp`, `SwapListing` (or flags on `CustomBar`), `BidHold`, role keys
- `src/actions/instance.ts` / new `src/actions/swap-event.ts`
- `src/components/` — `SwapGallery`, `SwapListingForm`, `EventIntakeForm`
- `src/lib/` — validators for intake + listing metadata
- `docs/events/` — Partiful + share copy

## Phase B handoff (GP-INV)

- **RSVP-only guests** use `/swap-rsvp/[slug]` (engine audit trail; Partiful remains canonical when hosts publish it).
- **Join full game:** hosts/co-hosts run **Create join-game invite link** on `/swap-organizer/[slug]` → share absolute URL to `/invite/:token`. New signups consume one `Invite` use and gain `InstanceMembership` for that swap sub-campaign (`createCharacter` + `Invite.instanceId`).
- **Existing players** with an account can still use `acceptGoldenPathInvitation(inviteId)` when UI is wired to pass the invite id; MVP emphasizes the token URL for new signups.

## Verification

- `npm run build` && `npm run check`
- Manual: Partiful → invite BAR → both orientation branches → listing → bid → calendar → donate link
- Run verification quest `cert-clothing-swap-hybrid-event-v1` when seeded
