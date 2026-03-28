# Spec: Bruised Banana Milestone Throughput & Player Guidance

## Purpose

**Ontological goal:** The **campaign lands** when players experience (1) **place** — “I’m in *this* residency,” (2) **rhythm** — “the collective field is moving,” and (3) **agency** — “my next action clearly **advances** something we agreed matters.”

This spec addresses the gap where **milestone logic exists in data and admin** (Instance `kotterStage`, fundraising goals, quest map containers, hub/spoke architecture) but **players are not reliably guided** to actions that **move Bruised Banana forward** — so the campaign feels like lore and scattered CTAs instead of a **living residency**.

**Practice:** Deftness — dual-track (works without full AI); guidance is **legible** in-app, not wiki-only; compost/vault stay honest constraints ([vault-page-experience](../vault-page-experience/spec.md)).

---

## Problem Statement

| Symptom | Evidence in codebase |
|--------|----------------------|
| **No single “what advances us now?”** | Dashboard [`CampaignModal`](../../src/components/dashboard/CampaignModal.tsx) links to hub, board, event; [`/campaign/page.tsx`](../../src/app/campaign/page.tsx) routes BB to initiation/twine; **no unified milestone strip** tied to instance progress. |
| **Milestones are structural, not narrated** | [Bruised Banana quest map](../bruised-banana-quest-map/spec.md) defines Kotter containers; [`Instance.kotterStage`](../../prisma/schema.prisma) drives gameboard/market; **player-facing copy** rarely connects “your quest” → “period advance.” |
| **Hub vs board vs story compete** | [`/campaign/hub`](../../src/app/campaign/hub/page.tsx) + [`CampaignHubView`](../../src/components/campaign/CampaignHubView.tsx) expose 8 spokes + Kotter label; [`/campaign/board`](../../src/app/campaign/board/page.tsx) shows campaign map + slots; **no prioritized path** for “do this next for BB.” |
| **Game loop is personal-first** | [Game loop BARS↔Quest↔Thread↔Campaign](../game-loop-bars-quest-thread-campaign/spec.md) emphasizes Hand, placement, threads; **campaign milestone contribution** is a second-class mental model unless explicitly surfaced. |
| **House / fundraiser split** | [House integration analysis](../bruised-banana-house-integration/ANALYSIS.md) documents dual intentions (fundraiser vs house health); **no spec-owned bridge** from player action → **visible** milestone motion for both tracks. |

---

## Dependencies & alignment

| Spec | Alignment |
|------|-----------|
| [campaign-hub-spoke-landing-architecture](../campaign-hub-spoke-landing-architecture/spec.md) | Hub/spoke/landing is the **spatial** metaphor; this spec adds **milestone-throughput** UX and contracts so spokes/board/quests **point at** collective beats. |
| [bruised-banana-quest-map](../bruised-banana-quest-map/spec.md) | Kotter containers + subquests = **where** work attaches; this spec defines **how players discover** stage-relevant actions. |
| [game-loop-bars-quest-thread-campaign](../game-loop-bars-quest-thread-campaign/spec.md) | Personal BAR→quest→gameboard loop **feeds** milestones when `campaignRef` and placement are explicit; cross-link actions. |
| [vault-page-experience](../vault-page-experience/spec.md) | Vault caps + compost; **hard gate** on hub CYOA remains [CHS](../campaign-hub-spoke-landing-architecture/spec.md); guidance must not shame hoarding. |
| [wake-up-campaign-birthday-pivot](../wake-up-campaign-birthday-pivot/spec.md) | Narrative funnel (5 Acts); **copy layer** for milestone framing should align with guided actions. |
| [sustainability-onboarding-lore](../sustainability-onboarding-lore/spec.md) | Wiki/onboarding path; guided surfaces should **link** to canon without duplicating. |

---

## Conceptual model

