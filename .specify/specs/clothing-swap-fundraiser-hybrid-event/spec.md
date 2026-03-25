# Spec: Clothing swap hybrid fundraiser event (IRL + virtual)

## Purpose

Support a **real-time + virtual** fundraising **clothing swap**: players list items (photos + BARs + metadata), browse a **single shared gallery**, **bid with vibeulons and/or BAR offers** under a **fixed-time auction**, donate at **event open and close**, and enter through **differentiated orientation** (new vs returning players), **invitation BARs**, and **campaign intake** (organizer-authored) on a **pre-production campaign that produces the event** (sub-campaign pattern), with **Partiful-first** marketing. The live event appears under **available events** on the **Bruised Banana Residency** parent campaign (`campaignRef` / hub wiring as implemented for BB); the **clothing-swap** shape remains **exportable as an event type** for other instances.

**Practice:** Deftness Development — spec kit first, API-first (contracts before UI), deterministic flows over one-off scripts; uploads and economy paths need explicit scaling and audit notes.

**Problem:** Swap + auction + hybrid attendance + dual onboarding does not exist as one composable event product; organizers need scoped roles, guest-friendly RSVP, and engine-native energy (vibeulons / BARs) without forcing every guest through full app onboarding.

---

## Six Game Master faces — design synthesis

Structured thinking pass (for product + implementation). Use during refinement and `strand` / `sage_consult` if you want deeper passes.

### Shaman (felt field)

- A swap is **embodied** (texture, fit, shame/joy of visibility). Virtual participants must still feel **invited**, not catalogued.
- **Photos + BAR copy** are the emotional carrier — not optional polish.
- Orientation CYOA should **name the social risk** lightly (“first swap,” “sizing guess,” “no judgment floor”) before teaching mechanics.
- **Risk:** Gallery feels like a dead mall → mitigate with human-scale copy, host presence signals, and limited batches (e.g. “tonight’s rack”) if needed.

### Regent (rules & sovereignty)

- **Roles (pre-production):** **Host** (campaign-scoped owner), **Co-host** (organizer powers **without** platform `admin` — instance/event-scoped role), **Participant**. **MVP:** co-hosts are **full `Player` accounts** with scoped role; **email-only / non-player co-host** is **deferred** (rare; revisit if needed).
- **Donation windows:** explicit **start** and **end** CTAs; optional “support even if not attending” as a **policy**, not guilt spam.
- **RSVP vs account:** guests may **RSVP-only** (Partiful / lightweight capture) and defer full game account to **post-event invite** from organizers.
- **Risk:** Co-host vs global admin confusion → enforce **scope** in data model and UI badges (“Event admin — Swap 2026”).

### Challenger (friction / anti-bypass)

- Browsing alone cannot satisfy the loop — **bids** or **offers** must require **commitment** (vibeulon hold or explicit BAR attach).
- **BAR vs clock:** Sellers must **actively accept** a BAR offer for it to beat the automated vibeulon outcome; if they do not act before **event-wide close**, **highest vibeulon wins** — avoids stalled listings while still allowing rich (campaign/service-scale) offers when the seller engages.
- **Hybrid trust:** if virtual winners need shipping, spec must either **defer** (“IRL pickup only v1”) or add **shipping address + consent** (later phase).
- **Skip paths:** “Skip app orientation” must still leave an **audit trail** (RSVP token, email, or Partiful id linkage) so organizers are not blind.

### Architect (structure & data)

