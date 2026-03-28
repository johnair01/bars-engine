# Spec: Emergent campaign from BAR interview (allyship intake → water → hub)

## Purpose

Enable a **repeatable residency pattern** for **emergent allyship campaigns**: a steward sends someone (e.g. a friend after a life shock) a **BAR-backed invitation** whose CYOA is a **formal interview** that collects **structured intent**—**without** fixing upfront **which** named sub-campaign or allyship branch the work will become. A **Bruised Banana (or parent `campaignRef`) admin** then **waters** that intake (adds institutional context, names the arc, binds deck/period) and **materializes** a **child campaign** with **campaign hub + eight spokes**, with **period 1** aligned to **Kotter stage 1 — Create a sense of urgency** (spoke landings, copy, and CYOA tone weighted to urgency). **Invitees** can **learn about the parent residency** while onboarding; **new players** can complete the **same class of interview in-app**; when **subcampaign capacity** allows and an interview produces a **credible subcampaign idea**, the system supports **seeding that idea into the parent hub’s BAR / quest pool** (marketplace or house pool per [campaign-marketplace-slots](../campaign-marketplace-slots/spec.md)) and **occupying a slot**.

**Problem:** Today, **campaign identity** and **hub/spoke scaffolding** assume a **known** `campaignRef` and creator path. **Life events** and **allyship** often need **interview-first** capture, then **steward synthesis**, then **public hub**—the inverse order. Thunder is the **first concrete instance**; the product needs the **general pipeline**.

**Practice:** Deftness — spec kit first; contracts before UI; deterministic interview templates before optional AI summarization for “watering.”

---

## Relationship to existing specs

| Spec | Relationship |
|------|----------------|
| [campaign-hub-spoke-landing-architecture](../campaign-hub-spoke-landing-architecture/spec.md) (CHS) | **Target shape** of the **materialized** campaign: hub → spoke CYOA → landings; **8 spokes ↔ hexagram order**; **period** bundles Kotter theme (v1 target: **Create Urgency** for first period). |
| [campaign-onboarding-cyoa](../campaign-onboarding-cyoa/spec.md) (COC) | **Invitations are onboarding CYOA**; **event_invite BAR** (or successor) carries the **interview**; **funding / support** must remain visible on campaign surfaces after spawn. |
| [creator-milestone-interview](../creator-milestone-interview/spec.md) (CMI) | **Creator** interview today is **post-campaign** (`/campaign/[ref]/interview`). This spec is **pre-campaign / latent**: answers attach to a **latent intake** until **water → create child campaign**. CMI **Phase 2** (“supporter sub-campaign forking”) is a **sibling**—merge tasks carefully. |
| [campaign-subcampaigns](../campaign-subcampaigns/spec.md) (CSC) | **Parent/child** `campaignRef` ontology, nested refs, reconciliation with awareness runs (**ACEC**). Child “Support Thunder” hangs under **Bruised Banana** (or configured parent). |
| [campaign-marketplace-slots](../campaign-marketplace-slots/spec.md) (CMS) | **Slots** and **BAR pool** listing for **player-originated subcampaign ideas** after interview + steward approval. |
| [campaign-branch-seeds](../campaign-branch-seeds/spec.md) (CBS) | **Metaphor kin**: “seed” here is **campaign-level** (intake BAR / latent record), not only **Passage** graph seeds; **water** language aligns. |
| [donation-self-service-wizard](../donation-self-service-wizard/spec.md) | Post-spawn **support** paths for the **child** campaign must follow **ref** + wizard contracts (COC Phase G). |

---

## Design decisions

