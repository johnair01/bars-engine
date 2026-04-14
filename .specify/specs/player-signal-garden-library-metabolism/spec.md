# Spec: Player signal garden & library charge metabolism

## Purpose

Give players and stewards a **legible path** from **uncharged external information** → **emotional charge** → **BARs/quests** → **collective seeding**, without forcing every note to be a `CustomBar` on day one. Introduce a **garden** metaphor (seeds vs weeds, spaced return) so **composting** is **obvious and teachable**, and connect **library-sourced** snippets to **player-validated, charge-upgraded** artifacts so admins and **librarian-role** stewards receive **stronger signals** for what to ship into the world.

**Problem:**

1. **Everything captured as information tends to become a BAR** today. BARs are powerful but heavy; **pre-BAR “signals”** (voice notes, class bullets, Pocket excerpts) need a **lighter home** with clear **promote to BAR** semantics.
2. **Composting affordances** (archive, 321 lineage, vault throughput — see [NEV](../now-event-vault-throughput-qol/spec.md)) exist but are **not obvious or mature enough** to help people **grow up** information from raw capture to quest-shaped work.
3. **Ingested library / book / external corpus** can be turned into **pullable** content ([book-to-quest-library](../book-to-quest-library/spec.md), [LCG](../library-conditioned-gm-generation/spec.md)), but **player-facing charge** on those extractions is **weak** unless an admin intermediates. We want a **Duolingo-style praxis loop**: short **validation / attune / upgrade-with-charge** quests so players earn **vibeulons** (Energy) and librarians see **aggregated quality + emotional context** before **seeding** campaigns or kernels.

**Practice:** Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI for scheduling and garden state where possible. Ship **thin vertical slices**; avoid a second parallel quest engine — **extend** charge capture, BAR types, library threads, and attunement patterns.

## Design Decisions

| Topic | Decision (v0 direction — confirm in Phase 0) |
|-------|-----------------------------------------------|
| **Pre-BAR storage** | Prefer a first-class **`PlayerSignal`** (or equivalent) model **or** a dedicated `CustomBar` subtype **`signal_draft`** with **no quest eligibility** until promoted — **spike compares** migration cost vs clarity. |
| **Garden vs Vault** | **Vault** = archive of **committed** BARs / identity artifacts. **Garden** = **active cultivation surface** for signals + young BARs with **spaced repetition** cadence (weeds/seeds), not a duplicate of Hand. |
| **Weed vs seed** | **Seed** = promoted toward charge → BAR/quest; **Weed** = dismiss, compost without shame, or snooze — **player-owned labels**; optional steward **taxonomy** later. |
| **Charge gate** | A **quest** that represents **library validation** must optionally **attach** `emotion_channel` / intensity (reuse `charge_capture` `inputs` shape or link to a **child charge BAR**). |
| **Librarian role** | Reuse **Regent / librarian** patterns from [SCL](../site-signal-card-club-chs-portal-bar-journey/spec.md) and [k-space-librarian](../k-space-librarian/spec.md) where applicable; **new** aggregates = “signals validated,” “charge overlays,” **not** raw private text by default. |
| **Daily charge limit** | Today [charge-capture](../../../src/actions/charge-capture.ts) enforces **one charge per day**. Garden/library loops may need **exceptions** (organizer mode, signal-attached mini-charge) — **explicit product decision** in Phase 0. |

## Conceptual Model

| WHO | WHAT | WHERE | Energy / throughput |
|-----|------|-------|----------------------|
| **Player / student / organizer** | **Signals** (uncharged), then **charged** promotions, then **quests** | Personal **garden** + `/capture` + Hand | Vibeulons on **praxis** completions |
| **Librarian / steward** | Review **aggregates**, seed **campaign_kernel** / library quests | `/library`, admin | **Wake Up / Grow Up** on collective intake |
| **System** | Spaced reminders, “weed” snooze, library **deck** scheduling | Notifications / NOW (future) | Deterministic scheduling first |