- **Campaign container:** **Pre-production for an event is always its own campaign** that **produces** the live **event** (artifact + moment). Treat every such event as a **sub-campaign** in the data/UI graph: intake, roles, listings warm-up, and subquests live on that campaign; the **output** is the surfaced event (see **Event campaign model** below).
- **Composting event types:** A concrete flow (e.g. clothing swap) can be **exported as an event type** — template + seeds + intake schema — so **other instances** can spawn the same pattern without re-spec’ing from scratch.
- **Listings:** MVP aligns with **BAR as listing** (photo + structured fields) or **CustomBar + attachment metadata**; avoid parallel “ClothingItem” unless query needs force it. **One gallery pool** for hybrid (IRL + virtual participants browse the same rack digitally).
- **Bids:** need **ledger-safe** vibeulon moves (hold → accept/reject → release) and/or **BAR-offer** threading (reuse `BarResponse` / RACI patterns when ready).
- **Dual CYOA:** one adventure with **branch on `player` maturity** (e.g. completed onboarding cert, `onboardingComplete`, or `hasSeenWelcome` + nation/archetype) vs **explicit “returning” flag** from invite.
- **Calendar:** reuse **`.ics`** patterns (`/api/events/.../ics`) where `EventArtifact` exists; extend for swap-specific event row.

### Diplomat (relational & external)

- **Partiful** remains **canonical RSVP + logistics**; in-app duplicates **deep links** and **copy**, not competing RSVP truth.
- **Share surfaces:** MVP = **Open Graph / meta** for swap landing + Partiful link in body; native FB/IG/Twitter buttons are thin wrappers.
- **Invitation BAR:** public link, short CYOA, ends with **“learn more”** (Bruised Banana, BARS Engine) + **donate** + optional **create account**.
- **No-shows:** prompt **donate + learn more** with **opt-out** respect (one screen, not nag loops).

### Sage (integration)

- **One event, two modalities:** IRL and virtual participants share **one listing pool** and **one gallery**; hybrid is a logistics/copy concern, not a split catalog.
- **Returning vs new:** single **entry graph** with **short path** for returning players; avoids maintaining two adventures forever.
- **BB alignment:** fundraiser can **benefit Bruised Banana** via `linkedInstanceId`, `campaignRef`, or copy-only; **do not** silently merge accounting without explicit decision.

---

## Event campaign model (locked)

| Rule | Meaning |
|------|--------|
| **Pre-prod = campaign** | Work before and around the live moment runs on a **dedicated campaign** scoped to that event (intake, roles, gallery warm-up, subquests). |
| **Event = product of that campaign** | The **event** (scheduling, `.ics`, go-live state, donation windows, invitation BAR linkage) is what that sub-campaign **produces** and surfaces to players. |
| **Sub-campaign** | In UI and data, this event’s pre-prod campaign is a **child** (or peer-with-link) under normal campaign navigation. **Locked (MVP):** **Bruised Banana Residency** surfaces the swap as an **available event**. |
| **Exportable event type** | Implementations should favor **templates** (intake fields, seeds, quest hooks) so **new instances** can adopt “clothing swap fundraiser” (and future emergent types) without one-off code. |

## Design decisions

