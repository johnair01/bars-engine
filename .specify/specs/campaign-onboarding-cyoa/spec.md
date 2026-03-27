# Spec: Campaign onboarding CYOA (unified)

## Intent — what you are trying to do (integration, not silos)

**You are integrating three things that are often treated as separate products:**

1. **Narrative onboarding** — CYOA-style paths (invite, campaign, initiation) that orient people and earn consent.
2. **Operational onboarding** — who may edit what (stewards, owners, admins) without JSON or three different mental models.
3. **Residency survival** — **funding is part of the same arc**, not a footer link: especially in **Urgency / resource** framing (Kotter), people should see **how to support the campaign** *while* they onboard—**before** account creation where anonymous/demo paths exist, **after** sign-up where logged-in surfaces apply, and **persistently** on every **campaign-scoped** surface (hub, board, initiation, twine, event) so support is never “hidden behind” story or gameboard alone.

Specs must **name** this so implementers do not ship “CYOA without donate” or “donate without story.” **Related:** [donation-self-service-wizard](../donation-self-service-wizard/spec.md) for money flows; this spec owns **placement + ontology** alongside narrative CYOA.

---

## Ontology — one flow

In **BARs Engine**, **campaigns need onboarding**: a structured path from “outside” to “inside” the residency—orientation of meaning, consent, and next steps. **Invitations are a form of onboarding**: they carry context, tone, and choice before someone commits. **In this engine, invitations are always choose-your-own-adventure**—branching passages and choices, not a single static blurb.

**Admin / campaign CYOA** (`CampaignReader` on `/campaign`, initiation routes, `Adventure` + `Passage` rows) and **event-invite CYOA** (`EventInviteStory` on `CustomBar.storyContent`, `EventInviteStoryReader` on `/invite/event/[barId]`) are **not separate product universes**. They are **facets of the same ontological flow**: **campaign-scoped story that onboards people**—whether they arrive via **invite link**, **campaign hub**, or **event initiation**. Implementation details differ (schema, permissions, URLs); the **authoring experience and mental model** should **converge** over time so operators are not learning “three different CYOA systems.”

**Depends on / related:**

- [event-invite-inline-editing](../event-invite-inline-editing/spec.md) — where invite fields may be edited today (Vault, public URL).
- [event-invite-party-initiation](../event-invite-party-initiation/spec.md) — party/initiation slugs and constraints.
- [`EventInviteStory` schema](../../../src/lib/event-invite-story/schema.ts); campaign adventures — [`Adventure`](../../../prisma/schema.prisma) / `Passage` via `campaign-passage` actions.
- [UI_COVENANT.md](../../../UI_COVENANT.md) for operator-facing builder chrome.

---

## Purpose (deliverable)

Ship a **LEGO + prompt-driven builder** for **CYOA onboarding content**—first targeting **event invites** (highest pain: raw JSON), then **reusing the same interaction patterns** (passage list, choices, preview, prompts) for **campaign / admin campaign CYOA** where policy allows—so **stewards, owners, and admins** compose branching stories **without** JSON or Twine soup, with **preview parity** to player readers.

**Problem today:** Invite stories are edited as **JSON** (`EventInviteBarContentEditor`). Campaign passages use **admin-gated** modals (`CampaignPassageEditModal`) tied to `upsertCampaignPassage`—ergonomic for neither stewards nor most operators. The **reader** UIs are decent; **authoring** is fragmented and ontology-opaque.

---

## Principles

1. **One mental model** — “I am building **onboarding CYOA** for this campaign” — whether the artifact is an **event_invite BAR** or an **Adventure** passage graph for `/campaign`.
2. **Invitations ⊆ onboarding** — All invite stories are CYOA; not all onboarding is an invite (e.g. hub wake-up), but **invite is always a CYOA instance** in BARs.
3. **Funding ⊆ onboarding (residency)** — **Support / donate** is a **first-class affordance** on campaign journeys, not an afterthought: visible in **demo / pre-signup** paths, **post-auth** paths, and **persistent chrome** on campaign routes (e.g. `/campaign/board`, `/campaign/hub`, `/campaign/initiation`, `/campaign/twine`, `/event` as appropriate). Exact route (`/event/donate` vs hub) follows [donation-self-service-wizard](../donation-self-service-wizard/spec.md) and app routing; **this spec** requires **product coherence**: no campaign surface ships without a **clear support** path when the residency is fundraising.
4. **Dual-track + composting** — Prompts may use AI **draft-only**; static templates always work; old JSON paths remain **advanced escape hatches** until retired.
5. **Challenger** — Edits scoped by **instance / campaignRef / adventure**; no cross-tenant graph writes.

---

## Surfaces (inventory)

| Surface | Reader | Authoring today | Target |
|---------|--------|-----------------|--------|
| Event invite | `EventInviteStoryReader`, `/invite/event/[barId]` | JSON in Vault + inline | **LEGO builder** + preview (Phase B) |
| Campaign / initiation CYOA | `CampaignReader`, `/campaign`, initiation URLs | Admin-only `CampaignPassageEditModal` + `campaign-passage` | **Same builder patterns** + permission policy (Phase E) |
| Campaign chrome (hub, board, …) | N/A (navigation + CTAs) | Text links; donate not always prominent | **Visible buttons** + **persistent donate / support** aligned with residency (see § Funding ⊆ onboarding) |
| Twine / admin grammar | Various | Admin tools | **Out of this spec** unless we explicitly merge later |