| Layer | Meaning | Primary artifacts |
|-------|---------|-------------------|
| **Milestone (collective)** | Verifiable beat the residency cares about (funds threshold, period advance, house task, RSVP) | `Instance` (goal, dates, `kotterStage`), `EventArtifact`/campaign kernels, admin-defined checklist (v1: **declarative config**). |
| **Guided action (player)** | One or more **primary next actions** derived from milestone + player state | Links to gameboard slot, hub spoke, quest map container, `/capture`, `/hand`, donation CTA — **ordered** by rules in this spec. |
| **Progress signal** | Player sees **movement** (%, stage name, “since you last visited”) | Dashboard strip, hub header, optional `/event` mirror. |

**Sage constraint:** Guidance is **suggestive**, not coercive; **no** fake progress; unclear milestones stay **admin-visible** until defined.

---

## North star loop (v1 product contract)

**Definition:** After sign-in, a Bruised Banana player can follow **one prioritized guided action** from [`computeGuidedActions`](../../src/lib/bruised-banana-milestone/guided-actions.ts), finish a **concrete** in-app step, and **not** get lost between hub, board, and story — with **at least one** path where **collective progress** (fundraiser line, gameboard participation, or onboarding completion) **visibly or structurally** advances.

**Loop (repeatable value):**