| Topic | Decision |
|-------|----------|
| **Intake carrier** | **v1:** Reuse **`event_invite`** (or **`CustomBar` type** agreed with EIP) as the **shareable link**; **storyContent** (or linked `Adventure`) implements the **interview CYOA**. Alternative long-term: dedicated `intake` BAR type—defer unless schema pain. |
| **Latent vs campaign row** | **v1 contract:** Persist answers as a **latent intake** record (name TBD in implementation) keyed by **BAR id + player session / account**, **status**: `draft` → `submitted` → `watered` → `spawned_campaign`. **Do not** require a real **`Instance`/child `campaignRef`** until **admin waters**. |
| **Who can water** | **Parent** residency **admin** and **owner/steward** on **`campaignRef=bruised-banana`** (or configured parent); audit log of **who** watered and **what** context was added. |
| **Spawned artifact** | **New child campaign** (per CSC): own **`campaignRef`** (e.g. `support-thunder-…`), **`Instance`** (or linkage rules in CSC), **hub URL**, **eight spokes** wired to **period 1 — Create Urgency** (Kotter): spoke templates, landing copy, and **deck/period** config per CHS. |
| **Repeatability** | **Interview templates** are **data-driven** (like CMI templates): e.g. `allyship_intake_v1`, **admin-assignable** to a BAR; Thunder is **one instance** of the template + copy overrides. |
| **Subcampaign ideas from new players** | **Gated**: **slots available** (CMS or CSC cap) + **steward approval** (or auto-rule TBD) before **BAR seeds** hit **parent pool**; interview output must map to **structured fields** (title, domain, urgency statement, asks). |
| **Parent visibility** | Every **child** invite and **hub** shows **clear lineage**: “Part of **Bruised Banana residency**” with link to **parent hub** / learn-more CYOA slice (COC). |

---

## Conceptual model

| Dimension | Value |
|-----------|--------|
| **WHO** | **Target** (Thunder); **sender** (you); **parent stewards**; **new players** taking interview for **slot**; **admins** watering. |
| **WHAT** | **Interview answers** → **latent intake** → **watered context** → **child campaign** (hub + 8 spokes, urgency-skewed period 1) + optional **BAR pool seeds**. |
| **WHERE** | **Invite URL** (`/invite/event/[barId]` or successor); **in-app** same flow under **`ref`**; **admin** console under parent campaign. |
| **Energy** | **Show Up** (solidarity) + **Clean Up** (processing shock) in copy; **Grow Up** in allyship learning paths. |
| **Personal throughput** | Interview choices may tag **four moves** + **GM face** (CHS early beats) for downstream spoke routing. |

### Flow (high level)

```text
[Steward] creates BAR + allyship_intake template
       → sends link to [Target]
       → [Target] completes interview CYOA (anonymous or authed)
       → latent intake = submitted
[Admin] reviews + waters (context, name, deck bindings)
       → child campaignRef + Instance + hub + 8 spokes (period 1 = Urgency)
       → invitees to child see parent BB + support paths
[New player] in-app interview (if slots) → optional seed → steward OK → CMS slot / pool
```

---

## API contracts (v1 — draft signatures)

Implementations may be **server actions** or **route handlers**; finalize in `plan.md`.

### `submitAllyshipIntake`

**Input:** `{ barId: string; answers: InterviewAnswer[]; sessionId?: string }`  
**Output:** `{ ok: true; intakeId: string } | { ok: false; error: string }`

### `listPendingIntakesForParent` (steward/admin)

**Input:** `{ parentCampaignRef: string }`  
**Output:** `{ intakes: LatentIntakeSummary[] }`

### `waterIntakeAndSpawnCampaign`

**Input:** `{ intakeId: string; childCampaignRef: string; childTitle: string; stewardNotes: string; deckConfig: … }`  
**Output:** `{ ok: true; hubUrl: string; campaignRef: string } | { ok: false; error: string }`

### `proposeSubcampaignFromInterview` (optional phase)

**Input:** `{ parentCampaignRef: string; answers: … }`  
**Output:** `{ ok: true; proposalId: string }` — does **not** consume slot until steward approve + CMS rules satisfied.

---

## User stories

### P1 — Send interview without knowing final campaign name

**As a** steward, **I want** to send a **BAR invite** that only runs the **allyship interview**, **so that** Thunder can respond **before** we commit to a public campaign slug.

**Acceptance:** Link opens interview; completion persists **latent intake**; no child `campaignRef` required.

### P1 — Admin waters and spawns hub + spokes

**As a** Bruised Banana admin, **I want** to read submitted answers, add **context**, and **generate** the **Support [Name] hub** with **eight spokes** in **Create Urgency** framing, **so that** the collective field matches Kotter stage 1.

**Acceptance:** After spawn, `/campaign/hub?ref=<child>` works; spokes exist per CHS; period 1 theme documented in hub copy or config.

### P2 — Invites bridge child + parent

**As an** invitee, **I want** to **learn about Bruised Banana** and **this support campaign**, **so that** I am not siloed in a micro-campaign.

**Acceptance:** Child hub / invite surfaces **parent** link and COC-compliant **support** affordances.

### P2 — Repeatable template

**As an** operator, **I want** **Thunder’s** flow to be a **template** for the **next** emergent campaign, **so that** we do not rebuild from scratch.

