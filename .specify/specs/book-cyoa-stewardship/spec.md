# Spec: Book → CYOA Stewardship (1st Party First, Then Third Party)

## Purpose

Define how **source works** (books, manuals, internal curricula) become **CYOA / in-engine adaptations** under clear **stewardship and attribution**—first for **1st-party** material the team controls, then expand to **third-party** works after internal pilot success.

**Practice**: Deftness Development — spec kit first; legal/comms surfaces documented before external pitch.

## Problem

Without an explicit contract, adaptation work drifts into informal notes, unclear attribution in UI, and risky third-party conversations. The product needs a **repeatable steward workflow** and **phased scope** so engineering, narrative, and ops align before any external book pitch.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Phase order | **Phase A (1st party)** ships first: documentation, in-engine labels, steward workflow, pilot AC on material we own or fully control. **Phase B (third party)** adds licensing checklist, permission workflow, and pitch-facing requirements **only after** Phase A dogfood passes. |
| Steward | Named steward per adaptation initiative; responsible for accuracy, attribution copy, and escalation for rights. |
| Attribution | Every player-visible surface that presents adapted content cites source work and steward-approved wording (stored as data or CMS, not ad hoc strings only). |
| Scope of Phase A | No obligation to support arbitrary external IP; focus on **one internal pilot** end-to-end (e.g. internal or licensed-in-house artifact). |
| Phase B gate | Phase B tasks stay **deferred** in `tasks.md` until Phase A acceptance criteria are met. |

## Conceptual Model

| Dimension | In This Spec |
|-----------|----------------|
| **WHO** | Source steward, campaign/initiative owner, players |
| **WHAT** | Adaptation of a static work into interactive CYOA structure |
| **WHERE** | Campaign / adventure / library surfaces tied to initiative hierarchy (see [campaign-ontology-alignment](../campaign-ontology-alignment/spec.md)) |
| **Energy** | BARs and quests carry provenance back to adaptation initiative |
| **Personal throughput** | Stewards use Show Up / Clean Up on rights and clarity before players see content |

## User Stories

### Phase A — P1: Internal pilot

**As a steward**, I want a documented workflow to publish a CYOA adapted from our 1st-party source, so players see correct attribution and we can iterate safely.

**Acceptance**:

- Written runbook (steward steps: source version, adaptation version, review, publish).
- Player-visible attribution block pattern defined (fields: title, steward credit, optional link).
- At least one pilot adaptation shipped internally with AC sign-off.

### Phase B — P2: Third party (gated)

**As a steward**, I want a checklist before onboarding an external book, so we do not promise engine features we cannot legally ship.

**Acceptance** (only after Phase A complete):

- Licensing / permission checklist documented.
- Franchise or partnership path sketched (non-binding template).
- No third-party pitch until Phase A AC met.

## Functional Requirements

### Phase A

- **FR1**: Stewardship runbook in repo or linked doc (path named in `plan.md`).
- **FR2**: Attribution contract: required fields for adapted passages or hub screens.
- **FR3**: Pilot CYOA identified; verification steps in `tasks.md`.

### Phase B (deferred)

- **FR4**: Third-party intake checklist and escalation path.

## Non-Functional Requirements

- Community-facing language respects sensitivity to AI and extraction (align with project norms).
- Phase B documentation reviewed with human legal/comms before use.

## Dependencies

- [.specify/specs/campaign-ontology-alignment/spec.md](../campaign-ontology-alignment/spec.md) — initiative ownership and lineage inform where adaptation lives.

## Verification Quest

- **ID**: `cert-book-cyoa-stewardship-v1` (optional UX-heavy follow-up): Twine-style cert quest when a player-facing attribution UI ships; until then, **manual verification** via pilot checklist in `tasks.md`.

## References

- Conclave plan: Regent track for phased book/CYOA.
- [campaign-ontology-alignment](../campaign-ontology-alignment/spec.md)
