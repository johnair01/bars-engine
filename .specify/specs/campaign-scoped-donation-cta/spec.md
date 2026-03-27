# Spec: Campaign-scoped donation CTA

## Purpose

Make **donation payment links and donate-button behavior** resolve to the **correct campaign (Instance)**—e.g. **Bruised Banana residency**—instead of only the **globally active** `AppConfig.activeInstanceId`. Allow **authorized people** to **edit** those settings from the product UI: **admins**, **campaign owners**, and **event owners** (for events they own).

**Problem today:** `/event/donate` and `/event/donate/wizard` call `getActiveInstance()`, so pay links (Venmo, Cash App, PayPal, Stripe) always reflect **one** active instance, regardless of `?ref=` or `campaignRef` on campaign CTAs. [DSW Phase 3](../donation-self-service-wizard/spec.md) expects campaign context via `ref`; settlement pages must use the **same** instance for links + self-report.

**Practice:** Spec kit first; reuse `Instance` payment URL columns where possible; add event-level overrides only where needed.

**Related:** [donation-self-service-wizard](../donation-self-service-wizard/spec.md) (wizard + `ref`), [event-donation-honor-system](../event-donation-honor-system/spec.md) (honor + packs), [bruised-banana-milestone-throughput](../bruised-banana-milestone-throughput/spec.md) (milestone on money self-report).

---

## Conceptual model

| Layer | WHO | WHAT | WHERE |
|-------|-----|------|--------|
| **Campaign (Instance)** | Admin, campaign owner | Edit **payment URLs** + optional **primary donate label** (see FR) | Settings UI scoped to `Instance` (by `campaignRef` / slug) |
| **Settlement** | Donor | Sees provider buttons + self-report for **resolved** instance | `/event/donate`, `/event/donate/wizard` |
| **Event (optional)** | Event owner | Override or narrow **donation CTA** for **their** `EventArtifact` | Event settings / event detail (owner-only) |

**Campaign identity:** A **residency** like Bruised Banana is an `Instance` with stable **`campaignRef`** (e.g. `bruised-banana`). Donation resolution MUST use this when `ref` (or equivalent) is present.

---

## Definitions

- **Campaign owner:** `Player` with `InstanceMembership` on the target `Instance` where `roleKey` is **`owner`** or **`steward`** (aligned with `src/actions/campaign-overview.ts` patterns). Product copy may say “campaign owner”; DB uses existing membership roles.
- **Admin:** `Player` with admin role (existing admin gate).
- **Event owner:** For a given `EventArtifact`, the player who may edit event donation settings: **`createdByActorId`** matches current player **OR** the player is listed as **host** / **accountable** in `EventParticipant` with `functionalRole` in `host` | `co_host` (exact enum as implemented). Spec tasks MUST align with one authoritative rule to avoid drift.

---

## User stories

### C1: Donor sees Bruised Banana links

**As a** donor opening donate from a Bruised Banana CTA (`ref=bruised-banana`), **I want** Venmo/Cash App/PayPal/Stripe links to match **that** residency’s configured URLs, **so** money goes to the right place and self-report attaches to the right `instanceId`.

### C2: Campaign owner edits links

**As a** campaign owner, **I want** to update payment URLs and the donate button label for **my** campaign **without** being a global admin, **so** we can rotate handles or payment methods safely.

### C3: Admin edits any campaign

**As an** admin, **I want** the same controls for **any** `Instance`, **so** ops can fix misconfiguration.

### C4: Event owner customizes event donation CTA

**As an** event owner, **I want** to set or override the donation button (and optionally provider links) for **events I own**, **so** a fundraiser event can point at a dedicated link without changing the whole campaign default.

### C5: No privilege escalation

**As the** system, **I must** reject updates from players who are neither admin nor owner/steward for that instance (and neither event owner for that event).

---

## Functional requirements

### FR1 — Resolve instance for donation flows

