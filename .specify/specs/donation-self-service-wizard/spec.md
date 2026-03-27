# Spec: Donation self-service wizard (DSW)

## Purpose

Give players a **guided** path from “I want to contribute” to the right **next action**: **money** (honor-system donation + redemption packs), **time**, or **space** (orientation toward BAR / marketplace offers), with optional **fundraiser-host** awareness and **tiered money** context that flows into reporting.

**Problem:** `/event/donate` is a single flat page; stakeholders want branching **money | time | space**, tier copy, and narrative echo without losing the existing honor + pack flow.

**Practice:** Deftness Development — spec kit first; **reuse** `reportDonation` / `Donation.note` for wizard metadata before new tables.

**Related:** [campaign-onboarding-cyoa](../campaign-onboarding-cyoa/spec.md) (COC) — **where** support/donate appears in the **campaign onboarding arc** (pre/post signup, persistent chrome on `/campaign/*`). DSW defines **money/time/space flows**; COC defines **coherence** with narrative + residency CTAs.

## Phase 3 — Campaign-wide entry + “money vs services” (implementation track)

**Intent:** Every **Donate / Support** control on **campaign surfaces** should land donors in the **same guided experience** (`/event/donate/wizard`) so they can choose **money** or **non-money contribution** (“services” in plain language: **time** + **space** in the wizard), **switch paths** without dead ends, and—when a **money** gift is **completed** (self-report)—see **fundraising milestone** progress update per [bruised-banana-milestone-throughput](../bruised-banana-milestone-throughput/spec.md) and existing **FR6** wiring.

| Topic | Decision |
|-------|----------|
| **Canonical entry** | **`/event/donate/wizard`** is the default target for **campaign-scoped** donate CTAs; **`/event/donate`** remains the **settlement** screen for pay links + self-report (and may be linked from wizard). |
| **“Services”** | **Product language:** “services” or “in-kind” maps to wizard branches **Time** and **Space** (not a fourth Prisma path unless we add one later). Copy may say “money or services” while keeping **four** wizard tiles if Host stays separate. |
| **Reversible choice** | From any branch, user can **return to the path picker** (or equivalent) and choose another branch—no trap states. **Symmetric UX:** if **Time** offers a cross-link to **Money**, **Space** should offer the same (see tasks). |
| **Milestone (money brought in)** | On **completed** honor **Donation** with **USD amount** and optional **`dswMilestoneId`**, **FR6** applies: increment milestone **`currentValue`**, run completion hooks. **Time/space** completions do **not** auto-increment USD totals unless a **future** steward workflow assigns dollar equivalents (explicitly **out of scope** for Phase 3 unless product adds FR). |

## Design Decisions

| Topic | Decision |
|-------|----------|
| Entry | **`/event/donate/wizard`** as guided flow; **`/event/donate`** keeps direct pay + self-report (plus link to wizard). |
| Persistence v1 | **No new Prisma models** — append structured segments to `Donation.note` (`[DSW] …`). |
| Money tiers | **Small / medium / large / custom** with fixed suggested USD amounts (configurable constants); custom uses free amount on donate page. |
| Time / space | **CTAs only** — `/bars/create`, marketplace via `resolveMarketplaceCampaignRef()`, copy explains “offer BAR / list on stall”. |
| Host fundraiser | **v1:** informational + link to `/event` and campaign context; no new host onboarding flow. |
| Milestone / quest echo | **v1:** free-text narrative in `note`. **Phase 2:** optional **active milestone** → `MilestoneContribution` + `currentValue`; `Donation.dswMeta` JSON (`milestoneId`, `echoQuestId`); optional quest BAR id on self-report. |

## Conceptual Model

| Layer | WHO | WHAT | WHERE |
|-------|-----|------|-------|
| **Wizard** | Player / donor | Chooses contribution **kind**; money path picks **tier** + optional **narrative** | `/event/donate/wizard` |
| **Money settle** | Logged-in player | External pay + **self-report** → `Donation` + packs | `/event/donate` (existing) |
| **Time / space** | Player | Creates **offer BAR** or **lists on marketplace** | `/bars/create`, `/campaign/marketplace` |

## API Contracts

### `reportDonation` (extended)

**Input** (FormData): existing `instanceId`, `amount`; optional `dswPath` (`money` \| `time` \| `space`), `dswTier`, `dswNarrative`, `dswMilestoneId` (cuid of an **active** milestone for the instance campaign ref), `dswEchoQuestId` (cuid of a `CustomBar` quest for steward echo).

**Output:** unchanged `ReportDonationState`.