| Topic | Decision |
|-------|----------|
| Canonical RSVP | **Partiful** (source of truth); engine stores **link-back** + optional token mapping |
| **Event vs campaign** | **Locked:** pre-production is **always** its **own campaign** that **produces** the event; event = sub-campaign pattern; **export as event type** for reuse across instances. |
| **Listing pool** | **Locked:** **Single pool** — one gallery for all hybrid participants (no IRL/virtual catalog split). |
| **Auction clock** | **Locked (MVP):** **One `eventClosesAt`** for the whole swap — all vibeulon bids on all listings must be placed before that time; settlement runs once at close. |
| **Auction (vibeulon)** | **Locked:** At **`eventClosesAt`**, **highest valid vibeulon bid per listing** wins **unless** that listing has an **owner-accepted BAR offer** (see below). |
| **BAR offers** | **Locked:** Offers attach a **BAR** (may be a large / service-scale BAR — e.g. campaign-shaped promise). **Only the listing owner** (seller) may **accept** an offer. **Precedence:** If the seller **accepts** a BAR offer **before** `eventClosesAt`, that offer **wins that listing** and vibeulon holds for that listing are **released** (or never take the item). If the seller **does not** accept any BAR offer before close, **vibeulon outcome wins** — *“vibeulons win out if the owner doesn’t see the offer in time.”* |
| **Parent surfacing** | **Locked (MVP):** **Bruised Banana Residency** campaign lists this sub-campaign in **available events**. |
| Listing primitive | **BAR-backed listing** (photo + metadata JSON + title/body) for MVP — revisit if queries hurt |
| Bid with vibeulons | **Escrow/hold** pattern required before MVP ships real money-adjacent energy; **release** losing holds after winner determination at deadline |
| Bid with BARs | **Offer** = link `barId` → `listingId`; **accept** = seller-only action before close; align with [BAR Response + Threading](../bar-response-threading-raci/spec.md) when threading matures |
| Co-host authority | **Instance-scoped role** — **not** global `admin`. **MVP:** every co-host is a **full `Player`**; **non-player / email-only co-host deferred.** |
| **Vibeulon auction (MVP)** | **§ MVP vibeulon auction parameters** — whole units; opening ≥ **`minOpeningBidVibeulons`** (intake, default **1**); **+1** min increment over current high; **hold** until outbid / retract / settlement; **retract** allowed before **`eventClosesAt`** with next-highest restoration. |
| **BAR accept timing** | **Strict** at **`eventClosesAt`** (no grace). |
| **Disclaimer** | **Host-owned** copy + optional neutral template; see **Resolved decisions**. |
| New vs returning orientation | **Branch in one CYOA** from server-evaluated **player state** + optional **invite metadata** |
| Skip full onboarding | **RSVP-only** path stores minimal identity; **no** nation/archetype required until player opts in |
| Donation timing | **Two windows** (open + close) as **scheduled CTAs** + always-on `/event`-style link |
| Virtual fulfillment | **Open** — v1 may be **IRL pickup only** or **photo-only swap** until shipping spec exists |

---

## Conceptual model (WHO / WHAT / WHERE / Energy / Moves)

| Dimension | Mapping |
|-----------|---------|
| **WHO** | Host, co-host, participant; guests may be anonymous RSVP until signup |
| **WHAT** | Listings (BARs), bids (vibeulon + BAR offers), subquests (child BARs / quests), orientation CYOA, invitation BAR |
| **WHERE** | Primarily **GATHERING_RESOURCES** (fundraiser) + **SKILLFUL_ORGANIZING** (logistics); some **SHOW UP** moves for live day |
| **Energy** | Vibeulons (bids, donations, appreciations); escrow rules TBD |
| **Moves** | Wake Up (discover items), Clean Up (prep/list), Grow Up (learn system), Show Up (attend/bid/donate) |

---

## API contracts (API-first — draft; refine before build)

### `createSwapListing`

**Input:** `{ instanceId | campaignRef, title, description, photos: UploadRef[], meta: { brand?, size?, condition? } }`  
**Output:** `{ listingId (BAR id), error? }`  
**Surface:** Server Action (authenticated).

### `listSwapListings`

**Input:** `{ eventId | campaignRef }` (single pool — no channel filter in MVP)  
**Output:** `{ listings: ListingSummary[] }`  
**Surface:** Server Action or RSC loader.

### `placeVibeulonBid`

**Input:** `{ listingId, amount, eventId }` — rejected if **now ≥ event `eventClosesAt`**, if listing already has **accepted BAR offer**, or if **amount** breaks **§ MVP vibeulon auction parameters** (opening minimum, increment).  
**Output:** `{ bidId | holdId, error? }`  
**Surface:** Server Action; must be **atomic** with ledger (transaction). **Settlement** at **`eventClosesAt`**: per listing, if **acceptedBarOfferId** set → release all vibeulon holds on that listing; else **highest bid wins**, finalize winner, release losers.

### `retractVibeulonBid` (bidder)

**Input:** `{ listingId, bidId | holdId }` — caller must own the bid; rejected if **`now ≥ eventClosesAt`** or listing has **accepted BAR offer**.  
**Output:** `{ ok: true, newHighBid? }` — release hold; if retractor was high bidder, recompute **next-highest** active bid.

### `offerBarForListing`

**Input:** `{ listingId, barId }` (bidder’s BAR — may represent goods, services, or campaign-scale trade)  
**Output:** `{ offerId, error? }`  
**Surface:** Server Action; ties into threading when available. Listing owner sees pending offers in seller UI.

