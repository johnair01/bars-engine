# Spec: Offer BAR (timebank protocol) + DSW modal

## Purpose

Replace the plain **“Create a BAR (offer)”** link on the [donation self-service wizard](../donation-self-service-wizard/spec.md) **Time** and **Space** paths with a **modal** that creates a **distinct `offerBAR` artifact**—the kind intended to be **listed on campaign marketplace stalls**—and **metabolizes** player intent in alignment with **time banking** norms (offers as reciprocal community exchange, not one-way charity).

**Problem:** `/bars/create` is a generic forge; it does not scaffold **offers** with the **structure stewards and matchers need** (scope, cadence, skill band, geography/window), nor does it encode **timebank-aligned** semantics. Players bounce out of the wizard into an undifferentiated form.

**Practice:** Spec kit first; reuse `CustomBar` + `docQuestMetadata` / `agentMetadata` (or successor JSON) for **`offerBar`** discriminant; **modal** keeps context inside `/event/donate/wizard`; optional **“list on my stall”** uses [campaign marketplace slots](../campaign-marketplace-slots/spec.md).

## External references (protocol + tone)

These inform **copy** and **field design**, not mandatory third-party integration:

- [TimeBank Boulder — *Are you Time Challenged? Make your offers more creative!*](https://timebankboulder.org/are-you-time-challenged-make-your-offers-more-creative/) — “along the way” offers, bundling service with trips you already take, bounded time windows, creative structuring for busy people.
- [Get Rich Slowly — *An introduction to time banking*](https://www.getrichslowly.org/an-introduction-to-time-banking/) — core idea: **hour-for-hour** community credit, **reciprocity**, building trust through **named offers and requests** (adapt to BARs + vibeulons as the engine’s units).

**In-product:** Do not require real-world TimeBank org APIs in v1. Encode **protocol alignment** as typed metadata + wizard copy.

## Source fiction alignment (Wendell Support Quest / Twine)

The exported Twine (`cpq9dpsx.html`) includes a **Timebank** hub: contribute / withdraw / projects / **offers**, and a **“discover your contribution”** passage with **skilled vs unskilled** time donation. This spec’s **offer BAR** should be able to **represent** those narrative lanes as **structured choices** (skill band, not a second currency unless product adds one later).

## Design decisions

| Topic | Decision |
|-------|----------|
| **Artifact** | **`offerBAR`** = `CustomBar` with discriminant `offerBar.kind = 'timebank_offer'` (or `barSubtype` / `docQuestMetadata.offerBar`) and marketplace-oriented defaults. |
| **Entry** | **Modal** from DSW **Time** + **Space** primary CTA; **no full navigation** to `/bars/create` for the happy path (link to full forge remains secondary). |
| **Marketplace** | New offer BAR is **eligible** for **campaign stall listing** per marketplace rules; wizard may offer **“List on my stall”** when player has profile + capacity (see open questions). |
| **Reciprocity** | Copy frames **offer** as exchange-shaped (“what you’ll do,” “when,” “for whom / context”) vs donation-only language. |
| **Skill band** | At minimum: **`skilled` \| `unskilled` \| `either`** (Twine lanes); stored on metadata. |
| **Time realism** | Required: **estimated hours** or **session count** + **scheduling notes** (creative / constrained offers per TimeBank Boulder). |
| **Campaign context** | Preserve **`campaignRef`** from DSW into BAR `campaignRef` and marketplace href generation. |

## Conceptual model

| Layer | WHO | WHAT | WHERE |
|-------|-----|------|--------|
| **DSW modal** | Logged-in player | Fills **offer BAR** scaffold | Overlay on `/event/donate/wizard` |
| **Persistence** | System | Creates `CustomBar` + metadata | Server action |
| **Marketplace** | Player | Optional **stall list** | `/campaign/marketplace?ref=…` |

## Data shape (v1)

Stored on `CustomBar` (exact column TBD in plan — prefer extend `docQuestMetadata` JSON):

```ts
type OfferBarMetadata = {
  kind: 'timebank_offer'
  protocolVersion: 1
  skillBand: 'skilled' | 'unskilled' | 'either'
  estimatedHours?: number
  sessionCount?: number
  schedulingNotes?: string
  geographyOrVenue?: string
  creativeOfferPattern?: 'along_the_way' | 'scheduled' | 'batch' | 'other'
  source: 'dsw_wizard'
  campaignRef?: string
}
```

## User stories

1. **As a** player offering time, **I want** a guided modal **from the wizard**, **so** I don’t lose context between “contribute” and “create BAR.”
2. **As a** steward, **I want** offers to have **skill band + time bounds**, **so** marketplace browsers can match quickly.
3. **As a** player, **I want** an optional **list on stall** step, **so** my offer is visible in the **campaign mall** when I choose.

## Acceptance criteria

### Phase A — Spec + contracts

- [ ] **A1** `OfferBarMetadata` type + validation helper in `src/lib/…`.
- [ ] **A2** Server action `createOfferBarFromDsw` (name TBD) returns `barId` or validation errors.

### Phase B — Modal UI

- [ ] **B1** `OfferBarModal` (client) — fields: title, description, skill band, hours/sessions, scheduling notes, optional geography; **Save** / **Cancel**; **UI_COVENANT** + cultivation tokens for chrome.
- [ ] **B2** Wire **Time** + **Space** buttons to open modal **when logged in**; **when logged out**, link to login with `returnTo` wizard URL + message.

### Phase C — Marketplace

- [ ] **C1** After create, optional CTA **“Open marketplace”** / **“List on stall”** when rules allow; otherwise show **“View in Hand / Vault”** (exact path per product).

### Phase D — Verification

- [ ] **D1** `npm run check` + manual: create offer from wizard → BAR visible with metadata → optional list.

## Non-goals (v1)

- External **TimeBank** org OAuth or hour ledger sync.
- New **TimeDollar** currency table (use **vibeulons** / existing economy only).

## Dependencies

- [donation-self-service-wizard](../donation-self-service-wizard/spec.md)
- [campaign-marketplace-slots](../campaign-marketplace-slots/spec.md)
- [campaign-onboarding-cyoa](../campaign-onboarding-cyoa/spec.md) (funding ⊆ onboarding)

## Open questions

1. **Auth:** Must offer creation be **logged-in only** (recommended) vs anonymous draft?
2. **Stall listing:** Auto-create **PlayerMarketplaceProfile** or require existing profile?
3. **BAR `type`:** Keep `vibe` vs introduce `offer` or use metadata-only discriminant?

## References

- Spec kit: [plan.md](./plan.md), [tasks.md](./tasks.md)