| Step | Player experience | Spec / code anchor |
|------|-------------------|---------------------|
| **1. Orient** | See **where the residency is** (Kotter stage, fundraiser line, dates) on dashboard **or** hub. | `MilestoneSnapshot` + [`CampaignMilestoneStrip`](../../src/components/campaign/CampaignMilestoneStrip.tsx) |
| **2. Act** | Tap the **first** guided action (max three shown) — onboarding, vault relief, gameboard slot, or hub — not a flat grid of equal CTAs. | `getCampaignMilestoneGuidance` → [`computeGuidedActions`](../../src/lib/bruised-banana-milestone/guided-actions.ts) |
| **3. Complete** | Finish the step the link implies (e.g. claim a board slot, complete onboarding rail, compost, donate via `/event/donate/wizard`, complete a spoke CYOA when that is the primary path). | Gameboard actions, DSW, CHS spoke flows — **traceability:** [plan.md § North star path](./plan.md#north-star-path-traceability) |
| **4. Signal** | See **movement** when the underlying data moves: e.g. **fundraising line** after money donation, **new slot state** on board, **onboardingComplete** so the next primary action promotes to hub/board/event. | Instance fields + strip copy; no fabricated % |

**Non-goals for this loop (v1):**

- **Full [CHS](../campaign-hub-spoke-landing-architecture/spec.md)** — all eight spokes, I Ching period draw, vault modal gate, and deck topology are **not** required for the North star; **one** spoke or hub entry as *a* guided destination is enough until CHS hardens.
- **Perfect milestone accounting** — every quest click does not need to map to `kotterStage`; **admin/steward** may still advance stage. The loop must stay **honest** (no fake ticks).
- **AI-personalized** next-action copy (templates + rules only).

**Verification quest (manual — run after hub, guidance, donation, or gameboard changes):**

1. Log in as a test player with BB **`ref`** (e.g. `bruised-banana` / instance default).
2. Open **dashboard** or **`/campaign/hub?ref=…`**: confirm **milestone strip** shows stage + fundraiser line (if goal set).
3. Note the **first** guided action label + href; navigate there with **`ref` preserved** where applicable.
4. Complete the implied step (shortest path):
   - **Onboarding incomplete:** finish until onboarding flag clears; confirm guided actions **change** (promotion to vault → board → hub ladder).
   - **Vault cap:** compost or free a slot; confirm vault actions **no longer** dominate primary CTA.
   - **No gameboard participation:** pick or bid a slot; reload hub/dashboard — confirm participation state allows **hub** as primary (or document gap if detection lags).
   - **Hub as primary:** enter **one** spoke or collective path; confirm no **“Could not load this step”** / dead `targetId` (see [UGA](../unified-cyoa-graph-authoring/spec.md) if broken).
5. **Collective signal:** trigger at least one of: **donation** (wizard or self-report) so **fundraiser line** updates, or **visible** board/hub state change; if **no** field updates, file a **single** follow-up task or backlog row (do not silently pass).
6. Optional repeat next day: same player should recognize **rhythm** (strip + primary CTA still coherent).

**Traceability table** (priority ladder → completion → signal) lives in [plan.md § North star path](./plan.md#north-star-path-traceability).

---

## User stories

### P1 — See the residency milestone

**As a** player aligned with Bruised Banana, **I want** to see **what milestone we’re in and what “forward” means** (e.g. Kotter stage + fundraiser progress + house line if applicable), **so** I’m not guessing.

**Acceptance:** At least one surface (dashboard campaign entry **or** campaign hub **or** event) shows **instance-scoped** progress fields with **plain-language** milestone labels (configurable per instance).

### P2 — Primary next action(s)

**As a** player, **I want** **1–3 suggested actions** that **advance** the current milestone (e.g. add subquest to stage container, contribute, enter spoke, place quest on board), **so** I don’t bounce between hub/board/story randomly.

**Acceptance:** Rules table in `plan.md` implemented; actions deep-link with `ref=bruised-banana` (or instance `campaignRef`); respect vault caps ([vault-limits](../../src/lib/vault-limits.ts)).

### P3 — Creators/admins set milestone definitions

**As an** admin, **I want** to **configure** which milestones exist for BB (v1: JSON or admin fields on Instance / campaign config), **so** engineering doesn’t hardcode copy.

**Acceptance:** Documented schema + seed or admin path; falls back to **Kotter stage + goal %** only if custom milestones absent.

### P4 — Game loop integration

**As a** player who completes a **personal** quest or BAR, **I want** optional **“Count toward BB”** placement when relevant, **so** personal throughput ties to collective milestone ([game loop](../game-loop-bars-quest-thread-campaign/spec.md)).

**Acceptance:** Cross-link from placement UI or quest detail when `campaignRef` matches BB; no forced placement.

---

## Functional requirements

- **FR1**: **Milestone surface** — At least one player-visible component shows **collective progress** for the active Bruised Banana instance (goal %, `kotterStage` label, dates if set).
- **FR2**: **Guided actions** — Server- or config-driven list of **recommended links** (href + label + rationale key) **scoped** by `campaignRef` and player state (e.g. membership, onboarding complete).
- **FR3**: **Consistency** — `campaignRef` resolution matches [`parseCampaignRef`](../../src/lib/campaign-subcampaigns.ts) / instance defaults (`bruised-banana` fallback patterns).
- **FR4**: **No duplication of CHS** — Full hub/spoke/deck/I Ching remains [CHS](../campaign-hub-spoke-landing-architecture/spec.md); this spec **feeds** players **into** those routes when they advance milestones.
- **FR5**: **Telemetry hooks** (optional v1) — Click-through on guided actions for later iteration (privacy-preserving).

---

## Non-goals (v1)

- Replacing [campaign-hub-spoke-landing-architecture](../campaign-hub-spoke-landing-architecture/spec.md) runtime.
- Full **milestone interview** creator tool (see CHS tasks); stub OK.
- **AI-generated** personalized copy per player (use templates + data).
- Resolving all [house integration](../bruised-banana-house-integration/ANALYSIS.md) blockers in one release.

---

## Acceptance (release gate)

- [ ] `spec.md` / `plan.md` / `tasks.md` complete; **linked specs** updated (see tasks).
- [ ] `npm run build` && `npm run check` pass.
- [ ] **North star verification quest** (§ above) executed; pass recorded or gaps filed as one follow-up each.
- [ ] Playtest: new player can name **one** action they took that **felt** like it moved the residency (subjective check complements the quest).

---

## Changelog

| Date | |
|------|--|
| 2026-03-22 | Initial spec kit — Sage consult: campaign doesn’t land; bridge milestones ↔ player guidance. |
| 2026-03-27 | **North star loop** (v1 contract), verification quest, plan traceability table; tasks **BBMT-NS**. |