### `acceptBarOfferForListing` (listing owner only)

**Input:** `{ listingId, offerId }` — caller must be **listing owner**; rejected if **`now ≥ eventClosesAt`** (**strict** — **no grace window** in MVP).  
**Output:** `{ ok: true }` — marks offer **accepted**; competing vibeulon holds on that listing scheduled for **release** at settlement (or immediately).

### `rejectBarOfferForListing` (listing owner only)

**Input:** `{ listingId, offerId }`  
**Output:** `{ ok: true }`  
**Surface:** Server Action; offer status `rejected`; vibeulon auction for that listing still resolves at `eventClosesAt` if no other accepted offer.

### `recordCampaignIntake` (organizer)

**Input:** `{ eventId, intakeJson }` (validated schema)  
**Output:** `{ ok: true }`  
**Surface:** Server Action (host/co-host only).

### `GET /api/events/:eventArtifactId/ics` (extend)

**Output:** `.ics` for swap event + optional **donation window** reminders (as separate calendar entries or description).

---

## User stories

### P1: Organizer — campaign shell

**As a host**, I want an event instance with **host / co-host / participant** roles and **campaign intake** I fill out, so the swap is configurable without code changes.

**Acceptance:** Intake persisted; co-host can edit subset of fields; participants cannot see draft intake until published.

### P2: Guest — invitation & orientation

**As a guest**, I want an **invitation BAR** that explains the event and BARS lightly, so I know what I’m entering.

**Acceptance:** Public URL; mobile-friendly; links to BB + engine docs + donate.

### P3: New vs returning player

**As a new player**, I want a **longer orientation CYOA**; **as a returning player**, I want a **short path** to the swap.

**Acceptance:** Branching works from objective player state; returning path ≤ 3 minutes; new path covers moves + vibeulons at high level.

### P4: RSVP without full game

**As a guest**, I want to **RSVP and skip app orientation**, and optionally **join the full game later** from an organizer invite.

**Acceptance:** RSVP recorded; no forced nation/archetype; later invite upgrades account state.

### P5: List clothes

**As a participant**, I want to **upload photos** and write a **BAR**, and enter **brand / size / condition**, so others can evaluate items.

**Acceptance:** At least one photo; metadata fields validated; listing visible in event gallery.

### P6: Browse & bid

**As a participant**, I want to see **all listings** for this event and **bid vibeulons** or **offer my BAR** (including a substantial or service-style BAR), within rules.

**Acceptance:** Gallery loads scoped to event; vibeulon bid creates hold before **`eventClosesAt`**; BAR offer recorded; **listing owner** can accept/reject offers; at close, **accepted BAR** beats vibeulons for that item, else **highest vibeulon** wins; errors surfaced clearly.

### P7: Donations

**As an organizer**, I want **donation prompts at start and end** of the event and for **no-shows**, with links to **learn more** (BB + engine).

**Acceptance:** Two scheduled prompts + static links; donation uses existing instance URLs where applicable.

### P8: Event discoverability

**As a player**, I want this swap to appear under **available events** for the campaign, so I can find it from the normal campaign UI.

**Acceptance:** Event row visible with correct ref; deep links work.

### P9: Pre-production subquests

**As a participant**, I want to create **BARs as mini-challenges** before the live day, so the field warms up.

**Acceptance:** Child quests/BARs scoped to `eventId` / `instanceId`; appear in event hub.

### P10: Partiful + calendar

**As an organizer**, I want **Partiful** to be the primary marketing surface and guests to add **Apple/Google calendar** entries.

**Acceptance:** Partiful copy doc in-repo; `.ics` link documented on event page; OG tags on landing.

---

## Functional requirements

### Phase A — Event container & roles

- **FR-A1:** Create event pattern per [event-campaign-engine](../event-campaign-engine/spec.md): **pre-prod campaign** (sub-campaign) that **produces** `EventArtifact` / live event; ship **clothing-swap** as first-class **exportable event type** (template + seeds) for other instances.
- **FR-A2:** **Host** = full campaign admin for that instance; **Co-host** = scoped permissions (edit intake, moderate listings, pin messages) **without** global admin.
- **FR-A3:** **Participant** default role for invited players.
- **FR-A4:** Campaign **intake** form (organizer-only): narrative fields + logistics (date, hybrid flags, Partiful URL, donation goals) + **`minOpeningBidVibeulons`** (default **1**) + optional **fundraiser disclaimer** text (host-owned; see resolved **Fundraiser disclaimer**).