```text
External note / Pocket / class chat
        ↓
   PlayerSignal (uncharged)  ←── NEW or signal_draft BAR
        ↓  (player: “this still hits” + channel)
   Charge metadata attached
        ↓
   promote → charge_capture BAR OR direct quest suggestion
        ↓
   Garden cadence (seed: revisit; weed: compost)
        ↓
   Optional: Library excerpt → validation quest → charge upgrade → librarian signal
```

## API Contracts (API-First) — Phase 0 sketch

> **Concrete signatures** to be frozen after spike; names illustrative.

### `createPlayerSignal`

**Input**: `{ summaryPlain: string; source?: { kind: string; externalId?: string; url?: string }; allyshipDomainHint?: string }`  
**Output**: `{ success: true; signalId: string } | { error: string }`  
**Server Action** — player-scoped.

### `promoteSignalToChargeBar`

**Input**: `{ signalId: string; emotion_channel; intensity?; personal_move? }`  
**Output**: `{ success: true; barId: string } | { error: string }`  
**Policy**: May relax daily limit when `signalId` is present — **TBD**.

### `listGardenBed` (read)

**Input**: `{ playerId: self }`  
**Output**: `{ seeds: SignalSummary[]; weeds: SignalSummary[]; nextReviewAt: Record<string, ISODate> }`  

### Library praxis (Phase 2+)

**Input**: `{ libraryThreadId or excerptId; action: 'validate' | 'attune' | 'charge_overlay' }`  
**Output**: quest completion + **aggregate bump** for librarian dashboard — ties to existing **QuestThread** / **PlayerQuest** where possible.

## User Stories

### P1: Uncharged capture

**As a** player, **I want** to drop a quick note or pasted quote **without** it immediately becoming a full BAR, **so that** I do not clutter my vault or trigger compost guilt.

**Acceptance:** I can save a signal with citation; it appears in a **Garden inbox**; nothing appears in Vault as a BAR until I promote.

### P2: Garden cadence

**As a** player, **I want** the game to **bring back** a few seeds on a gentle schedule, **so that** I can decide what still matters (Harvest Moon / spaced repetition tone).

**Acceptance:** At least one deterministic schedule (e.g. +3d / +7d) and UI to mark **weed** or **still a seed**.

### P3: Library → charge → collective signal

**As a** player, **I want** short library-fed micro-quests where I **validate or emotionally annotate** an excerpt, **so that** my work earns vibeulons and helps stewards.

**Acceptance:** Completing the quest writes **structured metadata** visible to librarian aggregate (not necessarily raw transcript).

### P4: Steward / admin

**As a** librarian, **I want** a dashboard of **“well-attested extractions”** (count + emotion spread + opt-in samples), **so that** I can seed campaigns confidently.

**Acceptance:** Read-only aggregate API + admin page section (Phase 3).

## Functional Requirements

### Phase 0 — Ontology & spike

- **FR0.1**: Document **two** persistence options (new `PlayerSignal` table vs `signal_draft` BAR) with **migration + privacy** tradeoffs.
- **FR0.2**: Align with [charge-capture-ux-micro-interaction](../charge-capture-ux-micro-interaction/spec.md) and **daily limit** policy.
- **FR0.3**: Map overlap with [hand-vault-bounded-inventory](../hand-vault-bounded-inventory/spec.md), [NEV](../now-event-vault-throughput-qol/spec.md), [GSCP](../generated-spoke-cyoa-pipeline/spec.md) (spoke charge).

### Phase 1 — Signal inbox + promote

- **FR1.1**: CRUD **minimal** player signals + citation JSON.
- **FR1.2**: **Promote to charge BAR** (or open `/capture` with prefill from signal).
- **FR1.3**: Player-facing **Garden** page (or tab) listing seeds/weeds + **next review**.

### Phase 2 — Spaced repetition mechanics

- **FR2.1**: Scheduler updates `nextReviewAt` on completion / snooze.
- **FR2.2**: Copy + UX that teach **compost** vs **grow** (link to 321 where fit).

### Phase 3 — Library praxis loop