**Acceptance:** Second BAR can reuse `allyship_intake_v1` with different copy; intakes are **isolated** per BAR / intake id.

### P3 — New players, slots, pool (CSC + CMS)

**As a** new player, **I want** to complete an **in-app interview** and, if **slots** exist, **seed** a **subcampaign idea** into the **parent pool**, **so that** the residency scales participation.

**Acceptance:** gated by **capacity** + **steward approval**; seeds appear in steward queue / marketplace rules per CMS.

---

## Functional requirements (phased)

### Phase A — Latent intake + BAR interview

- **FR-A0 (ops, shipped):** **Thunder v1** interview as validated `EventInviteStory` — [`allyship-intake-thunder.template.json`](../../../src/lib/event-invite-story/templates/allyship-intake-thunder.template.json), CLI `scripts/apply-invite-template.ts --template=allyship-thunder`, operator runbook [`docs/runbooks/EMERGENT_ALLYSHIP_INTAKE_OPS.md`](../../../docs/runbooks/EMERGENT_ALLYSHIP_INTAKE_OPS.md).
- **FR-A1 (shipped for `allyship-intake*` stories):** Choice **path** stored in `LatentAllyshipIntake.pathJson` on **ending**; `playerId` when logged in; `clientSessionId` + `senderNote` optional; gated by story `id` prefix `allyship-intake` on `/invite/event/[barId]`.
- **FR-A2 (minimal shipped):** `/admin/allyship-intakes?ref=` lists intakes for bars matching parent **`campaignRef`**.
- **FR-A3:** No automatic campaign creation on submit.

### Phase B — Water → spawn (CHS + CSC)

- **FR-B1:** **Water** action creates **child** campaign per **CSC** + **Instance** rules.
- **FR-B2:** **Hub + 8 spokes** generated from **templates** (Twine/Adventure seeds or CHS portal pattern); **period 1** = **Create Urgency** (Kotter) — copy + deck binding documented.
- **FR-B3:** **Idempotency:** one intake → one child (unless explicit “duplicate” admin action).

### Phase C — Parent bridge + support

- **FR-C1:** Child surfaces **parent** residency links (COC, BBMT as applicable).
- **FR-C2:** **Donate / wizard** **`ref`** resolves for **child** with fallback education about parent fundraiser.

### Phase D — In-app + slots + pool

- **FR-D1:** Same interview **available** inside app under **parent** campaign context.
- **FR-D2:** **Slot** check + **proposal** queue + **CMS** / **CSC** integration for **approved** seeds.

---

## Non-goals (v1)

- Fully automated **naming** of child campaigns from AI without **human** confirm.
- Replacing **CMI creator interview** UI wholesale (integrate via shared **template** components later).

---

## Persisted data & Prisma

> **TBD in Phase A tasks:** exact models (`LatentIntake`, `AllyshipInterviewTemplate`, links to `CustomBar`, `Player`). Any schema change requires **`prisma migrate dev`** + committed migration per [prisma-migration-discipline](../../.agents/skills/prisma-migration-discipline/SKILL.md).

| Check | Done |
|-------|------|
| Models named in **Design decisions** reflected in `schema.prisma` | [x] `LatentAllyshipIntake` |
| `tasks.md` includes migration + `npm run db:sync` / `npm run check` | [x] |

---

## Verification quest (UX)

**Story:** Steward sends **Thunder intake** link → completes interview → admin waters → **Support Thunder hub** loads with **eight spokes** and **urgency** framing; invitee sees **Bruised Banana** bridge; optional: second template instance proves **repeatability**.

- **Cert id (proposal):** `cert-emergent-campaign-bar-interview-v1`
- **Seed script:** `npm run seed:cert:emergent-campaign-bar-interview` (add in `tasks.md` when implementing)

Narrative ties to **Bruised Banana residency** solidarity and **engine** improvement per [spec-kit-translator § Verification Quests](../../.agents/skills/spec-kit-translator/SKILL.md).

---

## Open questions

1. **Anonymous completion:** Same as CMI `shareToken` pattern vs require login after step N?
2. **Child `campaignRef` slug:** Human-typed at water time vs generated + editable?
3. **Spoke content:** Seed from **one** Twine template vs **eight** stub adventures filled iteratively?
4. **Merge with CMI Phase 2:** Single **template engine** for creator vs allyship intake—desirable; schedule in **plan.md**.