### Phase B — Orientation & invites

- **FR-B1:** **Orientation CYOA** adventure with **branch**: new player (long) vs returning (short); criteria documented in `plan.md`.
- **FR-B2:** **Invitation BAR** (`type: event_invite` or successor) seedable; links to CYOA entry, `/event`, BB wiki, donate.
- **FR-B3:** **RSVP-only** path: capture external id / email; skip nation/archetype; store `eventRsvp` record (schema TBD).
- **FR-B4:** Organizer can **send “join full game”** invite after event.

### Phase C — Listings & gallery

- **FR-C1:** Listing creation: **≥1 photo** + **BAR body** + **metadata** (brand, size, condition enums or free text per field decision).
- **FR-C2:** Gallery page scoped to **event**; **single pool** (no IRL vs virtual catalog split).
- **FR-C3:** Moderation hooks for host/co-host (hide / archive listing).

### Phase D — Bidding & offers

- **FR-D1:** **Event-wide fixed close:** single **`eventClosesAt`** on the event (or `EventArtifact`); **vibeulon** bids on any listing rejected at or after that instant; at close, **idempotent settlement** runs **per listing**.
- **FR-D2:** **Settlement precedence per listing:** (a) If listing owner **accepted** a **BAR offer** before `eventClosesAt` → that offer **wins**; release vibeulon holds on that listing. (b) Else → **highest valid vibeulon bid** wins; release other holds.
- **FR-D3:** **BAR offers:** bidders attach a **BAR** (including large or **service / campaign-shaped** offers). **Only the listing owner** validates (**accept** / **reject**). No host/co-host override for which offer wins (moderation is separate: hide listing, etc.).
- **FR-D4:** Document **virtual fulfillment** deferral or minimal viable rule (pickup-only).
- **FR-D5:** **`retractVibeulonBid`** (or equivalent) before **`eventClosesAt`** per **§ MVP vibeulon auction parameters**; persist bid history for **next-highest** restoration.

### Phase E — Fundraising & comms

- **FR-E1:** **Donation CTAs** at **event start** and **event end**; static **“support if not attending”** block on invite + Partiful-adjacent copy.
- **FR-E2:** **Learn more** links: Bruised Banana (`/wiki/campaign/bruised-banana`, `/event`), BARS Engine (`/wiki` or chosen canonical).
- **FR-E3:** **Partiful integration**: in-repo copy doc + canonical URL table (like [bruised-banana-apr-2026-partiful-copy](../../docs/events/bruised-banana-apr-2026-partiful-copy.md) pattern).
- **FR-E4:** **Share helpers**: OG meta + optional `mailto:` / native share where supported; **do not** duplicate Partiful RSVP.

### Phase F — Calendar

- **FR-F1:** Expose **.ics** for swap event (and optional donation reminders).
- **FR-F2:** Document Google Calendar subscribe flow from `.ics` URL.

### Phase G — Campaign UI surfacing

- **FR-G1:** Event appears in **available events** on **Bruised Banana Residency** (wire `campaignRef` / hub data to this sub-campaign event for MVP).
- **FR-G2:** Deep links: `?ref=…`, invitation BAR id stable for printing.

### Phase H — Pre-production BAR subquests

- **FR-H1:** Players create **event-scoped** BAR/quest stubs (“bring a hanger,” “post fit pic”) visible in event hub.

---

## Non-functional requirements

- **Audit:** All vibeulon holds and bid state transitions logged (metadata JSON acceptable for MVP).
- **Abuse:** Photo upload limits, rate limits, host moderation.
- **Privacy:** RSVP-only path minimizes PII; align with [Reflective Data Privacy](../reflective-data-privacy-shareability-model/spec.md) when storing cross-system ids.
- **Performance:** Gallery pagination; image CDN/Blob pattern per scaling checklist.