1. When query (or server context) includes **`ref`** = `campaignRef` (e.g. `bruised-banana`), **resolve** `Instance` by **`campaignRef`** (unique in practice for residency instances; if multiple, define deterministic rule: prefer `isEventMode` false + primary residency, or document `slug` fallback—**tasks** must validate against DB constraints).
2. When **`ref` is absent**, preserve backward-compatible behavior: use **`getActiveInstance()`** (current behavior).
3. **`/event/donate`** and **`/event/donate/wizard`** MUST use the **same** resolution function so provider buttons, headings (“Donate to {name}”), and `instanceId` passed to self-report are consistent.

### FR2 — Campaign owner + admin edit (Instance)

1. Expose a **server action** (or authenticated API) **`updateInstanceDonationCta`** (name TBD) that updates **only** donation-related fields on `Instance`: at minimum `stripeOneTimeUrl`, `patreonUrl`, `venmoUrl`, `cashappUrl`, `paypalUrl`, and optional **`donationButtonLabel`** (see schema) / or reuse an existing copy field if spec tasks choose not to add a column.
2. **Authorize:** `admin` **OR** (`playerId` has `InstanceMembership` on that `instanceId` with `roleKey` ∈ {`owner`, `steward`}).
3. **Audit:** Log admin/campaign-owner edits (reuse `AdminAuditLog` for admins; for non-admin owners, either extend audit table or add `InstanceAuditLog` minimal row—**tasks** pick one).

### FR3 — Event owner edit (EventArtifact)

1. Allow **optional** overrides for an **`EventArtifact`**: either **inherit all** from linked `Instance` (default) or **override** provider URLs and/or **button label** for CTAs rendered in **event** contexts.
2. **Authorize:** event owner only (definition above); admins may also edit.
3. Persistence: **prefer** a small JSON column on `EventArtifact` (e.g. `donationCtaOverrides` / `Json?`) with validated shape mirroring Instance URL keys + optional `label` / `hideWizard` booleans—**tasks** finalize schema vs. normalized table.

### FR4 — UI surfaces

1. **Campaign:** A **settings** or **fundraising** subpage under campaign (e.g. `/campaign/...` or admin-adjacent route) visible to **admin + campaign owners** for that `Instance`, containing form fields for FR2.
2. **Event:** Owner-accessible control on **event** detail or event settings for FR3.
3. **CampaignDonateButton:** Continue defaulting to `/event/donate/wizard?ref=...`; no need to embed URLs in the button if settlement resolves `ref` correctly. Optional `href` override remains for edge cases (code-level only) unless product adds per-campaign override field.

### FR5 — API / onboarding helpers

1. Update **`/api/onboarding/donation-url`** (or deprecate in favor of a named route) so clients requesting a single external URL can pass **`ref`** and receive the **resolved** instance’s preferred URL (same priority order as today: Stripe, Venmo, Cash App, PayPal—document order).

---

## Non-goals (v1)

- Multi-currency or new PSP integrations beyond existing URL fields.
- Automatic verification that Venmo/Cash App recipients match legal entity (manual stewardship).
- Changing **redemption pack** economics (`donationPackRateCents`) for non-admins unless explicitly added in tasks.

---

## Acceptance criteria

1. With **`?ref=bruised-banana`** (or canonical campaign ref for BB residency), `/event/donate` shows **that** instance’s name and provider links, not another instance’s.
2. A player with **only** `InstanceMembership` `owner`/`steward` on BB can **save** URL updates; a random logged-in player **cannot**.
3. An **event owner** can save event-level overrides; others cannot.
4. **Admins** can edit any instance and (per tasks) any event override.
5. Existing flows with **no** `ref` still work using **active** instance.

---

## Open questions (resolve in `plan.md` / implementation)

- **Uniqueness:** Is `Instance.campaignRef` unique in DB? If not, add partial unique index or resolve by `slug` + `campaignRef`.
- **Label field:** New `Instance.donationButtonLabel` vs. reusing `showUpContent` snippet—prefer explicit nullable string for button text only.

---

## References (code)

- `getActiveInstance()` — `src/actions/instance.ts`
- `/event/donate`, `/event/donate/wizard` — `src/app/event/donate/`
- `CampaignDonateButton` — `src/components/campaign/CampaignDonateButton.tsx`
- `Instance` payment columns — `prisma/schema.prisma` (`Instance` model)