- **FR3.1**: Wire **library excerpt** or **QuestThread** slice into a **short quest** template.
- **FR3.2**: On completion, persist **charge overlay** or link `chargeSourceBarId`-style lineage.
- **FR3.3**: **Vibeulon** mint / attunement hook per [attunement-translation](../attunement-translation/spec.md) policy (exact amounts in plan).
- **FR3.4**: Librarian aggregate queries (anonymized / k-min threshold).

## Non-Functional Requirements

- **Privacy:** Signals may contain **PII**; encryption-at-rest follows DB; **no** public signal lists; aggregates **k-anonymity** where possible.
- **Performance:** Garden lists paginated; no unbounded JSON scans on hot paths.
- **Backward compatibility:** Existing BAR-only flows unchanged for players who ignore Garden.

## Persisted data & Prisma

> **Required after Phase 0 decision.** If new models (`PlayerSignal`, `GardenBed`, `LibraryPraxisCompletion`): follow [prisma-migration-discipline](../../.agents/skills/prisma-migration-discipline/SKILL.md); `tasks.md` must include `npx prisma migrate dev --name …` and committed SQL.

| Check | Done |
|-------|------|
| Model chosen and named in **Design Decisions** | |
| Migration task in `tasks.md` | |

## Scaling Checklist

| Touchpoint | Mitigation |
|-------------|------------|
| External URLs in signals | Store URL + fetch policy; no auto-scrape without consent |
| AI for weed/seed classification | **Off by default**; player labels first |

## Verification Quest (UX)

- **ID**: `cert-player-signal-garden-v1` (ship with Phase 1 or 2 when player-visible)
- **Steps**: Create signal → see in garden → receive “review” prompt → promote to charge → complete one explore step → mark one item weed.
- Frame toward **Bruised Banana Fundraiser**: “Help players metabolize signal before the party so the engine stays awake.”

## Dependencies

- [`charge-capture`](../../../src/actions/charge-capture.ts), [`charge-quest-generator`](../../../src/lib/charge-quest-generator/)
- [now-event-vault-throughput-qol](../now-event-vault-throughput-qol/spec.md) (compost patterns)
- [book-to-quest-library](../book-to-quest-library/spec.md), [library-conditioned-gm-generation](../library-conditioned-gm-generation/spec.md)
- [site-signal-card-club-chs-portal-bar-journey](../site-signal-card-club-chs-portal-bar-journey/spec.md) (librarian / library)
- [k-space-librarian](../k-space-librarian/spec.md) (optional alignment)
- [attunement-translation](../attunement-translation/spec.md) (vibeulon policy)

## References

- Pocket / external **citation** pattern (conversation): `recordingId`, `recordingTitle`, `recordingDate`
- [conceptual-model.md](../../memory/conceptual-model.md) — WHO / WHAT / WHERE / Energy / moves

## GitHub issue

**Created:** [bars-engine#53](https://github.com/johnair01/bars-engine/issues/53) (epic tracker — paste body updates there if spec diverges).

### Paste body (template)

**Title:** `Epic: Player signal garden + library charge metabolism (PSG)`

**Body:**

```markdown
Parent spec kit: [.specify/specs/player-signal-garden-library-metabolism/spec.md](.specify/specs/player-signal-garden-library-metabolism/spec.md)

### Problem summary
- Need **pre-BAR** home for **uncharged** user signals.
- **Composting** needs to be **obvious**; **garden** (seeds/weeds + spaced return) as main metaphor.
- **Library** extractions need **player charge / validation** loop + **librarian aggregates**, not only admin charging.

### Success (v1 slice)
- [ ] Player can create **signal** + optional **source citation** without creating a vault BAR.
- [ ] Player can **promote** signal → existing charge → quest path.
- [ ] Garden UI lists items with **next review** + weed/seed actions (minimal scheduling).

### Links
- Backlog: **1.74 PSG**
- Tasks: [tasks.md](.specify/specs/player-signal-garden-library-metabolism/tasks.md)
```