---

## Scaling checklist

| Touchpoint | Mitigation |
|------------|------------|
| Photo uploads | Vercel Blob / S3; size caps; virus scan policy TBD |
| Vibeulon bids | DB transactions; idempotent bid API |
| Gallery | Pagination; avoid loading full binary in RSC |

---

## Verification quest (UX)

- **ID:** `cert-clothing-swap-hybrid-event-v1` (proposed)
- **Steps:** (1) Open invitation BAR as anonymous, (2) RSVP-only path, (3) New-player orientation branch, (4) Returning-player short branch, (5) Create listing with photo + metadata, (6) View gallery, (7) Place vibeulon bid, (8) Attach BAR offer, (9) **Listing owner accepts BAR** (path A) or **let clock run** → vibeulon winner (path B), (10) Open `.ics`, (11) Donation CTA surfaces.
- **Narrative frame:** Preparing the Bruised Banana residency + swap fundraiser; engine improvement for hybrid events.

---

## Dependencies

- [event-campaign-engine](../event-campaign-engine/spec.md) — EventArtifact, instances
- [EVENT_INVITE_BAR_CYOA_MVP](../campaign-hub-spoke-landing-architecture/EVENT_INVITE_BAR_CYOA_MVP.md) — invitation BAR pattern
- [golden-path-onboarding-action-loop](../golden-path-onboarding-action-loop/) — returning vs new signals
- [BAR Physical Capture & Photo](../bar-physical-capture-photo/spec.md) — uploads
- [BAR Response + Threading RACI](../bar-response-threading-raci/spec.md) — offers (Phase D+)
- [Attunement / vibeulon ledger](../../docs/ECONOMY_MINT_BURN_AUDIT.md) — bid holds

---

## Resolved decisions (product)

| Topic | Resolution |
|-------|------------|
| **Pre-prod vs event** | Pre-production is **always its own campaign**; it **produces** the event. Every event is a **sub-campaign** in this sense. |
| **Reuse / composting** | Flows can be **exported as an event type** (template + seeds) for **other instances**. |
| **Listing pool** | **One pool** — one gallery for hybrid IRL + virtual. |
| **Auction clock** | **MVP:** **Event-wide** single **`eventClosesAt`** for all listings. |
| **Vibeulon outcome** | At close, **highest valid vibeulon bid per listing** unless a **BAR offer was accepted** by the seller before close. |
| **BAR offers** | **Listing owner** (seller) **must accept** for a BAR offer to win. Offers may be **large BARs** or **service/campaign-scale** trades. If owner **does not accept** before `eventClosesAt`, **vibeulons win** for that listing. |
| **Parent surfacing** | **MVP:** **Bruised Banana Residency** lists the swap in **available events**. |
| **Co-host accounts** | **MVP:** all co-hosts are **full Players** with scoped role; **email-only / non-player co-host deferred.** |
| **BAR accept cutoff** | **MVP:** **Strict** — `acceptBarOfferForListing` rejected at or after **`eventClosesAt`**; **no grace window**. |
| **Fundraiser disclaimer** | **Legal wording is owned by the event host (organizer).** Engine provides an optional **intake field** + UI slot; platform may ship a **neutral template** (“not tax or legal advice; consult a professional”) — not a substitute for organizer review. |

### MVP vibeulon auction parameters (Phase 0 — locked)

