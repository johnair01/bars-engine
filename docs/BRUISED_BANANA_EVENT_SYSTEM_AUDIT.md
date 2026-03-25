# Bruised Banana Event System — Audit & MVP Path

**Source:** Cursor super prompt (Bits = BARs; event field). **Date:** 2026-03-25.  
**Method:** Codebase search for BAR/event/onboarding/bingo/crew/admin; compared to [party-mini-game-event-layer](.specify/specs/party-mini-game-event-layer/spec.md), [event-invite-party-initiation](.specify/specs/event-invite-party-initiation/spec.md), swap/CSHE specs.

---

## 1. Audit summary

| Area | What exists |
|------|-------------|
| **BAR / CustomBar** | Full Prisma model; `event_invite` type; `partifulUrl`, `eventSlug`; system BARs, strand agent player |
| **Event scheduling** | `EventArtifact`, `EventCampaign`, `/event` listing, ICS, invites via `campaign-invitation` |
| **Invite portal (public)** | `/invite/event/[barId]` — JSON CYOA (`EventInviteStoryReader`), Partiful + initiation CTAs (`EventInvitePartyActions`) |
| **Onboarding / Twine** | `/campaign/event/[eventSlug]/initiation` + seeded Adventures per event slug |
| **Bingo** | `PartyMiniGameInModal`, `definitions.ts` (invite + Apr4 dance + Apr5 scheming 3×3), sessionStorage, BAR metabolize (`party-mini-game-bar.ts`) |
| **Clothing swap** | Separate CSHE / swap-event intake specs and routes (`swap-rsvp`, organizer flows) |
| **Crew** | Pre-production `EventArtifact` children, `functionalRole` / invites — not a dedicated “crew roster” UI |
| **Bits → BAR** | Charge capture, hand vault, quest pipeline — not event-specific but covers capture |
| **Admin** | Instances, campaigns, event schedule editors, forge invitation BAR |

**Conclusion:** The **core loop** Invite BAR → `/event` bingo → optional vault BAR capture → initiation is **implemented**. Gaps are mostly **ops** (URLs, active instance, seeds) and **polish** (crew surface, copy alignment with stakeholder bingo lists).

---

## 2. Maturity report (0–3)

Scoring: **0** absent · **1** stub · **2** usable · **3** production-ready with docs/seeds.

| Priority | Score | Evidence |
|----------|-------|----------|
| **P1 Event BAR as invite portal** | **2–3** | `event_invite` BARs, Partiful, initiation routes, CYOA, bingo CTAs in seed. Real Partiful URLs = ops. |
| **P2 Bits → BAR pipeline** | **2** | Fast capture paths exist; not renamed “bits” in product copy everywhere. |
| **P3 Event types (Dance / Scheming / Swap)** | **2** | Dance + Scheming on `/event` + bingo defs. **Clothing swap** = parallel CSHE stack (~2). |
| **P4 Bingo (invite / dance / scheming)** | **3** | Phase 1–3 done per PMEL spec; interactive grid, persistence, BAR stamp. Copy in `definitions.ts` (editorial close to super-prompt lists). |
| **P5 Crew structure** | **1** | Pre-prod events + roles in data model; **no** dedicated “crew” landing UI. |
| **P6 Lightweight onboarding** | **2** | Event-scoped initiation + campaign reader; not a single linear “best experience” tour. |

---

## 3. Gap analysis (target flow)

**Target:** Invite → BAR → Onboarding → Bingo → Interaction → BAR capture

| Step | Status | Gap |
|------|--------|-----|
| Invite | **OK** | Public invite URLs; Partiful placeholder until replaced |
| BAR (doorway) | **OK** | JSON story + CTAs |
| Onboarding | **OK** | Twine initiation per `eventSlug`; needs DB seed in each env |
| Bingo | **OK** | Anchors `#bb-invite-bingo-apr4` etc.; modals |
| Interaction | **OK** | Tap toggles; optional tag on metabolize |
| BAR capture | **OK** | `createPartyMiniGameMomentBar` + vault |

**Weakest links:** (1) **Instance + `EventArtifact`** alignment on prod (you addressed). (2) **Crew** visibility. (3) **Copy drift** between super-prompt bullet lists and `definitions.ts` (minor wording).

---

## 4. MVP plan (minimal, dependency-ordered)

1. **Ops (no code):** Active instance + real Partiful URLs + run seeds (`seed:event-invite-bar`, `seed:strand-agent`, event party seed if needed).
2. **Verify:** Incognito: invite URL → Partiful + initiation → `/event` bingo tap → optional vault BAR (logged in).
3. **Optional P5 slice:** One admin or `/event` subsection “Crew / pre-production” linking to child events — **only** if stewards ask; else defer.
4. **Copy:** If stakeholders want exact super-prompt phrasing, edit `src/lib/party-mini-game/definitions.ts` only (single source of truth).

---

## 5. Implementation status

**Already shipped in repo** (no duplicate build required for core loop):

- Event invite + initiation: `.specify/specs/event-invite-party-initiation/`
- Party mini-game: `.specify/specs/party-mini-game-event-layer/` (tasks closed)
- Strand BAR creator: `.specify/specs/strand-bars-creator-identity/`

**Smallest new code** if product insists on P5 next: a thin section component on `/event` that queries child `EventArtifact` rows for the active instance and lists pre-production crews — spec-first before coding.

---

## 6. Deferred items

- Full **crew** holarchy UI, RSVP inside app replacing Partiful, bingo analytics dashboard.
- **“Bits”** branding pass across Hand/charge capture (copy/IA only).
- **Clothing swap** end-to-end until CSHE milestone is prioritized.
- Automatic migration of **old** strand BARs to strand-agent `creatorId`.

---

## Principle check

- **Bits drive system:** BAR + bingo metabolize path exists.
- **Interaction > interface:** Modals + tap-first bingo match this.
- **Not overbuilt:** Do not add ontology; extend `definitions.ts` and ops before new tables.