**Behavior:** When creating `Donation`, set `note` to include `[DSW]` prefix + key=value segments + optional player narrative. Pending-donation cookie carries same fields for post-auth replay.

## User Stories

### P1: Branching wizard

**As a** visitor, **I want** to pick money vs time vs space, **so** I’m not stuck on a single donate form when I meant to volunteer space.

### P2: Tiered money

**As a** donor, **I want** suggested tiers with plain-language “why”, **so** I understand impact before I pay and self-report.

### P3: Narrative echo

**As a** donor, **I want** an optional line tying my gift to a campaign moment, **so** stewards see intent in the donation record (note field).

### P4: Time / space orientation

**As a** player, **I want** clear next steps for non-money contributions, **so** I land on BAR create or marketplace with the right campaign ref.

### P5: Reversible contribution choice (Phase 3)

**As a** donor, **I want** to try one path (e.g. money) and **switch** to another (e.g. services/time) without losing the thread, **so** I am not locked in by a single mis-tap.

### P6: Milestone reflects money brought in (Phase 3)

**As a** campaign supporter, **when** I **complete** a **money** donation (self-report after pay), **I want** the **residency fundraising milestone** to update, **so** collective progress is visible—per **FR6** and BBMT.

## Functional Requirements

### Phase 1 (shipped target)

- **FR1**: Route `/event/donate/wizard` with step UI: choose path → path-specific content → handoff.
- **FR2**: Money path: tier cards + optional narrative + **Continue** → `/event/donate` with query prefill + hidden wizard fields on self-report.
- **FR3**: Extend `reportDonation` / `createDonationAndPacks` / pending cookie to persist DSW metadata in `note`.
- **FR4**: `/event/donate` links to wizard; documents tier prefill via `searchParams`.
- **FR5**: Time/space path: links + copy; use `resolveMarketplaceCampaignRef()` for marketplace href.

### Phase 2 (shipped)

- **FR6**: `Donation.dswMeta` JSON for `milestoneId` / `echoQuestId`; honor donation with linked **active** milestone creates `MilestoneContribution`, increments milestone `currentValue`, runs `maybeCompleteMilestoneAndAdvanceKotter`.
- **FR7**: **Host / organize** wizard branch — checklist + links to event hub, wizard, direct donate (no new RBAC or instance picker).

### Phase 3 (campaign integration + UX parity)

- **FR8**: **Space** branch includes a visible cross-link to the **money** path (parity with **Time** branch).
- **FR9**: Optional **query params** from campaign entry (e.g. `ref` / `campaignRef`) are preserved on wizard navigation and passed through to `/event/donate` / self-report where already supported, so milestone and instance context stay aligned.
- **FR10**: Audit: **all** campaign-scoped **Donate** affordances (`CampaignDonateButton` and equivalents) default **`href`** to **`/event/donate/wizard`** with documented query contract; direct **`/event/donate`** only where product explicitly wants a **shortcut** to self-report (document in COC tasks).

## Non-Functional Requirements

- **Backward compatibility:** Donations without DSW fields unchanged.
- **Security:** Note length capped (~500 chars narrative); sanitize trim only (honor system already trusts player).

## Verification Quest

- **ID**: `cert-donation-self-service-wizard-v1` — seed via `npm run seed:cert:donation-self-service-wizard` (or full `seed:cert:cyoa`).
- **Steps:** (1) Open `/event/donate/wizard`, pick each path. (2) Money: pick tier → land on `/event/donate` with amount prefilled → report → `Donation.note` contains `[DSW]`. (3) Time/space: links resolve and include dynamic `campaignRef` when applicable.

## Dependencies

- [bruised-banana-donation](../bruised-banana-donation/spec.md) — honor flow, instance URLs.
- [bruised-banana-milestone-throughput](../bruised-banana-milestone-throughput/spec.md) — future milestone echo.
- [campaign-marketplace-slots](../campaign-marketplace-slots/spec.md) — marketplace stall language.
- [campaign-onboarding-cyoa](../campaign-onboarding-cyoa/spec.md) — Phase F/G: campaign donate CTAs → wizard entry; shared query contract.
- [offer-bar-timebank-wizard-modal](../offer-bar-timebank-wizard-modal/spec.md) — **Time / Space** → **`offerBAR` modal** (timebank protocol, marketplace-oriented); replaces raw `/bars/create` hop.
- `src/actions/donate.ts`, `src/app/event/donate/page.tsx`.

## References

- Backlog prompt: [.specify/backlog/prompts/donation-self-service-wizard-spec.md](../../backlog/prompts/donation-self-service-wizard-spec.md)
- Plan: [plan.md](./plan.md)
- Tasks: [tasks.md](./tasks.md)