| Parameter | Rule |
|-----------|------|
| **Denomination** | Whole vibeulons only (**integer** amounts). |
| **Opening bid** | First bid on a listing must be **≥ `minOpeningBidVibeulons`** on the event (intake default **1** unless host raises it). |
| **Minimum increment** | Each new high bid must be **≥ current high + 1** (fixed **+1** vibeulon increment for MVP; no fractional bids). |
| **Hold lifecycle** | On bid: **hold** the bid amount from the bidder’s spendable balance. When **outbid**: **release** the outbid player’s hold immediately (or in same transaction as the new bid). At **`eventClosesAt`**: settle per listing — **release** all non-winning holds; **transfer** winner’s hold per economy rules (or convert to “won” state). |
| **Retract / cancel bid** | **Allowed** only **before `eventClosesAt`**. Bidder may retract their **current active bid** on that listing; **full hold returned**. If they were the **high bidder**, the listing’s high bid becomes the **next-highest** remaining non-retracted bid (requires **bid history** or equivalent; if no other bids, listing has no high bid until someone bids again). **Not allowed** after close. |
| **“Max hold duration”** | **Implicit:** holds last from bid until **outbid**, **retract**, or **settlement** — no separate TTL. |

## Open decisions (optional later)

1. **Future:** Non-player co-host / organizer without `Player` row — revisit if operational need arises.
2. **Future:** Configurable **min increment** above 1, or **percent-based** increments, if auctions scale.
3. **Future:** Short **grace window** for BAR accept after `eventClosesAt` (would require spec + UX change).

---

## Appendix: Phase B orientation & RSVP (implementation)

| Item | Location / contract |
|------|---------------------|
| **New vs returning branch** | Server-evaluated in `swapOrientationInitialPassageId` (`src/lib/swap-orientation-branch.ts`). **Returning (short path):** `isGameAccountReady(player)` — same as golden-path / forge gate: `inviteId` present and `onboardingComplete === true`. Otherwise start at `intro` (anonymous self-select or long path). |
| **Orientation route** | `/swap-orientation/[instanceSlug]` — builds CYOA from `Instance.swapEventIntake` + donation URLs. |
| **Light RSVP** | `/swap-rsvp/[instanceSlug]` — `recordSwapEventRsvp` / `SwapEventRsvp` (`skipFullOnboarding` audit flag); httpOnly cookie `bars_swap_rsvp`. Rate limits: 120 RSVPs / instance / hour, 5 / email / instance / hour. |
| **Stable invite BAR** | `cshe-clothing-swap-invite-v1` → `/invite/event/cshe-clothing-swap-invite-v1` (`npm run seed:cshe-event-invite-bar`). Prefer per-instance orientation URL for live events. |
| **Join full game (GP-INV)** | `createSwapJoinGameInvite` (swap organizer UI) creates `Invite` with `instanceId`; link `/invite/:token`. `createCharacter` increments `Invite.uses`, respects `maxUses`, and upserts `InstanceMembership` when `invite.instanceId` is set. |

## Appendix: Phase C listings & gallery (implementation)

| Item | Location / contract |
|------|---------------------|
| **Listing primitive** | `CustomBar` with `type: swap_listing`, `collapsedFromInstanceId` = swap sub-campaign, `docQuestMetadata` JSON `{ swapListing: { v:1, brand?, size?, condition? } }`. |
| **Photos** | `Asset` rows (`bar_attachment`) via existing `/api/assets/upload` + `uploadBarAsset`; ≥1 required before `finalizeSwapListing` sets `visibility: public`. |
| **Create rules** | `createSwapListingDraft` / `finalizeSwapListing` in `src/actions/swap-listing.ts`. Instance **membership** required; **participants** (and GP members with null role) may create only after `swapEventIntakePublishedAt`; host/co-host/admin may draft before publish. |
| **Gallery** | `/swap/[slug]/gallery` — `listSwapListings` paginated (12/page); public rows: `visibility: public`, `swapListingHidden: false`, `status: active`. |
| **Moderation** | `swapListingHidden` column on `custom_bars`; `moderateSwapListing` actions `hide` / `unhide` / `archive` (host/co-host/admin). Gallery “Show hidden” for moderators. |
| **New listing UI** | `/swap/[slug]/new` |

---

## References

- `src/app/invite/event/[barId]/page.tsx` — invite BAR surface
- `docs/events/` — Partiful copy patterns
- `prisma/schema.prisma` — `Instance`, `EventArtifact`, `CustomBar`, `VibeulonLedger`, `InstanceMembership`
- [game-master-agents.mdc](../../.cursor/rules/game-master-agents.mdc) — six faces (operational, not this spec’s primary authority)