---

## Goals

1. **LEGO UI** — Passages and choices as objects; graph validation with plain-language errors.
2. **Prompts** — Guided fields + optional draft assist; confirm before save.
3. **Preview parity** — Draft matches `EventInviteStoryReader` first; then campaign reader parity for campaign phase.
4. **Role clarity** — Stewards vs owners vs admins documented per surface; fix invite **list vs save** mismatch (see [tasks](./tasks.md)).

## Non-goals (v1)

- Replacing **Twine** pipeline or **quest grammar** admin—different layer.
- Full **SugarCube macro** parity in invite JSON (`CampaignReader` macros stay campaign-side until unified model exists).

---

## Technical approach (phased)

### Event invite (Phase B–D)

- DB: `CustomBar.storyContent` → validated `EventInviteStory`; builder ⇄ JSON round-trip (see prior event-invite builder detail in git history or inline-editing spec).

### Campaign CYOA (Phase E — same spec, later implementation)

- DB: `Passage` rows on `Adventure` linked to campaign/instance; reuse **graph editing** UX from invite builder where shapes align; **permissions** may expand beyond today’s admin-only—**explicit product + security sign-off** (steward editing campaign copy is powerful).

### Unification

- Shared **components**: passage list, choice editor, preview shell; **adapters** per persistence (`EventInviteStory` vs passage graph).
- Optional long-term: **canonical intermediate graph model** in code—compile to each storage shape.

---

## User stories

1. **As a steward**, I describe onboarding as **choices and passages** in one builder—not two systems and not JSON.
2. **As an invite sender**, I personalize **invite CYOA** with prompts and blocks; guests see `EventInviteStoryReader`.
3. **As an operator**, I understand that **invite and campaign onboarding** are the **same kind of object** in the product story—even if shipped in phases.
4. **As a visitor or new player**, I can **support the residency** at the right moments: when I’m **anonymous or demoing**, when I’m **signing up**, and when I’m **in any campaign context**—without hunting for a donate link.
5. **As Bruised Banana (or any residency)**, **urgency** (resources) is reflected in **UI**, not only copy inside a CYOA node.

---

## Acceptance criteria (summary)

| Phase | Criterion |
|-------|-----------|
| A | Ontology + role decisions documented (this spec). |
| B | Event-invite **visual builder** ships; JSON advanced-only. |
| C | Static prompt templates for invite stories. |
| D | Docs: runbook paragraph—**campaigns, onboarding, invites = CYOA**. |
| E | Campaign passage authoring uses **shared builder patterns** (scope TBD in tasks). |
| **F — Residency funding & nav** | **Funding + navigation:** campaign-scoped pages expose **prominent support/donate** (and **board/hub** nav as **buttons** where specified); **pre- and post-signup** donate paths documented and wired per [donation-self-service-wizard](../donation-self-service-wizard/spec.md) constraints. |
| **G — Canonical contribute flow (DSW)** | **Single guided path:** campaign **Donate** controls default to **`/event/donate/wizard`** so players choose **money** or **services** (wizard: **Time** + **Space**); **reversible** navigation per DSW Phase 3; **money** completion updates **fundraising milestone** via DSW **FR6** / BBMT (see [DSW § Phase 3](../donation-self-service-wizard/spec.md)). |

**F** may ship as its own PR wave; it is **not** optional for “Bruised Banana residency complete” if product declares fundraising live. **G** tightens **entry URLs + query contract** between campaign chrome and DSW; can ship as a follow-up PR after **F** chrome exists.

---

## How other specs should reference this (avoid drift)

| Spec / artifact | Should say |
|-----------------|------------|
| **This spec (COC)** | Canonical **ontology** + narrative + **funding placement** for campaign onboarding. |
| [donation-self-service-wizard](../donation-self-service-wizard/spec.md) | **Money flows**, tiers, `dsw_meta`, **Phase 3** reversible paths + **canonical wizard entry**; link **here** for **where** donate appears in campaign/journey. |
| [event-invite-party-initiation](../event-invite-party-initiation/spec.md) / [inline-editing](../event-invite-inline-editing/spec.md) | Invite **content**; link **here** for unified onboarding story. |
| [BACKLOG.md](../../backlog/BACKLOG.md) **COC** | Row stays the **ledger** pointer; **F** acceptance may spawn sub-tasks. |
| Runbooks / `/event` | Copy **consistent** terms: “Support the residency,” “Donate,” same targets as DSW. |

---

## Open questions

1. **Steward** edit on **invites** and/or **campaign passages** — same policy or different?
2. **Adventure** selection: which campaign adventure slug is “the” onboarding graph for a given instance?
3. Mobile authoring priority?
4. **Single shared component** for “Support / Donate” on all campaign surfaces (`CampaignDonateCta`) vs per-page styling—**recommend** shared primitive for Sage consistency.

---

## Six faces (short)

| Face | Note |
|------|------|
| **Sage** | This spec is the **integration** anchor—one ontology, phased code. |
| **Architect** | Graph validity, shared adapters. |
| **Diplomat** | User-facing language: “onboarding story,” not “JSON” / “node id”. |
